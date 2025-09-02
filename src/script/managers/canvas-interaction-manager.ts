import { Template } from '../template';

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

    resetView(): void {
        this.scale = 1;
        this.offset = { x: 0, y: 0 };
        this.onScaleChange?.(this.scale);
        this.onOffsetChange?.(this.offset);
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
            console.log('Mouse move while dragging');
            const deltaX = e.clientX - this.lastMousePosition.x;
            const deltaY = e.clientY - this.lastMousePosition.y;
            
            this.offset.x += deltaX;
            this.offset.y += deltaY;
            
            // Keep image within canvas bounds
            this.applyBounds();
            
            this.lastMousePosition = { x: e.clientX, y: e.clientY };
            this.onOffsetChange?.(this.offset);
        }
    }

    private handleMouseUp(): void {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
    }

    private handleWheel(e: WheelEvent): void {
        e.preventDefault();
        
        const zoomIntensity = 0.1;
        const mouseX = e.clientX - this.canvas.getBoundingClientRect().left;
        const mouseY = e.clientY - this.canvas.getBoundingClientRect().top;
        
        const wheel = e.deltaY < 0 ? 1 : -1;
        const zoom = Math.exp(wheel * zoomIntensity);
        
        // Calculate mouse position in canvas coordinates
        const mousePointX = (mouseX - this.offset.x) / this.scale;
        const mousePointY = (mouseY - this.offset.y) / this.scale;
        
        // Apply zoom
        const newScale = Math.max(0.1, Math.min(10, this.scale * zoom));
        
        // Adjust offset to zoom towards mouse position
        this.offset.x = mouseX - mousePointX * newScale;
        this.offset.y = mouseY - mousePointY * newScale;
        
        this.scale = newScale;
        
        // Keep image within canvas bounds
        this.applyBounds();
        
        this.onScaleChange?.(this.scale);
        this.onOffsetChange?.(this.offset);
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
        
        // Helper function to clamp a value between min and max
        const clamp = (value: number, min: number, max: number): number => {
            return Math.max(min, Math.min(max, value));
        };
        
        // Calculate bounds for offset
        if (scaledWidth <= canvasWidth) {
            // Allow movement within the bounds of the canvas when image is smaller
            // The image can be positioned anywhere as long as it stays within the canvas
            const minOffsetX = 0;
            const maxOffsetX = canvasWidth - scaledWidth;
            this.offset.x = clamp(this.offset.x, minOffsetX, maxOffsetX);
        } else {
            // Allow panning but don't show empty space beyond the image edges
            // When image is larger than canvas, offset can be negative to show the right part of the image
            const minOffsetX = scaledWidth - canvasWidth;
            const maxOffsetX = 0;
            // Ensure min is always less than max
            const actualMinOffsetX = Math.min(minOffsetX, maxOffsetX);
            const actualMaxOffsetX = Math.max(minOffsetX, maxOffsetX);
            this.offset.x = clamp(this.offset.x, actualMinOffsetX, actualMaxOffsetX);
        }
        
        if (scaledHeight <= canvasHeight) {
            // Allow movement within the bounds of the canvas when image is smaller
            const minOffsetY = 0;
            const maxOffsetY = canvasHeight - scaledHeight;
            this.offset.y = clamp(this.offset.y, minOffsetY, maxOffsetY);
        } else {
            // Allow panning but don't show empty space beyond the image edges
            const minOffsetY = scaledHeight - canvasHeight;
            const maxOffsetY = 0;
            // Ensure min is always less than max
            const actualMinOffsetY = Math.min(minOffsetY, maxOffsetY);
            const actualMaxOffsetY = Math.max(minOffsetY, maxOffsetY);
            this.offset.y = clamp(this.offset.y, actualMinOffsetY, actualMaxOffsetY);
        }
        
        // Debug logging
        if (originalOffsetX !== this.offset.x || originalOffsetY !== this.offset.y) {
            console.log(`applyBounds: offset adjusted from (${originalOffsetX}, ${originalOffsetY}) to (${this.offset.x}, ${this.offset.y})`);
            console.log(`  Canvas: ${canvasWidth}x${canvasHeight}, Scaled image: ${scaledWidth}x${scaledHeight}`);
            
            if (scaledWidth <= canvasWidth) {
                console.log(`  X bounds: [0, ${canvasWidth - scaledWidth}]`);
            } else {
                // Show bounds in the correct order (min, max)
                const minOffsetX = scaledWidth - canvasWidth;
                const maxOffsetX = 0;
                const actualMinOffsetX = Math.min(minOffsetX, maxOffsetX);
                const actualMaxOffsetX = Math.max(minOffsetX, maxOffsetX);
                console.log(`  X bounds: [${actualMinOffsetX}, ${actualMaxOffsetX}]`);
            }
            
            if (scaledHeight <= canvasHeight) {
                console.log(`  Y bounds: [0, ${canvasHeight - scaledHeight}]`);
            } else {
                const minOffsetY = scaledHeight - canvasHeight;
                const maxOffsetY = 0;
                const actualMinOffsetY = Math.min(minOffsetY, maxOffsetY);
                const actualMaxOffsetY = Math.max(minOffsetY, maxOffsetY);
                console.log(`  Y bounds: [${actualMinOffsetY}, ${actualMaxOffsetY}]`);
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
