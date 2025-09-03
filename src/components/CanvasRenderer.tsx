import React, { useRef, useEffect, useCallback } from 'react';

interface CanvasRendererProps {
    currentImageToDraw: HTMLImageElement | null;
    scale: number;
    offset: { x: number; y: number };
    onDraw?: () => void;
    canvasRefCallback?: (canvas: HTMLCanvasElement | null) => void;
    pingAnimationActive?: boolean;
    pingAnimationTime?: number;
    selectedColorId?: number | null;
    statistics?: any[];
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({ 
    currentImageToDraw, 
    scale, 
    offset, 
    onDraw,
    canvasRefCallback,
    pingAnimationActive = false,
    pingAnimationTime = 0,
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
        if (!pingAnimationActive || !currentImageToDraw) return;
        
        // Find the remaining pixels for the selected color
        const selectedRow = statistics.find((row: any) => row.color?.id === selectedColorId);
        if (!selectedRow || selectedRow.remain === 0) return;
        
        // This is a simplified implementation
        // In a real implementation, you would need access to the difference image data
        // to find the positions of the remaining pixels
        
        // For demonstration, we'll draw circles at random positions
        ctx.save();
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
        
        const progress = Math.min(pingAnimationTime / 2000, 1);
        const radius = progress * 50;
        const alpha = 1 - progress;
        
        ctx.globalAlpha = alpha;
        
        // Draw sample circles (replace with actual remaining pixel positions)
        for (let i = 0; i < Math.min(selectedRow.remain, 20); i++) {
            const x = Math.random() * ctx.canvas.width;
            const y = Math.random() * ctx.canvas.height;
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.stroke();
        }
        
        ctx.restore();
    }, [pingAnimationActive, pingAnimationTime, selectedColorId, statistics, currentImageToDraw]);

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
