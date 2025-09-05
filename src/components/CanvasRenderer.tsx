// Переделай этот React-компонент в представление в виде `class`. Создай документацию для методов этого файла, а также создай больше `debug`-сообщений. Добавь префиксом в квадратных скобках класс и метод, в котором выводит сообщение. AI!

import React, { useRef, useEffect, useCallback } from 'react';
import { EventManager } from '../managers/event-manager';
import { Point } from '../managers/canvas-interaction-manager';

export interface Ping {
    startTime: number;
    centerX: number;
    centerY: number;
    radius: number;
}

interface CanvasRendererProps {
    currentImageToDraw: HTMLImageElement | null;
    canvasRefCallback?: (canvas: HTMLCanvasElement | null) => void;
    pingAnimations?: Ping[];
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({
    currentImageToDraw,
    canvasRefCallback,
    pingAnimations = []
}) => {
    const eventManager = EventManager.getInstance();

    // Offset of image
    let offset: Point = { x: 0, y: 0 };

    // Scale of image
    let scale: number = 1;

    // Change offset and scale on event
    eventManager.on('canvas:movement', event => {
        offset = event.offset;
        scale = event.scale;
    })

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Helper function to draw image with transform
    const drawImageWithTransform = (ctx: CanvasRenderingContext2D, image: HTMLImageElement) => {
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
    };

    // Draw ping animation
    const drawPingAnimation = (ctx: CanvasRenderingContext2D) => {
        if (pingAnimations.length === 0) return;

        ctx.save();
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;

        const currentTime = Date.now();

        // Draw each ping
        for (const ping of pingAnimations) {
            const elapsed = currentTime - ping.startTime;
            const progress = Math.min(elapsed / 1000, 1); // 1 second duration
            const alpha = 1 - progress;

            ctx.globalAlpha = alpha;

            // Convert image coordinates to canvas coordinates
            const canvasX = offset.x + ping.centerX * scale;
            const canvasY = offset.y + ping.centerY * scale;

            // Draw the circle in canvas coordinates with fixed radius
            ctx.beginPath();
            ctx.arc(canvasX, canvasY, ping.radius, 0, 2 * Math.PI);
            ctx.stroke();
        }

        ctx.restore();
    };

    // Draw the appropriate image
    const drawCanvas = () => {
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
    };

    // Set up canvas ref callback
    useEffect(() => {
        if (canvasRef.current) {
            canvasRefCallback?.(canvasRef.current);
        }
        return () => {
            canvasRefCallback?.(null);
        };
    }, [canvasRefCallback]);

    // Setup animation frame loop
    let animationFrameId: number;

    const animate = () => {
        drawCanvas();
        animationFrameId = requestAnimationFrame(animate);
    };

    // Start the animation loop
    animationFrameId = requestAnimationFrame(animate);

    return (
        <canvas
            ref={canvasRef}
            className="canvas-element"
            style={{ pointerEvents: 'auto' }}
        />
    );
};
