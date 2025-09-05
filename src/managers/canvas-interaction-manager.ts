import { Template } from '../types/template';
import { clamp, debug } from '../utils';
import { EventManager, IEventArgs } from './event-manager';

/**
 * Represents a 2D point with x and y coordinates
 */
export type Point = { x: number; y: number };


/**
 * Manages canvas interactions including panning, zooming, and touch events
 * Handles user input and transforms canvas view accordingly
 */
export class CanvasInteractionManager {
    private eventManager = EventManager.getInstance();

    /** The HTML canvas element being managed */
    private canvas: HTMLCanvasElement;
    /** Current zoom scale (1 = 100%) */
    private scale: number = 1;
    /** Current pan offset in canvas coordinates */
    private offset: Point = { x: 0, y: 0 };
    /** Flag indicating if the user is currently dragging the canvas */
    private isDragging: boolean = false;
    /** Last recorded mouse position for drag calculations */
    private lastMousePosition: Point = { x: 0, y: 0 };
    /** The current template being displayed on the canvas */
    private currentTemplate?: Template;

    /**
     * Creates a new CanvasInteractionManager instance
     * @param canvas The HTML canvas element to manage
     */
    constructor(
        canvas: HTMLCanvasElement
    ) {
        debug('[CanvasInteractionManager.constructor] Creating new CanvasInteractionManager');
        this.canvas = canvas;
        // Set initial cursor style
        this.canvas.style.cursor = 'grab';
        this.setupEventListeners();
        
        // Subscribe to zoom request events
        const eventManager = EventManager.getInstance();
        eventManager.on('canvas:zoom-request', this.handleZoomRequest.bind(this));
        debug('[CanvasInteractionManager.constructor] Subscribed to canvas:zoom-request events');
    }

    /**
     * Sets the current template and resets the view
     * @param template The template to display on the canvas
     */
    setTemplate(template?: Template): void {
        debug(`[CanvasInteractionManager.setTemplate] Setting template: ${template?.name || 'undefined'}`);
        this.currentTemplate = template;
        this.resetView();
    }

    /**
     * Sets the zoom scale and applies bounds constraints
     * @param newScale The new zoom scale value
     */
    setScale(newScale: number): void {
        debug(`[CanvasInteractionManager.setScale] Setting scale from ${this.scale} to ${newScale}`);
        this.scale = newScale;
        // Apply bounds when scale changes
        this.applyBounds();

        // Notify listeners
        this.eventManager.emit('canvas:movement', new CanvasMovementEventArgs(this, this.offset, this.scale));
    }

    /**
     * Resets the canvas view to default position and scale
     * Centers the template image if available
     */
    resetView(): void {
        debug('[CanvasInteractionManager.resetView] Resetting canvas view');
        this.scale = 1;
        
        // Ensure canvas dimensions are up to date
        // The canvas might not have been sized yet, so we need to check its parent
        const container = this.canvas.parentElement;
        if (container) {
            debug(`[CanvasInteractionManager.resetView] Setting canvas dimensions to ${container.clientWidth}x${container.clientHeight}`);
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
            debug(`[CanvasInteractionManager.resetView] Centered template image at (${centerX}, ${centerY})`);
        } else {
            this.offset = { x: 0, y: 0 };
            debug('[CanvasInteractionManager.resetView] No template image, reset offset to (0, 0)');
        }
        
        // Update through callback
        this.eventManager.emit('canvas:movement', new CanvasMovementEventArgs(this, this.offset, this.scale));
    }

    /**
     * Sets up all event listeners for canvas interactions
     */
    private setupEventListeners(): void {
        debug('[CanvasInteractionManager.setupEventListeners] Setting up event listeners');
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
        debug('[CanvasInteractionManager.setupEventListeners] Event listeners setup complete');
    }

    /**
     * Handles mouse down events for starting drag operations
     * @param e Mouse event
     */
    private handleMouseDown(e: MouseEvent): void {
        debug('[CanvasInteractionManager.handleMouseDown] Mouse down on canvas');
        this.isDragging = true;
        this.lastMousePosition = { x: e.clientX, y: e.clientY };
        this.canvas.style.cursor = 'grabbing';
        // Prevent default to avoid text selection and other browser behaviors
        e.preventDefault();
    }

    /**
     * Handles mouse move events for drag operations
     * @param e Mouse event
     */
    private handleMouseMove(e: MouseEvent): void {
        if (this.isDragging) {
            const deltaX = e.clientX - this.lastMousePosition.x;
            const deltaY = e.clientY - this.lastMousePosition.y;
            
            this.offset.x += deltaX;
            this.offset.y += deltaY;
            
            // Keep image within canvas bounds
            this.applyBounds();
            
            this.lastMousePosition = { x: e.clientX, y: e.clientY };
            
            this.eventManager.emit('canvas:movement', new CanvasMovementEventArgs(this, this.offset, this.scale));
            
            debug(`[CanvasInteractionManager.handleMouseMove] Mouse drag: delta(${deltaX},${deltaY}), offset(${this.offset.x},${this.offset.y})`);
            
            // Prevent default during drag
            e.preventDefault();
        }
    }

    /**
     * Handles mouse up events for ending drag operations
     */
    private handleMouseUp(): void {
        debug('[CanvasInteractionManager.handleMouseUp] Mouse up, ending drag');
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
    }

    /**
     * Handles mouse wheel events for zoom operations
     * @param e Wheel event
     */
    private handleWheel(e: WheelEvent): void {
        e.preventDefault();
        e.stopPropagation(); // Prevent event from bubbling up

        debug(`[CanvasInteractionManager.handleWheel] Wheel event: deltaY=${e.deltaY}, deltaMode=${e.deltaMode}`);
        
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
        
        // Always update our internal scale
        this.scale = newScale;
        
        // Apply bounds to keep the image within the canvas
        this.applyBounds();
        
        // Notify position change
        this.eventManager.emit('canvas:movement', new CanvasMovementEventArgs(this, this.offset, this.scale));
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
            
            this.eventManager.emit('canvas:movement', new CanvasMovementEventArgs(this, this.offset, this.scale));
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
        
        // Allow the image to be positioned such that any corner can be at the center of the canvas
        // The center of the canvas is at (canvasWidth/2, canvasHeight/2)
        // To place a corner at the center, the offset needs to be adjusted
        
        // For x-axis:
        // The minimum offset is when the right edge of the image is at the center of the canvas
        // offset.x = canvasWidth/2 - scaledWidth
        // The maximum offset is when the left edge of the image is at the center of the canvas
        // offset.x = canvasWidth/2
        
        // Similarly for y-axis
        const minOffsetX = canvasWidth / 2 - scaledWidth;
        const maxOffsetX = canvasWidth / 2;
        const minOffsetY = canvasHeight / 2 - scaledHeight;
        const maxOffsetY = canvasHeight / 2;
        
        this.offset.x = clamp(this.offset.x, minOffsetX, maxOffsetX);
        this.offset.y = clamp(this.offset.y, minOffsetY, maxOffsetY);
        
        // Debug logging
        if (originalOffsetX !== this.offset.x || originalOffsetY !== this.offset.y) {
            debug(`applyBounds: offset adjusted from (${originalOffsetX}, ${originalOffsetY}) to (${this.offset.x}, ${this.offset.y})`);
            debug(`  Canvas: ${canvasWidth}x${canvasHeight}, Scaled image: ${scaledWidth}x${scaledHeight}`);
            debug(`  X bounds: [${minOffsetX}, ${maxOffsetX}]`);
            debug(`  Y bounds: [${minOffsetY}, ${maxOffsetY}]`);
        }
        
        this.eventManager.emit('canvas:movement', new CanvasMovementEventArgs(this, this.offset, this.scale));
    }

    cleanup(): void {
        // Remove event listeners if needed
        // For now, we'll rely on garbage collection
        
        // Unsubscribe from zoom request events
        const eventManager = EventManager.getInstance();
        eventManager.off('canvas:zoom-request', this.handleZoomRequest.bind(this));
        debug('[CanvasInteractionManager.cleanup] Unsubscribed from canvas:zoom-request events');
    }

    /**
     * Handles zoom request events
     * @param args Zoom request event arguments
     */
    private handleZoomRequest(args: CanvasZoomRequestEventArgs): void {
        debug(`[CanvasInteractionManager.handleZoomRequest] Processing zoom request: ${args.request}`);
        
        switch (args.request) {
            case 'zoom-in':
                this.zoomIn();
                break;
            case 'zoom-out':
                this.zoomOut();
                break;
            case 'zoom-reset':
                this.resetView();
                break;
        }
    }

    /**
     * Zooms in by increasing the scale
     */
    private zoomIn(): void {
        debug('[CanvasInteractionManager.zoomIn] Zooming in');
        const newScale = Math.min(10, this.scale * 1.2);
        this.setScale(newScale);
    }

    /**
     * Zooms out by decreasing the scale
     */
    private zoomOut(): void {
        debug('[CanvasInteractionManager.zoomOut] Zooming out');
        const newScale = Math.max(0.1, this.scale / 1.2);
        this.setScale(newScale);
    }
}

export class CanvasMovementEventArgs implements IEventArgs {
    sender: CanvasInteractionManager;

    offset: Point;
    scale: number;

    constructor(sender: CanvasInteractionManager, offset: Point, scale: number) {        
        this.sender = sender;
        this.offset = offset;
        this.scale = scale;
    }
}

export type CanvasZoomRequest = 'zoom-out' | 'zoom-in' | 'zoom-reset';

export class CanvasZoomRequestEventArgs implements IEventArgs {
    request: CanvasZoomRequest;

    constructor(request: CanvasZoomRequest) {
        this.request = request;
    }
}
