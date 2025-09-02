import { Template } from '../template';
import { clamp, debug } from '../../utils';

export class CanvasInteractionManager {
    private canvas: HTMLCanvasElement;
    private scale: number = 1;
    private offset: { x: number; y: number } = { x: 0, y: 0 };
    private isDragging: boolean = false;
    private lastMousePosition: { x: number; y: number } = { x: 0, y: 0 };
    private currentTemplate?: Template;
    private onScaleChange?: (scale: number) => void;
    private onOffsetChange?: (offset: { x: number; y: number }) => void;

    constructor(
        canvas: HTMLCanvasElement,
        onScaleChange?: (scale: number) => void,
        onOffsetChange?: (offset: { x: number; y: number }) => void
    ) {
        this.canvas = canvas;
        this.onScaleChange = onScaleChange;
        this.onOffsetChange = onOffsetChange;
        this.setupEventListeners();
    }

    setTemplate(template?: Template): void {
        this.currentTemplate = template;
        this.resetView();
    }

    setScale(newScale: number): void {
        this.scale = newScale;
        // Apply bounds when scale changes
        this.applyBounds();
        // Notify listeners
        if (this.onScaleChange) {
            this.onScaleChange(this.scale);
        }
    }

    resetView(): void {
        // Update scale through callback
        if (this.onScaleChange) {
            this.onScaleChange(1);
        }
        this.scale = 1;
        
        // Ensure canvas dimensions are up to date
        // The canvas might not have been sized yet, so we need to check its parent
        const container = this.canvas.parentElement;
        if (container) {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        }
        
        // Center the image on the canvas
        if (this.currentTemplate?.templateImage) {
            const img = this.currentTemplate.templateImage;
            // When scale is 1, we want to center the original image
            // The offset is in canvas coordinates, which are not scaled
            const centerX = (this.canvas.width - img.width) / 2;
            const centerY = (this.canvas.height - img.height) / 2;
            this.offset = { x: centerX, y: centerY };
        } else {
            this.offset = { x: 0, y: 0 };
        }
        
        // Update offset through callback
        if (this.onOffsetChange) {
            this.onOffsetChange(this.offset);
        }
    }

    private setupEventListeners(): void {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });

        // Touch events
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    private handleMouseDown(e: MouseEvent): void {
        console.log('Mouse down on canvas');
        this.isDragging = true;
        this.lastMousePosition = { x: e.clientX, y: e.clientY };
        this.canvas.style.cursor = 'grabbing';
    }

    private handleMouseMove(e: MouseEvent): void {
        if (this.isDragging) {
            const deltaX = e.clientX - this.lastMousePosition.x;
            const deltaY = e.clientY - this.lastMousePosition.y;
            
            this.offset.x += deltaX;
            this.offset.y += deltaY;
            
            // Keep image within canvas bounds
            this.applyBounds();
            
            this.lastMousePosition = { x: e.clientX, y: e.clientY };
            this.onOffsetChange?.(this.offset);
            
            // Test output in one line
            console.log(`Mouse drag: delta(${deltaX},${deltaY}), offset(${this.offset.x},${this.offset.y})`);
        }
    }

    private handleMouseUp(): void {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
    }

    private handleWheel(e: WheelEvent): void {
        e.preventDefault();
        
        // Add debug message
        debug(`handleWheel called: deltaY=${e.deltaY}, deltaMode=${e.deltaMode}`);
        
        // Use a smaller zoom intensity for smoother zooming
        const zoomIntensity = 0.05;
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Determine zoom direction based on deltaY
        // Normalize wheel delta to handle different mouse sensitivities
        const wheelDelta = Math.sign(e.deltaY);
        const zoomFactor = Math.exp(-wheelDelta * zoomIntensity);
        
        // Calculate new scale with bounds
        const newScale = Math.max(0.1, Math.min(10, this.scale * zoomFactor));
        
        // Calculate mouse position in canvas coordinates before scaling
        const mouseCanvasX = (mouseX - this.offset.x) / this.scale;
        const mouseCanvasY = (mouseY - this.offset.y) / this.scale;
        
        // Adjust offset to zoom towards mouse position
        // This keeps the point under the mouse fixed during zoom
        this.offset.x = mouseX - mouseCanvasX * newScale;
        this.offset.y = mouseY - mouseCanvasY * newScale;
        
        // Always update scale through the callback to ensure synchronization with RightPanel
        if (this.onScaleChange) {
            this.onScaleChange(newScale);
        }
        // Always update our internal scale
        this.scale = newScale;
        
        // Update offset through the callback
        if (this.onOffsetChange) {
            this.onOffsetChange(this.offset);
        }
        // Apply bounds to keep the image within the canvas
        this.applyBounds();
    }

    private handleTouchStart(e: TouchEvent): void {
        if (e.touches.length === 1) {
            // Single touch for panning
            this.isDragging = true;
            this.lastMousePosition = { 
                x: e.touches[0].clientX, 
                y: e.touches[0].clientY 
            };
            e.preventDefault();
        } else if (e.touches.length === 2) {
            // Two touches for pinch-to-zoom
            // You can implement pinch-to-zoom here if needed
            e.preventDefault();
        }
    }

    private handleTouchMove(e: TouchEvent): void {
        if (this.isDragging && e.touches.length === 1) {
            const deltaX = e.touches[0].clientX - this.lastMousePosition.x;
            const deltaY = e.touches[0].clientY - this.lastMousePosition.y;
            
            this.offset.x += deltaX;
            this.offset.y += deltaY;
            
            // Keep image within canvas bounds
            this.applyBounds();
            
            this.lastMousePosition = { 
                x: e.touches[0].clientX, 
                y: e.touches[0].clientY 
            };
            this.onOffsetChange?.(this.offset);
            e.preventDefault();
        }
    }

    private handleTouchEnd(): void {
        this.isDragging = false;
    }

    private applyBounds(): void {
        if (!this.currentTemplate?.templateImage) return;

        const img = this.currentTemplate.templateImage;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // Calculate image dimensions after scaling
        const scaledWidth = img.width * this.scale;
        const scaledHeight = img.height * this.scale;
        
        // Store original offset for debugging
        const originalOffsetX = this.offset.x;
        const originalOffsetY = this.offset.y;
        
        // Calculate bounds for offset
        if (scaledWidth <= canvasWidth) {
            // When image is smaller than canvas, center it by allowing offsets between 0 and canvasWidth - scaledWidth
            // But since the image can be positioned anywhere, we need to keep it within the canvas
            const minOffsetX = 0;
            const maxOffsetX = canvasWidth - scaledWidth;
            this.offset.x = clamp(this.offset.x, minOffsetX, maxOffsetX);
        } else {
            // When image is larger than canvas, offset can be negative to pan across the image
            // The valid range is [canvasWidth - scaledWidth, 0] which is [-N, 0] where N > 0
            const minOffsetX = canvasWidth - scaledWidth; // This will be negative
            const maxOffsetX = 0;
            this.offset.x = clamp(this.offset.x, minOffsetX, maxOffsetX);
        }
        
        if (scaledHeight <= canvasHeight) {
            // When image is smaller than canvas
            const minOffsetY = 0;
            const maxOffsetY = canvasHeight - scaledHeight;
            this.offset.y = clamp(this.offset.y, minOffsetY, maxOffsetY);
        } else {
            // When image is larger than canvas
            const minOffsetY = canvasHeight - scaledHeight; // This will be negative
            const maxOffsetY = 0;
            this.offset.y = clamp(this.offset.y, minOffsetY, maxOffsetY);
        }
        
        // Debug logging
        if (originalOffsetX !== this.offset.x || originalOffsetY !== this.offset.y) {
            debug(`applyBounds: offset adjusted from (${originalOffsetX}, ${originalOffsetY}) to (${this.offset.x}, ${this.offset.y})`);
            debug(`  Canvas: ${canvasWidth}x${canvasHeight}, Scaled image: ${scaledWidth}x${scaledHeight}`);
            
            if (scaledWidth <= canvasWidth) {
                debug(`  X bounds: [0, ${canvasWidth - scaledWidth}]`);
            } else {
                debug(`  X bounds: [${canvasWidth - scaledWidth}, 0]`);
            }
            
            if (scaledHeight <= canvasHeight) {
                debug(`  Y bounds: [0, ${canvasHeight - scaledHeight}]`);
            } else {
                debug(`  Y bounds: [${canvasHeight - scaledHeight}, 0]`);
            }
        }
        
        // Update the offset through the callback
        this.onOffsetChange?.(this.offset);
    }

    getScale(): number {
        return this.scale;
    }

    getOffset(): { x: number; y: number } {
        return this.offset;
    }

    cleanup(): void {
        // Remove event listeners if needed
        // For now, we'll rely on garbage collection
    }
}
