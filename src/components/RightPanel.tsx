import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Template } from '../script/template';
import { CanvasInteractionManager } from '../script/managers/canvas-interaction-manager';
import { debug } from '../utils';
import { LanguageManager } from '../script/managers/language-manager';
import { WplacePalette } from '../script/wplace';
import { CanvasRenderer, Ping } from './CanvasRenderer';

import { StatisticsRow } from '../script/managers/statistics-manager';
import { ImageLoaderManager } from '../script/managers/image-loader-manager';

interface RightPanelProps {
    currentTemplate?: Template;
    selectedColorId?: number | null;
    statistics?: StatisticsRow[];
}

// Global constants
const RENDER_INTERVAL = 100; // 10 FPS
const MIN_REMAINING_FOR_BUTTON = 10;

export const RightPanel: React.FC<RightPanelProps> = ({ currentTemplate, selectedColorId, statistics = [] }) => {
    const interactionManagerRef = useRef<CanvasInteractionManager | null>(null);
    const isInteractionManagerInitialized = useRef(false);
    const [viewMode, setViewMode] = useState<'template' | 'wplace' | 'difference'>('difference');
    const [scale, setScale] = useState<number>(1);
    const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    // Track the current image to draw separately from view mode
    const [currentImageToDraw, setCurrentImageToDraw] = useState<HTMLImageElement | null>(null);
    const [language, setLanguage] = useState(LanguageManager.getCurrentLanguage());
    const renderIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [remainingPixels, setRemainingPixels] = useState<number>(0);
    const [pingAnimations, setPingAnimations] = useState<Ping[]>([]);
    
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

    // We need to get a reference to the canvas element for the interaction manager
    // We'll use a callback ref to get the canvas element from the CanvasRenderer
    const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);
    
    // Initialize interaction manager when canvas is available
    useEffect(() => {
        if (canvasElement && !interactionManagerRef.current) {
            interactionManagerRef.current = new CanvasInteractionManager(
                canvasElement,
                (newScale, newOffset) => {
                    setScale(newScale);
                    setOffset(newOffset);
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
    }, [canvasElement, currentTemplate]);


    // Update remaining pixels when selected color or statistics change
    useEffect(() => {
        if (selectedColorId !== null && selectedColorId !== undefined) {
            // Find the statistics row for the selected color
            const selectedRow = statistics.find(row => row.color?.id === selectedColorId);
            if (selectedRow) {
                setRemainingPixels(selectedRow.remain);
            } else {
                setRemainingPixels(0);
            }
        } else {
            // If no color is selected, set remaining to 0 to disable the button
            setRemainingPixels(0);
        }
    }, [selectedColorId, statistics]);

    // Handle keyboard events for space key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && 
                remainingPixels <= MIN_REMAINING_FOR_BUTTON && 
                remainingPixels > 0) {
                e.preventDefault();
                handlePingRemaining();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [remainingPixels]);

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
    }, [viewMode, currentTemplate, differenceImageRef.current]);

    // Handle ping remaining button click
    const handlePingRemaining = useCallback(() => {
        // Get missing pixels from global storage
        const missingPixels = (window as any).missingPixels || [];
        
        // Create a ping for each missing pixel
        const newPings: Ping[] = missingPixels.map((pixel: { x: number; y: number }) => {
            // Convert image coordinates to canvas coordinates
            // Add 0.5 to target the center of the pixel
            const centerX = offset.x + (pixel.x + 0.5) * scale;
            const centerY = offset.y + (pixel.y + 0.5) * scale;
            
            return {
                startTime: Date.now(),
                centerX,
                centerY,
                radius: 0
            };
        });
        
        setPingAnimations(prev => [...prev, ...newPings]);
    }, [scale, offset]);

    // Animation loop for updating ping animations
    useEffect(() => {
        let animationFrameId: number;
        
        const updatePings = () => {
            const currentTime = Date.now();
            
            setPingAnimations(prev => {
                // Update radii and filter out old pings
                return prev
                    .map(ping => {
                        const elapsed = currentTime - ping.startTime;
                        if (elapsed > 1000) return null; // Mark for removal
                        
                        const progress = elapsed / 1000;
                        return {
                            ...ping,
                            radius: progress * 30 // Update radius
                        };
                    })
                    .filter(Boolean) as Ping[]; // Remove nulls
            });
            
            // Continue animation if there are active pings
            if (pingAnimations.length > 0) {
                animationFrameId = requestAnimationFrame(updatePings);
            }
        };
        
        // Start animation if there are pings
        if (pingAnimations.length > 0) {
            animationFrameId = requestAnimationFrame(updatePings);
        }
        
        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [pingAnimations.length]);


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
        ImageLoaderManager.drawDifference(tempCtx, templateImage, wplaceImage, 0, 0, selectedColorId);
        
        // Convert to image and cache it
        const img = new Image();
        img.onload = () => {
            differenceImageRef.current = img;
            // Update the current image to draw
            updateCurrentImageToDraw();
        };
        img.src = tempCanvas.toDataURL('image/png');
    }, [updateCurrentImageToDraw, selectedColorId]);

    // Regenerate difference image when dark mode changes
    useEffect(() => {
        const handleDarkModeChange = () => {
            if (viewMode === 'difference' && currentTemplate?.templateImage && currentTemplate?.wplaceImage) {
                generateDifferenceImage(currentTemplate.templateImage, currentTemplate.wplaceImage);
            }
        };

        // Listen for dark mode changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    handleDarkModeChange();
                }
            });
        });

        observer.observe(document.body, { attributes: true });

        return () => {
            observer.disconnect();
        };
    }, [viewMode, currentTemplate, selectedColorId, generateDifferenceImage]);

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
    

    return (
        <div className="right-panel">
            {/* Canvas area */}
            <div className="canvas-area">
                <CanvasRenderer
                    currentImageToDraw={currentImageToDraw}
                    scale={scale}
                    offset={offset}
                    canvasRefCallback={setCanvasElement}
                    pingAnimations={pingAnimations}
                    selectedColorId={selectedColorId}
                    statistics={statistics}
                />

                {/* View mode selector */}
                <div className="view-mode-selector">
                    <button
                        onClick={() => setViewMode('template')}
                        className={viewMode === 'template' ? 'active' : ''}
                        title={LanguageManager.getText('template')}
                    >
                        <i className="fas fa-image"></i>
                        <span>{LanguageManager.getText('template')}</span>
                    </button>
                    <button
                        onClick={() => setViewMode('wplace')}
                        className={viewMode === 'wplace' ? 'active' : ''}
                        title={LanguageManager.getText('wplace')}
                    >
                        <i className="fas fa-globe"></i>
                        <span>{LanguageManager.getText('wplace')}</span>
                    </button>
                    <button
                        onClick={() => setViewMode('difference')}
                        className={viewMode === 'difference' ? 'active' : ''}
                        title={LanguageManager.getText('difference')}
                    >
                        <i className="fas fa-code-compare"></i>
                        <span>{LanguageManager.getText('difference')}</span>
                    </button>
                </div>

                {/* Zoom controls */}
                <div className="zoom-controls">
                    <button onClick={handleZoomIn} title={LanguageManager.getText('zoomIn')}>
                        <i className="fas fa-search-plus"></i>
                    </button>
                    <button onClick={handleZoomReset} title={LanguageManager.getText('resetZoom')}>
                        <i className="fas fa-sync-alt"></i>
                    </button>
                    <button onClick={handleZoomOut} title={LanguageManager.getText('zoomOut')}>
                        <i className="fas fa-search-minus"></i>
                    </button>
                    
                    {/* Ping remaining button */}
                    <button 
                        onClick={handlePingRemaining} 
                        title={`${LanguageManager.getText('pingRemaining')} [Space]`}
                        disabled={remainingPixels > MIN_REMAINING_FOR_BUTTON || remainingPixels === 0}
                        className="new-action-button"
                    >
                        <i className="fas fa-bullseye"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};
