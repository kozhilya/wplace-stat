import React from 'react';
import { Template } from '../types/template';
import { CanvasInteractionManager, CanvasZoomRequestEventArgs } from '../managers/canvas-interaction-manager';
import { LanguageManager } from '../managers/language-manager';
import { CanvasRenderer, Ping } from './CanvasRenderer';
import { StatisticsRow } from '../managers/statistics-manager';
import { ImageLoaderManager } from '../managers/image-loader-manager';
import { MIN_REMAINING_FOR_BUTTON } from '../settings';
import { EventManager } from '../managers/event-manager';
import { debug } from '../utils';
import { LanguageChangeEventArts } from '../types/event-args';

interface RightPanelProps {
    currentTemplate?: Template;
    selectedColorId?: number | null;
    statistics?: StatisticsRow[];
}

interface RightPanelState {
    viewMode: 'template' | 'wplace' | 'difference';
    currentImageToDraw: HTMLImageElement | null;
    language: string;
    remainingPixels: number;
    pingAnimations: Ping[];
    canvasElement: HTMLCanvasElement | null;
}

/**
 * Class component for the right panel that displays canvas and controls
 * Handles image rendering, view modes, zoom controls, and ping animations
 */
export class RightPanel extends React.Component<RightPanelProps, RightPanelState> {
    private eventManager: EventManager;
    private interactionManager: CanvasInteractionManager | null = null;
    private animationFrameId: number = 0;
    private darkModeObserver: MutationObserver;

    /**
     * Creates a new RightPanel instance
     * @param props Component properties
     */
    constructor(props: RightPanelProps) {
        super(props);
        debug('[RightPanel.constructor] Creating RightPanel instance');
        
        this.eventManager = EventManager.getInstance();
        
        this.state = {
            viewMode: 'difference',
            currentImageToDraw: null,
            language: LanguageManager.getCurrentLanguage(),
            remainingPixels: 0,
            pingAnimations: [],
            canvasElement: null
        };

        this.darkModeObserver = new MutationObserver(this.handleDarkModeChange.bind(this));
    }

    /**
     * Handles language change events from EventManager
     */
    private handleLanguageChangeEvent(args: LanguageChangeEventArts): void {
        debug('[RightPanel.handleLanguageChangeEvent] Language changed');
        this.setState({ language: args.targetLanguage });
    }

    /**
     * Handles dark mode changes by regenerating difference image if needed
     * @param mutations DOM mutation records
     */
    private handleDarkModeChange(mutations: MutationRecord[]): void {
        debug('[RightPanel.handleDarkModeChange] Dark mode changed');
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                if (this.state.viewMode === 'difference' && 
                    this.props.currentTemplate?.templateImage && 
                    this.props.currentTemplate?.wplaceImage) {
                    this.generateDifferenceImage(
                        this.props.currentTemplate.templateImage, 
                        this.props.currentTemplate.wplaceImage
                    );
                }
            }
        });
    }

    /**
     * Updates the current image to draw based on view mode and template
     */
    private updateCurrentImageToDraw(): void {
        debug('[RightPanel.updateCurrentImageToDraw] Updating current image to draw');
        let imageToDraw: HTMLImageElement | null = null;
        
        switch (this.state.viewMode) {
            case 'template':
                imageToDraw = this.props.currentTemplate?.templateImage || null;
                break;
            case 'wplace':
                imageToDraw = this.props.currentTemplate?.wplaceImage || null;
                break;
            case 'difference':
                // For difference mode, we need to regenerate the image
                if (this.props.currentTemplate?.templateImage && this.props.currentTemplate?.wplaceImage) {
                    this.generateDifferenceImage(
                        this.props.currentTemplate.templateImage, 
                        this.props.currentTemplate.wplaceImage
                    );
                }
                // Don't set imageToDraw here, it will be set when the difference image loads
                return;
        }
        
        this.setState({ currentImageToDraw: imageToDraw });
    }

    /**
     * Handles ping remaining button click by creating ping animations for missing pixels
     */
    private handlePingRemaining(): void {
        debug('[RightPanel.handlePingRemaining] Handling ping remaining');
        const missingPixels = (window as any).missingPixels || [];
        
        const newPings: Ping[] = missingPixels.map((pixel: { x: number; y: number }) => {
            return {
                startTime: Date.now(),
                centerX: pixel.x + 0.5,
                centerY: pixel.y + 0.5,
                radius: 0
            };
        });
        
        this.setState(prevState => ({
            pingAnimations: [...prevState.pingAnimations, ...newPings]
        }));
    }

    /**
     * Updates ping animations in the animation loop
     */
    private updatePings(): void {
        debug('[RightPanel.updatePings] Updating ping animations');
        const currentTime = Date.now();
        
        this.setState(prevState => {
            const updatedPings = prevState.pingAnimations
                .map(ping => {
                    const elapsed = currentTime - ping.startTime;
                    if (elapsed > 1000) return null;
                    
                    const progress = elapsed / 1000;
                    return {
                        ...ping,
                        radius: progress * 30
                    };
                })
                .filter(Boolean) as Ping[];
            
            if (updatedPings.length > 0) {
                this.animationFrameId = requestAnimationFrame(this.updatePings.bind(this));
            }
            
            return { pingAnimations: updatedPings };
        });
    }

    /**
     * Generates a difference image between template and wplace images
     * @param templateImage Template image element
     * @param wplaceImage Wplace image element
     */
    private generateDifferenceImage(templateImage: HTMLImageElement, wplaceImage: HTMLImageElement): void {
        debug('[RightPanel.generateDifferenceImage] Generating difference image');
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = templateImage.width;
        tempCanvas.height = templateImage.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;
        
        tempCtx.imageSmoothingEnabled = false;
        ImageLoaderManager.drawDifference(tempCtx, templateImage, wplaceImage, 0, 0, this.props.selectedColorId);
        
        const img = new Image();
        img.onload = () => {
            // Store the difference image in state instead of the ref
            debug('[RightPanel.generateDifferenceImage] Difference image loaded');
            this.setState({ currentImageToDraw: img });
        };
        img.src = tempCanvas.toDataURL('image/png');
    }

    /**
     * Handles zoom in button click
     */
    private handleZoomIn(): void {
        debug('[RightPanel.handleZoomIn] Zooming in');
        this.eventManager.emit('canvas:zoom-request', new CanvasZoomRequestEventArgs('zoom-in'));
    }

    /**
     * Handles zoom out button click
     */
    private handleZoomOut(): void {
        debug('[RightPanel.handleZoomOut] Zooming out');
        this.eventManager.emit('canvas:zoom-request', new CanvasZoomRequestEventArgs('zoom-out'));
    }

    /**
     * Handles zoom reset button click
     */
    private handleZoomReset(): void {
        debug('[RightPanel.handleZoomReset] Resetting zoom');
        this.eventManager.emit('canvas:zoom-request', new CanvasZoomRequestEventArgs('zoom-reset'));
    }

    /**
     * Sets the canvas element reference and initializes interaction manager
     * @param canvas Canvas element or null
     */
    private setCanvasElement(canvas: HTMLCanvasElement | null): void {
        debug('[RightPanel.setCanvasElement] Setting canvas element');
        this.setState({ canvasElement: canvas });
        
        if (canvas && !this.interactionManager) {
            debug('[RightPanel.setCanvasElement] Initializing interaction manager');
            this.interactionManager = new CanvasInteractionManager(canvas);
            this.interactionManager.setTemplate(this.props.currentTemplate);
        }
    }

    /**
     * React lifecycle method called after component mounts
     * Sets up event listeners and starts dark mode observation
     */
    componentDidMount(): void {
        debug('[RightPanel.componentDidMount] Component mounted');
        
        // Subscribe to language change events
        const eventManager = EventManager.getInstance();
        eventManager.on('language:change', this.handleLanguageChangeEvent.bind(this));
        
        this.darkModeObserver.observe(document.body, { attributes: true });
        
        // Start ping animation if there are existing pings
        if (this.state.pingAnimations.length > 0) {
            this.animationFrameId = requestAnimationFrame(this.updatePings.bind(this));
        }
    }

    /**
     * React lifecycle method called before component unmounts
     * Cleans up event listeners and stops animation
     */
    componentWillUnmount(): void {
        debug('[RightPanel.componentWillUnmount] Component unmounting');
        
        // Unsubscribe from language change events
        const eventManager = EventManager.getInstance();
        eventManager.off('language:change', this.handleLanguageChangeEvent.bind(this));
        
        this.darkModeObserver.disconnect();
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        if (this.interactionManager) {
            this.interactionManager.cleanup();
        }
    }

    /**
     * React lifecycle method called when props or state update
     * @param prevProps Previous props
     * @param prevState Previous state
     */
    componentDidUpdate(prevProps: RightPanelProps, prevState: RightPanelState): void {
        debug('[RightPanel.componentDidUpdate] Component updated');
        
        // Update remaining pixels when selected color or statistics change
        if (this.props.selectedColorId !== prevProps.selectedColorId || 
            this.props.statistics !== prevProps.statistics) {
            debug('[RightPanel.componentDidUpdate] Updating remaining pixels');
            if (this.props.selectedColorId !== null && this.props.selectedColorId !== undefined) {
                const selectedRow = this.props.statistics?.find(row => row.color?.id === this.props.selectedColorId);
                this.setState({ remainingPixels: selectedRow ? selectedRow.remain : 0 });
            } else {
                this.setState({ remainingPixels: 0 });
            }
        }

        // Update interaction manager when template changes
        if (this.props.currentTemplate !== prevProps.currentTemplate) {
            debug('[RightPanel.componentDidUpdate] Template changed, updating interaction manager');
            if (this.interactionManager) {
                this.interactionManager.setTemplate(this.props.currentTemplate);
                this.interactionManager.resetView();
            }
            this.updateCurrentImageToDraw();
        }

        // Update current image when view mode changes
        if (this.state.viewMode !== prevState.viewMode) {
            debug('[RightPanel.componentDidUpdate] View mode changed');
            this.updateCurrentImageToDraw();
        }

        // Generate difference image when needed
        if (this.state.viewMode === 'difference' && 
            this.props.currentTemplate?.templateImage && 
            this.props.currentTemplate?.wplaceImage &&
            (this.props.currentTemplate !== prevProps.currentTemplate ||
             this.state.viewMode !== prevState.viewMode ||
             this.props.selectedColorId !== prevProps.selectedColorId)) {
            debug('[RightPanel.componentDidUpdate] Regenerating difference image');
            this.generateDifferenceImage(
                this.props.currentTemplate.templateImage, 
                this.props.currentTemplate.wplaceImage
            );
        }

        // Start/stop ping animation
        if (this.state.pingAnimations.length !== prevState.pingAnimations.length) {
            debug('[RightPanel.componentDidUpdate] Ping animations changed');
            if (this.state.pingAnimations.length > 0) {
                this.animationFrameId = requestAnimationFrame(this.updatePings.bind(this));
            }
        }
    }

    /**
     * React render method
     * @returns Rendered component
     */
    render(): React.ReactNode {
        debug('[RightPanel.render] Rendering component');
        return (
            <div className="right-panel">
                <div className="canvas-area">
                    <CanvasRenderer
                        currentImageToDraw={this.state.currentImageToDraw}
                        canvasRefCallback={this.setCanvasElement.bind(this)}
                        pingAnimations={this.state.pingAnimations}
                    />

                    <div className="view-mode-selector">
                        <button
                            onClick={() => this.setState({ viewMode: 'template' })}
                            className={this.state.viewMode === 'template' ? 'active' : ''}
                            title={LanguageManager.getText('template')}
                        >
                            <i className="fas fa-image"></i>
                            <span>{LanguageManager.getText('template')}</span>
                        </button>
                        <button
                            onClick={() => this.setState({ viewMode: 'wplace' })}
                            className={this.state.viewMode === 'wplace' ? 'active' : ''}
                            title={LanguageManager.getText('wplace')}
                        >
                            <i className="fas fa-globe"></i>
                            <span>{LanguageManager.getText('wplace')}</span>
                        </button>
                        <button
                            onClick={() => this.setState({ viewMode: 'difference' })}
                            className={this.state.viewMode === 'difference' ? 'active' : ''}
                            title={LanguageManager.getText('difference')}
                        >
                            <i className="fas fa-code-compare"></i>
                            <span>{LanguageManager.getText('difference')}</span>
                        </button>
                    </div>

                    <div className="zoom-controls">
                        <button onClick={this.handleZoomIn.bind(this)} title={LanguageManager.getText('zoomIn')}>
                            <i className="fas fa-search-plus"></i>
                        </button>
                        <button onClick={this.handleZoomReset.bind(this)} title={LanguageManager.getText('resetZoom')}>
                            <i className="fas fa-sync-alt"></i>
                        </button>
                        <button onClick={this.handleZoomOut.bind(this)} title={LanguageManager.getText('zoomOut')}>
                            <i className="fas fa-search-minus"></i>
                        </button>
                        
                        <button 
                            onClick={this.handlePingRemaining.bind(this)} 
                            title={`${LanguageManager.getText('pingRemaining')} [Space]`}
                            disabled={this.state.remainingPixels > MIN_REMAINING_FOR_BUTTON || this.state.remainingPixels === 0}
                            className="new-action-button"
                        >
                            <i className="fas fa-bullseye"></i>
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}
