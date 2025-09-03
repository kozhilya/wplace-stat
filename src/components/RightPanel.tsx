import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Template } from '../script/template';
import { CanvasInteractionManager } from '../script/managers/canvas-interaction-manager';
import { debug } from '../utils';
import { LanguageManager } from '../script/managers/language-manager';
import { WplacePalette } from '../script/wplace';
import { CanvasRenderer } from './CanvasRenderer';

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
    const [pingAnimationActive, setPingAnimationActive] = useState<boolean>(false);
    const [pingAnimationTime, setPingAnimationTime] = useState<number>(0);
    
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
        setPingAnimationActive(true);
        setPingAnimationTime(0);
        
        // Auto-disable animation after 1 second (faster)
        setTimeout(() => {
            setPingAnimationActive(false);
        }, 1000);
    }, []);

    // Animation frame for ping effect
    useEffect(() => {
        let animationFrameId: number;
        
        const animate = () => {
            if (pingAnimationActive) {
                setPingAnimationTime(prevTime => prevTime + 16); // ~60fps
                animationFrameId = requestAnimationFrame(animate);
            }
        };
        
        if (pingAnimationActive) {
            animationFrameId = requestAnimationFrame(animate);
        }
        
        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [pingAnimationActive]);

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
                    pingAnimationActive={pingAnimationActive}
                    pingAnimationTime={pingAnimationTime}
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
