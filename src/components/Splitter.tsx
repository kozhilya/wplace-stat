import React from 'react';
import { debug } from '../utils';

interface SplitterProps {
    onResize: (deltaX: number) => void;
}

interface SplitterState {
    // State is managed through instance variables
}

/**
 * Class component for a splitter control that allows resizing of adjacent panels
 * Handles mouse events to provide smooth resizing functionality
 */
export class Splitter extends React.Component<SplitterProps, SplitterState> {
    private isResizing: boolean = false;
    private mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
    private mouseUpHandler: (() => void) | null = null;

    /**
     * Creates a new Splitter instance
     * @param props Component properties
     */
    constructor(props: SplitterProps) {
        super(props);
        debug('[Splitter.constructor] Creating Splitter instance');
        
        // Bind event handlers to maintain proper 'this' context
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
    }

    /**
     * Handles mouse down events to start the resizing operation
     * @param e Mouse event
     */
    private handleMouseDown(e: React.MouseEvent): void {
        debug('[Splitter.handleMouseDown] Mouse down on splitter, starting resize');
        e.preventDefault();
        this.isResizing = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }

    /**
     * Handles mouse move events during resizing
     * @param e Mouse event
     */
    private handleMouseMove(e: MouseEvent): void {
        if (this.isResizing) {
            debug(`[Splitter.handleMouseMove] Resizing with movementX: ${e.movementX}`);
            this.props.onResize(e.movementX);
        }
    }

    /**
     * Handles mouse up events to end the resizing operation
     */
    private handleMouseUp(): void {
        debug('[Splitter.handleMouseUp] Mouse up, ending resize');
        this.isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }

    /**
     * React lifecycle method called after component mounts
     * Sets up global mouse event listeners
     */
    componentDidMount(): void {
        debug('[Splitter.componentDidMount] Component mounted, setting up event listeners');
        
        // Create bound handlers to use for adding/removing event listeners
        this.mouseMoveHandler = this.handleMouseMove.bind(this);
        this.mouseUpHandler = this.handleMouseUp.bind(this);
        
        document.addEventListener('mousemove', this.mouseMoveHandler);
        document.addEventListener('mouseup', this.mouseUpHandler);
        
        debug('[Splitter.componentDidMount] Event listeners setup complete');
    }

    /**
     * React lifecycle method called before component unmounts
     * Cleans up global mouse event listeners
     */
    componentWillUnmount(): void {
        debug('[Splitter.componentWillUnmount] Component unmounting, cleaning up event listeners');
        
        if (this.mouseMoveHandler) {
            document.removeEventListener('mousemove', this.mouseMoveHandler);
        }
        if (this.mouseUpHandler) {
            document.removeEventListener('mouseup', this.mouseUpHandler);
        }
        
        // Ensure we reset cursor and selection state
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        debug('[Splitter.componentWillUnmount] Event listeners cleanup complete');
    }

    /**
     * React lifecycle method called when props update
     * @param prevProps Previous component properties
     */
    componentDidUpdate(prevProps: SplitterProps): void {
        debug('[Splitter.componentDidUpdate] Component updated');
        if (this.props.onResize !== prevProps.onResize) {
            debug('[Splitter.componentDidUpdate] onResize callback changed');
        }
    }

    /**
     * React render method
     * @returns Rendered splitter element
     */
    render(): React.ReactNode {
        debug('[Splitter.render] Rendering splitter element');
        return (
            <div 
                className="splitter" 
                onMouseDown={this.handleMouseDown}
            >
                <div style={{
                    width: '3px',
                    height: '30px',
                    backgroundColor: '#999',
                    borderRadius: '2px'
                }} />
            </div>
        );
    }
}
