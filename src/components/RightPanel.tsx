import React, { useRef, useEffect, useState } from 'react';
import { Template } from '../script/template';

interface RightPanelProps {
    currentTemplate?: Template;
}

export const RightPanel: React.FC<RightPanelProps> = ({ currentTemplate }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [viewMode, setViewMode] = useState<'template' | 'wplace' | 'difference'>('template');
    const [scale, setScale] = useState<number>(1);
    const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    // Draw the appropriate image based on view mode
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set canvas dimensions to match the container
        const container = canvas.parentElement;
        if (container) {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
        }

        let imageToDraw: HTMLImageElement | null = null;

        switch (viewMode) {
            case 'template':
                imageToDraw = currentTemplate?.templateImage || null;
                break;
            case 'wplace':
                imageToDraw = currentTemplate?.wplaceImage || null;
                break;
            case 'difference':
                // For difference mode, we'll need to handle this differently
                // For now, just draw the template image
                imageToDraw = currentTemplate?.templateImage || null;
                break;
        }

        if (imageToDraw) {
            // Save the current context
            ctx.save();
                
            // Apply scaling and offset
            ctx.translate(offset.x, offset.y);
            ctx.scale(scale, scale);
                
            // Draw the image centered
            const x = (canvas.width / scale - imageToDraw.width) / 2 - offset.x / scale;
            const y = (canvas.height / scale - imageToDraw.height) / 2 - offset.y / scale;
                
            if (viewMode === 'difference' && currentTemplate?.templateImage && currentTemplate?.wplaceImage) {
                // Draw difference between template and wplace images
                drawDifference(ctx, currentTemplate.templateImage, currentTemplate.wplaceImage, x, y);
            } else {
                // Draw the image normally
                ctx.drawImage(imageToDraw, x, y);
            }
                
            // Restore the context
            ctx.restore();
        }
    }, [currentTemplate, viewMode, scale, offset]);

    // Handle difference mode drawing
    const drawDifference = React.useCallback((
        ctx: CanvasRenderingContext2D, 
        templateImage: HTMLImageElement, 
        wplaceImage: HTMLImageElement,
        x: number,
        y: number
    ) => {
        // Create temporary canvases to get image data
        const templateCanvas = document.createElement('canvas');
        templateCanvas.width = templateImage.width;
        templateCanvas.height = templateImage.height;
        const templateCtx = templateCanvas.getContext('2d')!;
        templateCtx.drawImage(templateImage, 0, 0);

        const wplaceCanvas = document.createElement('canvas');
        wplaceCanvas.width = wplaceImage.width;
        wplaceCanvas.height = wplaceImage.height;
        const wplaceCtx = wplaceCanvas.getContext('2d')!;
        wplaceCtx.drawImage(wplaceImage, 0, 0);

        // Get image data
        const templateData = templateCtx.getImageData(0, 0, templateCanvas.width, templateCanvas.height);
        const wplaceData = wplaceCtx.getImageData(0, 0, wplaceCanvas.width, wplaceCanvas.height);

        // Create result image data
        const resultData = new ImageData(templateCanvas.width, templateCanvas.height);

        // Compare pixels
        for (let i = 0; i < templateData.data.length; i += 4) {
            // If pixels are different, mark in red
            if (templateData.data[i] !== wplaceData.data[i] ||
                templateData.data[i + 1] !== wplaceData.data[i + 1] ||
                templateData.data[i + 2] !== wplaceData.data[i + 2] ||
                templateData.data[i + 3] !== wplaceData.data[i + 3]) {
                resultData.data[i] = 255;     // R
                resultData.data[i + 1] = 0;   // G
                resultData.data[i + 2] = 0;   // B
                resultData.data[i + 3] = 255; // A
            } else {
                // If pixels are the same, draw semi-transparent
                resultData.data[i] = templateData.data[i];
                resultData.data[i + 1] = templateData.data[i + 1];
                resultData.data[i + 2] = templateData.data[i + 2];
                resultData.data[i + 3] = 128; // Semi-transparent
            }
        }

        // Put the result data onto the canvas
        ctx.putImageData(resultData, x, y);
    }, []);

    // Zoom handlers
    const handleZoomIn = () => {
        setScale(prevScale => Math.min(prevScale * 1.25, 10));
    };

    const handleZoomOut = () => {
        setScale(prevScale => Math.max(prevScale / 1.25, 0.1));
    };

    const handleZoomReset = () => {
        setScale(1);
        setOffset({ x: 0, y: 0 });
    };

    return (
        <div 
            className="right-panel" 
            style={{ 
                flex: 1, 
                height: '100%', 
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#f0f0f0',
                position: 'relative'
            }}
        >
            {/* View mode selector */}
            <div style={{ padding: '10px', display: 'flex', gap: '10px' }}>
                <button 
                    onClick={() => setViewMode('template')}
                    style={{ fontWeight: viewMode === 'template' ? 'bold' : 'normal' }}
                >
                    Template
                </button>
                <button 
                    onClick={() => setViewMode('wplace')}
                    style={{ fontWeight: viewMode === 'wplace' ? 'bold' : 'normal' }}
                >
                    Wplace
                </button>
                <button 
                    onClick={() => setViewMode('difference')}
                    style={{ fontWeight: viewMode === 'difference' ? 'bold' : 'normal' }}
                >
                    Difference
                </button>
            </div>

            {/* Canvas area */}
            <div style={{ 
                flex: 1, 
                position: 'relative',
                overflow: 'hidden'
            }}>
                <canvas 
                    ref={canvasRef}
                    style={{ 
                        width: '100%',
                        height: '100%',
                        display: 'block'
                    }}
                />
                
                {/* Zoom controls */}
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    padding: '5px',
                    borderRadius: '4px'
                }}>
                    <button onClick={handleZoomIn} title="Zoom In">+</button>
                    <button onClick={handleZoomReset} title="Reset Zoom">1:1</button>
                    <button onClick={handleZoomOut} title="Zoom Out">-</button>
                </div>
            </div>
        </div>
    );
};
