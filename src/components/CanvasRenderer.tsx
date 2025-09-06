import React from 'react';
import { EventManager } from '../managers/event-manager';
import { Point } from '../managers/canvas-interaction-manager';
import { debug } from '../utils';
import { BACKGROUND_IMAGE_OPACITY } from '../settings';

export interface Ping {
    startTime: number;
    centerX: number;
    centerY: number;
    radius: number;
}

interface CanvasRendererProps {
    currentImageToDraw: HTMLImageElement | null;
    overlayImageToDraw: HTMLImageElement | null;
    canvasRefCallback?: (canvas: HTMLCanvasElement | null) => void;
    pingAnimations?: Ping[];
}

interface CanvasRendererState {
    // State is managed through refs and external events
}

/**
 * Class component for rendering canvas with image transformations and animations
 * Handles drawing of template images with zoom/pan support and ping animations
 */
export class CanvasRenderer extends React.Component<CanvasRendererProps, CanvasRendererState> {
    private eventManager: EventManager;
    private offset: Point = { x: 0, y: 0 };
    private scale: number = 1;
    private canvasRef: React.RefObject<HTMLCanvasElement>;
    private animationFrameId: number = 0;

    /**
     * Creates a new CanvasRenderer instance
     * @param props Component properties
     */
    constructor(props: CanvasRendererProps) {
        super(props);
        debug('[CanvasRenderer.constructor] Creating CanvasRenderer instance');
        this.eventManager = EventManager.getInstance();
        this.canvasRef = React.createRef();
        this.handleCanvasMovement = this.handleCanvasMovement.bind(this);
    }

    /**
     * Handles canvas movement events to update offset and scale
     * @param event Canvas movement event arguments
     */
    private handleCanvasMovement(event: any): void {
        this.offset = event.offset;
        this.scale = event.scale;
    }

    /**
     * Helper function to draw image with transform
     * @param ctx Canvas rendering context
     * @param image Image to draw
     */
    private drawImageWithTransform(ctx: CanvasRenderingContext2D, image: HTMLImageElement, opacity: number = 1): void {
        // Save the current context
        ctx.save();
        
        // Set global alpha if opacity is specified
        if (opacity !== 1) {
            ctx.globalAlpha = opacity;
        }

        // Disable image smoothing to keep pixels sharp
        ctx.imageSmoothingEnabled = false;

        // Use transform instead of separate translate and scale
        ctx.transform(this.scale, 0, 0, this.scale, this.offset.x, this.offset.y);

        // Draw the image at the top-left corner (0,0)
        ctx.drawImage(image, 0, 0);

        // Restore the context
        ctx.restore();
    }

    /**
     * Draws ping animations on the canvas
     * @param ctx Canvas rendering context
     */
    private drawPingAnimation(ctx: CanvasRenderingContext2D): void {
        if (!this.props.pingAnimations || this.props.pingAnimations.length === 0) {
            return;
        }

        ctx.save();
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;

        const currentTime = Date.now();

        // Draw each ping
        for (const ping of this.props.pingAnimations) {
            const elapsed = currentTime - ping.startTime;
            const progress = Math.min(elapsed / 1000, 1); // 1 second duration
            const alpha = 1 - progress;

            ctx.globalAlpha = alpha;

            // Convert image coordinates to canvas coordinates
            const canvasX = this.offset.x + ping.centerX * this.scale;
            const canvasY = this.offset.y + ping.centerY * this.scale;

            // Draw the circle in canvas coordinates with fixed radius
            ctx.beginPath();
            ctx.arc(canvasX, canvasY, ping.radius, 0, 2 * Math.PI);
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * Main drawing method that orchestrates canvas rendering
     */
    private drawCanvas(): void {
        const canvas = this.canvasRef.current;
        if (!canvas) {
            debug('[CanvasRenderer.drawCanvas] Canvas reference is null');
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            debug('[CanvasRenderer.drawCanvas] Could not get 2D context');
            return;
        }

        // Set canvas dimensions to match the container
        const container = canvas.parentElement;
        if (container) {
            // Only update dimensions if they changed to avoid unnecessary clears
            if (canvas.width !== container.clientWidth || canvas.height !== container.clientHeight) {
                debug(`[CanvasRenderer.drawCanvas] Resizing canvas to ${container.clientWidth}x${container.clientHeight}`);
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
            }
        }

        // Clear the canvas first
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Draw the main image
        if (this.props.currentImageToDraw) {
            this.drawImageWithTransform(ctx, this.props.currentImageToDraw);
        } else {
            debug('[CanvasRenderer.drawCanvas] No main image to draw');
        }
        
        // Draw the overlay image with transparency if it exists
        if (this.props.overlayImageToDraw) {
            this.drawImageWithTransform(ctx, this.props.overlayImageToDraw, BACKGROUND_IMAGE_OPACITY);
        }

        // Draw ping animation on top
        this.drawPingAnimation(ctx);
    }

    /**
     * Animation loop method that continuously redraws the canvas
     */
    private animate(): void {
        this.drawCanvas();
        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    }

    /**
     * React lifecycle method called after component mounts
     * Sets up event listeners and starts animation loop
     */
    componentDidMount(): void {
        debug('[CanvasRenderer.componentDidMount] Component mounted');
        this.eventManager.on('canvas:movement', this.handleCanvasMovement);

        // Set up canvas ref callback
        if (this.canvasRef.current && this.props.canvasRefCallback) {
            debug('[CanvasRenderer.componentDidMount] Calling canvas ref callback');
            this.props.canvasRefCallback(this.canvasRef.current);
        }

        // Start the animation loop
        debug('[CanvasRenderer.componentDidMount] Starting animation loop');
        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    }

    /**
     * React lifecycle method called before component unmounts
     * Cleans up event listeners and stops animation loop
     */
    componentWillUnmount(): void {
        debug('[CanvasRenderer.componentWillUnmount] Component unmounting');
        this.eventManager.off('canvas:movement', this.handleCanvasMovement);

        // Clean up canvas ref callback
        if (this.props.canvasRefCallback) {
            debug('[CanvasRenderer.componentWillUnmount] Clearing canvas ref callback');
            this.props.canvasRefCallback(null);
        }

        // Stop the animation loop
        debug('[CanvasRenderer.componentWillUnmount] Stopping animation loop');
        cancelAnimationFrame(this.animationFrameId);
    }

    /**
     * React lifecycle method called when props update
     * @param prevProps Previous component properties
     */
    componentDidUpdate(prevProps: CanvasRendererProps): void {
        debug('[CanvasRenderer.componentDidUpdate] Component updated');
        if (prevProps.currentImageToDraw !== this.props.currentImageToDraw) {
            debug('[CanvasRenderer.componentDidUpdate] Main image to draw changed');
        }
        if (prevProps.overlayImageToDraw !== this.props.overlayImageToDraw) {
            debug('[CanvasRenderer.componentDidUpdate] Overlay image to draw changed');
        }
        if (prevProps.pingAnimations !== this.props.pingAnimations) {
            debug(`[CanvasRenderer.componentDidUpdate] Ping animations changed: ${this.props.pingAnimations?.length || 0} animations`);
        }
    }

    /**
     * React render method
     * @returns Rendered canvas element
     */
    render(): React.ReactNode {
        debug('[CanvasRenderer.render] Rendering canvas element');
        return (
            <canvas
                ref={this.canvasRef}
                className="canvas-element"
                style={{ pointerEvents: 'auto' }}
            />
        );
    }
}
