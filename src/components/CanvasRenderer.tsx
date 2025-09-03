import React, { useRef, useEffect, useCallback } from 'react';

interface CanvasRendererProps {
    currentImageToDraw: HTMLImageElement | null;
    scale: number;
    offset: { x: number; y: number };
    onDraw?: () => void;
    canvasRefCallback?: (canvas: HTMLCanvasElement | null) => void;
    pingAnimations?: { startTime: number }[];
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
        if (pingAnimations.length === 0 || !currentImageToDraw) return;
        
        // Get missing pixels from global storage
        const missingPixels = (window as any).missingPixels || [];
        
        // Filter pixels for the selected color if a color is selected
        // For now, we'll draw all missing pixels
        // In a real implementation, you'd need to check which pixels belong to the selected color
        ctx.save();
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        
        // Reset transform to draw in canvas coordinates
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Draw each animation
        const currentTime = Date.now();
        for (const animation of pingAnimations) {
            const elapsed = currentTime - animation.startTime;
            const progress = Math.min(elapsed / 1000, 1); // 1 second duration
            const radius = progress * 30; // Smaller maximum radius
            const alpha = 1 - progress;
            
            ctx.globalAlpha = alpha;
            
            // Draw circles at missing pixel positions, applying scale and offset
            for (const pixel of missingPixels) {
                // Convert image coordinates to canvas coordinates
                // Add 0.5 to target the center of the pixel
                const canvasX = offset.x + (pixel.x + 0.5) * scale;
                const canvasY = offset.y + (pixel.y + 0.5) * scale;
                
                // Only draw if the pixel is within the visible area
                if (canvasX >= -radius && canvasX <= ctx.canvas.width + radius &&
                    canvasY >= -radius && canvasY <= ctx.canvas.height + radius) {
                    ctx.beginPath();
                    ctx.arc(canvasX, canvasY, radius, 0, 2 * Math.PI);
                    ctx.stroke();
                }
            }
        }
        
        ctx.restore();
    }, [pingAnimations, scale, offset, currentImageToDraw]);

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
