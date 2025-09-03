import React, { useRef, useEffect, useCallback } from 'react';

export interface Ping {
    startTime: number;
    centerX: number;
    centerY: number;
    radius: number;
}

interface CanvasRendererProps {
    currentImageToDraw: HTMLImageElement | null;
    scale: number;
    offset: { x: number; y: number };
    onDraw?: () => void;
    canvasRefCallback?: (canvas: HTMLCanvasElement | null) => void;
    pingAnimations?: Ping[];
    selectedColorId?: number | null;
    statistics?: any[];
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({ 
    currentImageToDraw, 
    scale, 
    offset, 
    onDraw,
    canvasRefCallback,
    pingAnimations = [],
    selectedColorId = null,
    statistics = []
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // Helper function to draw image with transform
    const drawImageWithTransform = useCallback((ctx: CanvasRenderingContext2D, image: HTMLImageElement) => {
        // Clear the canvas
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Disable image smoothing to keep pixels sharp
        ctx.imageSmoothingEnabled = false;
        
        // Save the current context
        ctx.save();
        
        // Use transform instead of separate translate and scale
        ctx.transform(scale, 0, 0, scale, offset.x, offset.y);
        
        // Draw the image at the top-left corner (0,0)
        ctx.drawImage(image, 0, 0);
        
        // Restore the context
        ctx.restore();
    }, [scale, offset]);

    // Draw ping animation
    const drawPingAnimation = useCallback((ctx: CanvasRenderingContext2D) => {
        if (pingAnimations.length === 0) return;
        
        ctx.save();
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        
        // Reset transform to draw in canvas coordinates
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        const currentTime = Date.now();
        
        // Draw each ping
        for (const ping of pingAnimations) {
            const elapsed = currentTime - ping.startTime;
            const progress = Math.min(elapsed / 1000, 1); // 1 second duration
            const alpha = 1 - progress;
            
            ctx.globalAlpha = alpha;
            
            // Draw the circle
            ctx.beginPath();
            ctx.arc(ping.centerX, ping.centerY, ping.radius, 0, 2 * Math.PI);
            ctx.stroke();
        }
        
        ctx.restore();
    }, [pingAnimations]);

    // Draw the appropriate image
    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas dimensions to match the container
        const container = canvas.parentElement;
        if (container) {
            // Only update dimensions if they changed to avoid unnecessary clears
            if (canvas.width !== container.clientWidth || canvas.height !== container.clientHeight) {
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
            }
        }

        if (currentImageToDraw) {
            drawImageWithTransform(ctx, currentImageToDraw);
        }
        
        // Draw ping animation on top
        drawPingAnimation(ctx);
        
        // Notify parent that drawing is complete
        onDraw?.();
    }, [currentImageToDraw, drawImageWithTransform, onDraw, drawPingAnimation]);

    // Set up canvas ref callback
    useEffect(() => {
        if (canvasRef.current) {
            canvasRefCallback?.(canvasRef.current);
        }
        return () => {
            canvasRefCallback?.(null);
        };
    }, [canvasRefCallback]);

    // Draw when props change
    useEffect(() => {
        drawCanvas();
    }, [drawCanvas]);

    return (
        <canvas
            ref={canvasRef}
            className="canvas-element"
        />
    );
};
