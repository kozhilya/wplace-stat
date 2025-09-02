import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Template } from '../script/template';
import { CanvasInteractionManager } from '../script/managers/canvas-interaction-manager';

interface RightPanelProps {
    currentTemplate?: Template;
}

export const RightPanel: React.FC<RightPanelProps> = ({ currentTemplate }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const interactionManagerRef = useRef<CanvasInteractionManager | null>(null);
    const [viewMode, setViewMode] = useState<'template' | 'wplace' | 'difference'>('template');
    const [scale, setScale] = useState<number>(1);
    const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    // Initialize interaction manager
    useEffect(() => {
        if (canvasRef.current) {
            interactionManagerRef.current = new CanvasInteractionManager(
                canvasRef.current,
                setScale,
                setOffset
            );
            interactionManagerRef.current.setTemplate(currentTemplate);
            
            return () => {
                interactionManagerRef.current?.cleanup();
            };
        }
    }, []);

    // Update interaction manager when template changes
    useEffect(() => {
        interactionManagerRef.current?.setTemplate(currentTemplate);
    }, [currentTemplate]);

    // Cache for difference image
    const differenceImageRef = useRef<HTMLImageElement | null>(null);
    
    // Generate difference image when template or view mode changes
    useEffect(() => {
        if (viewMode === 'difference' && currentTemplate?.templateImage && currentTemplate?.wplaceImage) {
            generateDifferenceImage(currentTemplate.templateImage, currentTemplate.wplaceImage);
        } else {
            differenceImageRef.current = null;
        }
    }, [currentTemplate, viewMode]);

    // Generate difference image and cache it
    const generateDifferenceImage = useCallback((templateImage: HTMLImageElement, wplaceImage: HTMLImageElement) => {
        // Create a canvas to draw the difference
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = templateImage.width;
        tempCanvas.height = templateImage.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;
        
        // Draw difference onto the temporary canvas
        drawDifference(tempCtx, templateImage, wplaceImage, 0, 0);
        
        // Convert to image and cache it
        const img = new Image();
        img.onload = () => {
            differenceImageRef.current = img;
            drawCanvas();
        };
        img.src = tempCanvas.toDataURL('image/png');
    }, [drawDifference]);

    // Draw the appropriate image based on view mode
    const drawCanvas = useCallback(() => {
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
                imageToDraw = differenceImageRef.current;
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
            
            // Always draw the cached image normally
            ctx.drawImage(imageToDraw, x, y);
                
            // Restore the context
            ctx.restore();
        }
    }, [currentTemplate, viewMode, scale, offset]);

    // Draw on mount and when dependencies change
    useEffect(() => {
        drawCanvas();
    }, [drawCanvas]);

    // Define colors for difference mode (will be configurable later for dark mode)
    const differenceColors = {
        transparent: [0, 0, 0, 255],          // Black for transparent pixels
        unselected: [255, 255, 255, 255],     // White for unselected colors
        match: [0, 255, 0, 255],              // Green for matching colors
        mismatch: [255, 0, 0, 255]            // Red for mismatching colors
    };

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
            const templateR = templateData.data[i];
            const templateG = templateData.data[i + 1];
            const templateB = templateData.data[i + 2];
            const templateA = templateData.data[i + 3];
            
            const wplaceR = wplaceData.data[i];
            const wplaceG = wplaceData.data[i + 1];
            const wplaceB = wplaceData.data[i + 2];
            const wplaceA = wplaceData.data[i + 3];

            // 1) If template pixel is transparent - use black
            if (templateA === 0) {
                resultData.data[i] = differenceColors.transparent[0];
                resultData.data[i + 1] = differenceColors.transparent[1];
                resultData.data[i + 2] = differenceColors.transparent[2];
                resultData.data[i + 3] = differenceColors.transparent[3];
            }
            // 2) If template pixel is unselected color - use white
            // For now, we'll treat all non-transparent template pixels as "selected"
            // You can add logic here later to check against a list of selected colors
            else {
                // Check if colors match
                if (templateR === wplaceR && 
                    templateG === wplaceG && 
                    templateB === wplaceB && 
                    templateA === wplaceA) {
                    // 3) Colors match - use green
                    resultData.data[i] = differenceColors.match[0];
                    resultData.data[i + 1] = differenceColors.match[1];
                    resultData.data[i + 2] = differenceColors.match[2];
                    resultData.data[i + 3] = differenceColors.match[3];
                } else {
                    // 4) Colors don't match - use red
                    resultData.data[i] = differenceColors.mismatch[0];
                    resultData.data[i + 1] = differenceColors.mismatch[1];
                    resultData.data[i + 2] = differenceColors.mismatch[2];
                    resultData.data[i + 3] = differenceColors.mismatch[3];
                }
            }
        }

        // Put the result data onto the canvas
        ctx.putImageData(resultData, x, y);
    }, [differenceColors]);

    // Zoom handlers
    const handleZoomIn = () => {
        const newScale = Math.min(scale * 1.25, 10);
        setScale(newScale);
        // Update interaction manager if needed
    };

    const handleZoomOut = () => {
        const newScale = Math.max(scale / 1.25, 0.1);
        setScale(newScale);
        // Update interaction manager if needed
    };

    const handleZoomReset = () => {
        interactionManagerRef.current?.resetView();
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
