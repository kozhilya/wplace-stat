import React, { useRef, useEffect } from 'react';
import { CanvasManager } from '../script/managers/canvas-manager';

export const RightPanel: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current) {
            // Initialize canvas manager
            const canvasManager = new CanvasManager('template-canvas');
        }
    }, []);

    return (
        <div 
            className="right-panel" 
            style={{ 
                flex: 1, 
                height: '100%', 
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f0f0f0'
            }}
        >
            <canvas 
                id="template-canvas" 
                ref={canvasRef}
                style={{ 
                    maxWidth: '100%', 
                    maxHeight: '100%', 
                    border: '1px solid #ccc' 
                }}
            />
        </div>
    );
};
