import React, { useRef, useEffect, useState } from 'react';
import { CanvasManager } from '../script/managers/canvas-manager';
import { Template } from '../script/template';

interface RightPanelProps {
    currentTemplate?: Template;
}

export const RightPanel: React.FC<RightPanelProps> = ({ currentTemplate }) => {
    const templateCanvasRef = useRef<HTMLCanvasElement>(null);
    const wplaceImageCanvasRef = useRef<HTMLCanvasElement>(null);
    const [canvasManager, setCanvasManager] = useState<CanvasManager | null>(null);
    const [viewMode, setViewMode] = useState<'template' | 'wplace' | 'both'>('template');

    useEffect(() => {
        if (templateCanvasRef.current) {
            const manager = new CanvasManager(templateCanvasRef.current);
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

    // Update Wplace image canvas when template or view mode changes
    useEffect(() => {
        console.log('View mode or current template changed:', viewMode, currentTemplate);
        if (wplaceImageCanvasRef.current && currentTemplate?.wplaceImage && (viewMode === 'wplace' || viewMode === 'both')) {
            // Set the canvas dimensions to match the Wplace image
            wplaceImageCanvasRef.current.width = currentTemplate.wplaceImage.width;
            wplaceImageCanvasRef.current.height = currentTemplate.wplaceImage.height;
            
            const ctx = wplaceImageCanvasRef.current.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, wplaceImageCanvasRef.current.width, wplaceImageCanvasRef.current.height);
                // Draw the Wplace image
                console.log('Drawing Wplace image:', currentTemplate.wplaceImage.width, currentTemplate.wplaceImage.height);
                ctx.drawImage(currentTemplate.wplaceImage, 0, 0);
            }
        } else if (wplaceImageCanvasRef.current && (viewMode === 'template' || viewMode === 'both')) {
            // Clear the Wplace image canvas if not in Wplace view
            const ctx = wplaceImageCanvasRef.current.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, wplaceImageCanvasRef.current.width, wplaceImageCanvasRef.current.height);
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
                    onClick={() => setViewMode('wplace')}
                    style={{ fontWeight: viewMode === 'wplace' ? 'bold' : 'normal' }}
                >
                    Wplace
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
                {/* Template canvas - always rendered but conditionally visible */}
                <div style={{ 
                    textAlign: 'center', 
                    display: (viewMode === 'template' || viewMode === 'both') ? 'block' : 'none' 
                }}>
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
                
                {/* Wplace image canvas - always rendered but conditionally visible */}
                <div style={{ 
                    textAlign: 'center', 
                    display: (viewMode === 'wplace' || viewMode === 'both') ? 'block' : 'none' 
                }}>
                    <div>Wplace Image</div>
                    <canvas 
                        ref={wplaceImageCanvasRef}
                        width={currentTemplate?.wplaceImage?.width || 0}
                        height={currentTemplate?.wplaceImage?.height || 0}
                        style={{ 
                            maxWidth: '100%', 
                            maxHeight: '70vh', 
                            border: '1px solid #ccc' 
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
