import React, { useRef, useEffect, useCallback } from 'react';

interface CanvasRendererProps {
    currentImageToDraw: HTMLImageElement | null;
    scale: number;
    offset: { x: number; y: number };
    onDraw?: () => void;
    canvasRefCallback?: (canvas: HTMLCanvasElement | null) => void;
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({ 
    currentImageToDraw, 
    scale, 
    offset, 
    onDraw,
    canvasRefCallback
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
        
        // Notify parent that drawing is complete
        onDraw?.();
    }, [currentImageToDraw, drawImageWithTransform, onDraw]);

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
