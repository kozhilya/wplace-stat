import React, { useState } from 'react';
import { TemplateConfig } from './TemplateConfig';
import { StatisticsView } from './StatisticsView';
import { Template } from '../script/template';
import { StatisticsRow } from '../script/managers/statistics-manager';

interface LeftPanelProps {
    width: number;
    onTemplateSave?: (template: Template) => void;
    statistics?: StatisticsRow[];
}

export const LeftPanel: React.FC<LeftPanelProps> = ({ width, onTemplateSave, statistics = [] }) => {
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
            
            {activeView === 'template' && <TemplateConfig onTemplateSave={onTemplateSave} />}
            {activeView === 'statistics' && <StatisticsView statistics={statistics} />}
        </div>
    );
};
