import React, { useRef, useEffect, useState } from 'react';
import { CanvasManager } from '../script/managers/canvas-manager';
import { Template } from '../script/template';

interface RightPanelProps {
    currentTemplate?: Template;
}

export const RightPanel: React.FC<RightPanelProps> = ({ currentTemplate }) => {
    const templateCanvasRef = useRef<HTMLCanvasElement>(null);
    const actualCanvasRef = useRef<HTMLCanvasElement>(null);
    const [canvasManager, setCanvasManager] = useState<CanvasManager | null>(null);
    const [viewMode, setViewMode] = useState<'template' | 'actual' | 'both'>('template');

    useEffect(() => {
        if (templateCanvasRef.current) {
            const manager = new CanvasManager('template-canvas');
            setCanvasManager(manager);
        }
    }, []);

    // Update template canvas when template or view mode changes
    useEffect(() => {
        if (canvasManager && templateCanvasRef.current) {
            if (currentTemplate?.templateImage && (viewMode === 'template' || viewMode === 'both')) {
                canvasManager.drawImage(currentTemplate.templateImage);
            } else {
                // Clear the canvas if not in template view
                const ctx = templateCanvasRef.current.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, templateCanvasRef.current.width, templateCanvasRef.current.height);
                }
            }
        }
    }, [canvasManager, currentTemplate, viewMode]);

    // Update actual canvas when template or view mode changes
    useEffect(() => {
        if (actualCanvasRef.current && currentTemplate?.actualCanvas && (viewMode === 'actual' || viewMode === 'both')) {
            // Set the canvas dimensions to match the actual canvas
            actualCanvasRef.current.width = currentTemplate.actualCanvas.width;
            actualCanvasRef.current.height = currentTemplate.actualCanvas.height;
            
            const ctx = actualCanvasRef.current.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, actualCanvasRef.current.width, actualCanvasRef.current.height);
                ctx.drawImage(currentTemplate.actualCanvas, 0, 0);
            }
        }
    }, [currentTemplate, viewMode]);

    return (
        <div 
            className="right-panel" 
            style={{ 
                flex: 1, 
                height: '100%', 
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#f0f0f0'
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
                    onClick={() => setViewMode('actual')}
                    style={{ fontWeight: viewMode === 'actual' ? 'bold' : 'normal' }}
                >
                    Actual
                </button>
                <button 
                    onClick={() => setViewMode('both')}
                    style={{ fontWeight: viewMode === 'both' ? 'bold' : 'normal' }}
                >
                    Both
                </button>
            </div>

            {/* Canvas area */}
            <div style={{ 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: viewMode === 'both' ? 'column' : 'row',
                gap: '20px',
                padding: '10px',
                overflow: 'auto'
            }}>
                {/* Template canvas */}
                {(viewMode === 'template' || viewMode === 'both') && (
                    <div style={{ textAlign: 'center' }}>
                        <div>Template</div>
                        <canvas 
                            id="template-canvas" 
                            ref={templateCanvasRef}
                            style={{ 
                                maxWidth: '100%', 
                                maxHeight: '70vh', 
                                border: '1px solid #ccc' 
                            }}
                        />
                    </div>
                )}
                
                {/* Actual canvas */}
                {(viewMode === 'actual' || viewMode === 'both') && currentTemplate?.actualCanvas && (
                    <div style={{ textAlign: 'center' }}>
                        <div>Actual Canvas</div>
                        <canvas 
                            ref={actualCanvasRef}
                            width={currentTemplate.actualCanvas.width}
                            height={currentTemplate.actualCanvas.height}
                            style={{ 
                                maxWidth: '100%', 
                                maxHeight: '70vh', 
                                border: '1px solid #ccc' 
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
