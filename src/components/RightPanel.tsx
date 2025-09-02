import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Template } from '../script/template';
import { CanvasInteractionManager } from '../script/managers/canvas-interaction-manager';
import { debug } from '../utils';
import { LanguageManager } from '../script/managers/language-manager';
import { WplacePalette } from '../script/wplace';

interface RightPanelProps {
    currentTemplate?: Template;
    selectedColorId?: number | null;
}

export const RightPanel: React.FC<RightPanelProps> = ({ currentTemplate, selectedColorId }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const interactionManagerRef = useRef<CanvasInteractionManager | null>(null);
    const isInteractionManagerInitialized = useRef(false);
    const [viewMode, setViewMode] = useState<'template' | 'wplace' | 'difference'>('template');
    const [scale, setScale] = useState<number>(1);
    const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    // Track the current image to draw separately from view mode
    const [currentImageToDraw, setCurrentImageToDraw] = useState<HTMLImageElement | null>(null);
    const [language, setLanguage] = useState(LanguageManager.getCurrentLanguage());
    
    // Use a ref to store the draw function to avoid dependency issues

    const drawCanvasRef = useRef<() => void>();

    useEffect(() => {
        const handleLanguageChange = () => {
            setLanguage(LanguageManager.getCurrentLanguage());
        };
        
        LanguageManager.onLanguageChange(handleLanguageChange);
        
        return () => {
            LanguageManager.removeLanguageChangeListener(handleLanguageChange);
        };
    }, []);

    // Initialize and update interaction manager
    useEffect(() => {
        if (canvasRef.current && !isInteractionManagerInitialized.current) {
            interactionManagerRef.current = new CanvasInteractionManager(
                canvasRef.current,
                (newScale) => {
                    setScale(newScale);
                    // Force redraw when scale changes
                    drawCanvasRef.current?.();
                },
                (newOffset) => {
                    setOffset(newOffset);
                    // Force redraw when offset changes
                    drawCanvasRef.current?.();
                }
            );
            isInteractionManagerInitialized.current = true;
        }
        
        // Update the current template whenever it changes
        if (interactionManagerRef.current) {
            interactionManagerRef.current.setTemplate(currentTemplate);
        }

        return () => {
            // Cleanup on component unmount
            if (isInteractionManagerInitialized.current) {
                interactionManagerRef.current?.cleanup();
                isInteractionManagerInitialized.current = false;
                interactionManagerRef.current = null;
            }
        };
    }, [currentTemplate]);

    // Update interaction manager when template changes
    useEffect(() => {
        interactionManagerRef.current?.setTemplate(currentTemplate);
        // Reset view when template changes
        setScale(1);
        // Center the image on the canvas
        if (canvasRef.current && currentTemplate?.templateImage) {
            const canvas = canvasRef.current;
            const img = currentTemplate.templateImage;
            // Ensure canvas dimensions are up to date
            const container = canvas.parentElement;
            if (container) {
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
                const centerX = (canvas.width - img.width) / 2;
                const centerY = (canvas.height - img.height) / 2;
                setOffset({ x: centerX, y: centerY });
            }
        } else {
            setOffset({ x: 0, y: 0 });
        }
        // Update current image
        updateCurrentImageToDraw();
    }, [currentTemplate]);

    // Cache for difference image
    const differenceImageRef = useRef<HTMLImageElement | null>(null);

    // Generate difference image when template, view mode, or selected color changes
    useEffect(() => {
        if (viewMode === 'difference' && currentTemplate?.templateImage && currentTemplate?.wplaceImage) {
            generateDifferenceImage(currentTemplate.templateImage, currentTemplate.wplaceImage);
        } else {
            differenceImageRef.current = null;
            // Update current image when switching away from difference mode
            updateCurrentImageToDraw();
        }
    }, [currentTemplate, viewMode, selectedColorId]);


    // Define colors for difference mode (will be configurable later for dark mode)
    const differenceColors = {
        transparent: [0, 0, 0, 0],          // Black for transparent pixels
        unselected: [255, 255, 255, 255],     // White for unselected colors
        match: [0, 255, 0, 255],              // Green for matching colors
        mismatch: [255, 0, 0, 255]            // Red for mismatching colors
    };

    // Handle difference mode drawing with color filtering
    const drawDifference = React.useCallback((
        ctx: CanvasRenderingContext2D,
        templateImage: HTMLImageElement,
        wplaceImage: HTMLImageElement,
        x: number,
        y: number,
        selectedColorId?: number | null
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
            // 2) If a specific color is selected and this pixel doesn't match, treat as unselected
            else if (selectedColorId !== null && selectedColorId !== undefined) {
                // Find the closest color in the palette to the template pixel
                // We need to import WplacePalette
                // For now, we'll use a simple approach
                // Find the color in WplacePalette that matches the selectedColorId
                const selectedColor = WplacePalette.find(color => color.id === selectedColorId);
                // Check if this pixel matches the selected color in the template
                const isSelectedColor = selectedColor && 
                    Math.abs(templateR - selectedColor.rgb[0]) < 10 &&
                    Math.abs(templateG - selectedColor.rgb[1]) < 10 &&
                    Math.abs(templateB - selectedColor.rgb[2]) < 10;
                
                if (!isSelectedColor) {
                    // Treat as unselected - use white
                    resultData.data[i] = differenceColors.unselected[0];
                    resultData.data[i + 1] = differenceColors.unselected[1];
                    resultData.data[i + 2] = differenceColors.unselected[2];
                    resultData.data[i + 3] = differenceColors.unselected[3];
                } else {
                    // Check if colors match between template and actual
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
            } else {
                // No color selected - show all
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

    // Function to update the current image based on view mode
    const updateCurrentImageToDraw = useCallback(() => {
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
        
        setCurrentImageToDraw(imageToDraw);
        // Force a redraw by calling drawCanvas directly
        const canvas = canvasRef.current;
        if (canvas && imageToDraw) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Set canvas dimensions to match the container
                const container = canvas.parentElement;
                if (container) {
                    canvas.width = container.clientWidth;
                    canvas.height = container.clientHeight;
                }
                
                // Save the current context
                ctx.save();
                
                // Apply scaling and offset
                ctx.translate(offset.x, offset.y);
                ctx.scale(scale, scale);
                
                // Draw the image at the top-left corner (0,0)
                ctx.drawImage(imageToDraw, 0, 0);
                
                // Restore the context
                ctx.restore();
            }
        }
    }, [viewMode, currentTemplate, differenceImageRef.current, scale, offset]);

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

        if (currentImageToDraw) {
            // Save the current context
            ctx.save();

            // Apply scaling and offset
            ctx.translate(offset.x, offset.y);
            ctx.scale(scale, scale);

            // Draw the image at the top-left corner (0,0)
            // The offset and scale will handle positioning
            ctx.drawImage(currentImageToDraw, 0, 0);

            // Restore the context
            ctx.restore();
        }
    }, [currentImageToDraw, scale, offset]);

    // Generate difference image and cache it
    const generateDifferenceImage = useCallback((templateImage: HTMLImageElement, wplaceImage: HTMLImageElement) => {
        // Create a canvas to draw the difference
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = templateImage.width;
        tempCanvas.height = templateImage.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;
        
        // Draw difference onto the temporary canvas with selected color
        drawDifference(tempCtx, templateImage, wplaceImage, 0, 0, selectedColorId);
        
        // Convert to image and cache it
        const img = new Image();
        img.onload = () => {
            differenceImageRef.current = img;
            // Update the current image to draw
            updateCurrentImageToDraw();
            // Redraw the canvas
            drawCanvas();
        };
        img.src = tempCanvas.toDataURL('image/png');
    }, [drawDifference, updateCurrentImageToDraw, drawCanvas]);

    // Update the current image when view mode or template changes
    useEffect(() => {
        updateCurrentImageToDraw();
    }, [viewMode, currentTemplate, updateCurrentImageToDraw]);

    // Draw when scale, offset, or current image changes
    useEffect(() => {
        debug('Drawing canvas due to change in scale, offset, or image');
        drawCanvas();
    }, [scale, offset, currentImageToDraw]);


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
    
    drawCanvasRef.current = drawCanvas;

    return (
        <div className="right-panel">
            {/* View mode selector */}
            <div className="view-mode-selector">
                <button
                    onClick={() => setViewMode('template')}
                    className={viewMode === 'template' ? 'active' : ''}
                >
                    {LanguageManager.getText('template')}
                </button>
                <button
                    onClick={() => setViewMode('wplace')}
                    className={viewMode === 'wplace' ? 'active' : ''}
                >
                    {LanguageManager.getText('wplace')}
                </button>
                <button
                    onClick={() => setViewMode('difference')}
                    className={viewMode === 'difference' ? 'active' : ''}
                >
                    {LanguageManager.getText('difference')}
                </button>
            </div>
            

            {/* Canvas area */}
            <div className="canvas-area">
                <canvas
                    ref={canvasRef}
                    className="canvas-element"
                />

                {/* Zoom controls */}
                <div className="zoom-controls">
                    <button onClick={handleZoomIn} title={LanguageManager.getText('zoomIn')}>+</button>
                    <button onClick={handleZoomReset} title={LanguageManager.getText('resetZoom')}>1:1</button>
                    <button onClick={handleZoomOut} title={LanguageManager.getText('zoomOut')}>-</button>
                </div>
            </div>
        </div>
    );
};
