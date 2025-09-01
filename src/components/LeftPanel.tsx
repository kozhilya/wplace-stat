import React, { useState } from 'react';
import { TemplateConfig } from './TemplateConfig';
import { StatisticsView } from './StatisticsView';

interface LeftPanelProps {
    width: number;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({ width }) => {
    const [activeView, setActiveView] = useState<'template' | 'statistics'>('template');

    return (
        <div 
            className="left-panel" 
            style={{ 
                width: `${width}px`, 
                height: '100%', 
                borderRight: '1px solid #ddd',
                overflow: 'auto',
                padding: '10px'
            }}
        >
            <div className="view-selector" style={{ marginBottom: '10px' }}>
                <button 
                    onClick={() => setActiveView('template')}
                    style={{ fontWeight: activeView === 'template' ? 'bold' : 'normal' }}
                >
                    Template
                </button>
                <button 
                    onClick={() => setActiveView('statistics')}
                    style={{ fontWeight: activeView === 'statistics' ? 'bold' : 'normal', marginLeft: '5px' }}
                >
                    Statistics
                </button>
            </div>
            
            {activeView === 'template' && <TemplateConfig />}
            {activeView === 'statistics' && <StatisticsView />}
        </div>
    );
};
