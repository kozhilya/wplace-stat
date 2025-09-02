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
    const [viewMode, setViewMode] = useState<'template' | 'wplace' | 'difference'>('difference');
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

    // Initialize interaction manager when canvas is available
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas && !interactionManagerRef.current) {
            interactionManagerRef.current = new CanvasInteractionManager(
                canvas,
                (newScale, newOffset) => {
                    setScale(newScale);
                    setOffset(newOffset);
                    // Force redraw when position changes
                    drawCanvasRef.current?.();
                }
            );
            
            // Update the current template
            interactionManagerRef.current.setTemplate(currentTemplate);
        }

        return () => {
            // Cleanup on component unmount
            if (interactionManagerRef.current) {
                interactionManagerRef.current.cleanup();
                interactionManagerRef.current = null;
            }
        };
    }, []);

    // Update interaction manager when template changes
    useEffect(() => {
        if (interactionManagerRef.current) {
            interactionManagerRef.current.setTemplate(currentTemplate);
        }
        // Reset view when template changes
        // Reset through the interaction manager to ensure proper synchronization
        interactionManagerRef.current?.resetView();
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

    // Function to get CSS variable value
    const getCssVariable = (name: string): string => {
        return getComputedStyle(document.body).getPropertyValue(name).trim();
    };

    // Function to parse RGB/RGBA from CSS variable
    const parseRgbFromCssVariable = (cssValue: string): number[] => {
        // Handle rgb() and rgba() formats
        const rgbMatch = cssValue.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/);
        if (rgbMatch) {
            const r = parseInt(rgbMatch[1]);
            const g = parseInt(rgbMatch[2]);
            const b = parseInt(rgbMatch[3]);
            const a = rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1;
            return [r, g, b, Math.round(a * 255)];
        }
        
        // Handle hex format
        const hexMatch = cssValue.match(/^#([0-9A-Fa-f]{3,8})$/);
        if (hexMatch) {
            let hex = hexMatch[1];
            if (hex.length === 3 || hex.length === 4) {
                hex = hex.split('').map(c => c + c).join('');
            }
            
            if (hex.length === 6) {
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                return [r, g, b, 255];
            } else if (hex.length === 8) {
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                const a = parseInt(hex.substring(6, 8), 16);
                return [r, g, b, a];
            }
        }
        
        // Default to black if parsing fails
        return [0, 0, 0, 255];
    };

    // Get difference colors from CSS variables
    const getDifferenceColors = React.useCallback(() => {
        // These are example CSS variable names - you may need to adjust them
        return {
            transparent: [0, 0, 0, 0],          // Always fully transparent
            unselected: parseRgbFromCssVariable(getCssVariable('--color-difference-unselected') || '#ffffff'),
            match: parseRgbFromCssVariable(getCssVariable('--color-difference-match') || '#4CAF50'),
            mismatch: parseRgbFromCssVariable(getCssVariable('--color-difference-missing') || '#ff0000')
        };
    }, []);

    // Helper function to check if two colors match exactly
    const colorsMatchExactly = (
        r1: number, g1: number, b1: number, a1: number,
        r2: number, g2: number, b2: number, a2: number
    ): boolean => {
        return r1 === r2 && g1 === g2 && b1 === b2 && a1 === a2;
    };

    // Helper function to check if template pixel matches selected color
    const isTemplatePixelSelectedColor = (
        templateR: number, templateG: number, templateB: number,
        selectedColorId: number
    ): boolean => {
        const selectedColor = WplacePalette.find(color => color.id === selectedColorId);
        if (!selectedColor) return false;
        
        // Exact match with the selected color from the palette
        return templateR === selectedColor.rgb[0] &&
               templateG === selectedColor.rgb[1] &&
               templateB === selectedColor.rgb[2];
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
        const differenceColors = getDifferenceColors();
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
                // Check if this pixel matches the selected color in the template
                const isSelectedColor = isTemplatePixelSelectedColor(
                    templateR, templateG, templateB, selectedColorId
                );
                
                if (!isSelectedColor) {
                    // Treat as unselected - use white
                    resultData.data[i] = differenceColors.unselected[0];
                    resultData.data[i + 1] = differenceColors.unselected[1];
                    resultData.data[i + 2] = differenceColors.unselected[2];
                    resultData.data[i + 3] = differenceColors.unselected[3];
                } else {
                    // Check if colors match between template and actual
                    if (colorsMatchExactly(
                        templateR, templateG, templateB, templateA,
                        wplaceR, wplaceG, wplaceB, wplaceA
                    )) {
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
                if (colorsMatchExactly(
                    templateR, templateG, templateB, templateA,
                    wplaceR, wplaceG, wplaceB, wplaceA
                )) {
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
    }, [getDifferenceColors]);

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
                // Set canvas dimensions to match the container
                const container = canvas.parentElement;
                if (container) {
                    canvas.width = container.clientWidth;
                    canvas.height = container.clientHeight;
                }
                drawImageWithTransform(ctx, imageToDraw);
            }
        }
    }, [viewMode, currentTemplate, differenceImageRef.current, drawImageWithTransform]);

    // Draw the appropriate image based on view mode
    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas dimensions to match the container
        const container = canvas.parentElement;
        if (container) {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
        }

        if (currentImageToDraw) {
            drawImageWithTransform(ctx, currentImageToDraw);
        }
    }, [currentImageToDraw, drawImageWithTransform]);

    // Generate difference image and cache it
    const generateDifferenceImage = useCallback((templateImage: HTMLImageElement, wplaceImage: HTMLImageElement) => {
        // Create a canvas to draw the difference
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = templateImage.width;
        tempCanvas.height = templateImage.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;
        
        // Disable image smoothing for the difference image
        tempCtx.imageSmoothingEnabled = false;
        
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

    // Zoom handlers
    const handleZoomIn = () => {
        const newScale = Math.min(scale * 1.25, 10);
        setScale(newScale);
        // Update interaction manager's scale
        if (interactionManagerRef.current) {
            // We need to add a method to set the scale in the interaction manager
            // For now, we'll trigger the wheel event programmatically
            // This is a temporary workaround
            interactionManagerRef.current.setScale(newScale);
        }
    };

    const handleZoomOut = () => {
        const newScale = Math.max(scale / 1.25, 0.1);
        setScale(newScale);
        // Update interaction manager's scale
        if (interactionManagerRef.current) {
            interactionManagerRef.current.setScale(newScale);
        }
    };

    const handleZoomReset = () => {
        interactionManagerRef.current?.resetView();
    };
    
    drawCanvasRef.current = drawCanvas;

    return (
        <div className="right-panel">
            {/* Canvas area */}
            <div className="canvas-area">
                <canvas
                    ref={canvasRef}
                    className="canvas-element"
                />

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
