import React, { useState } from 'react';
import { TemplateConfig } from './TemplateConfig';
import { StatisticsView } from './StatisticsView';
import { TemplateList } from './TemplateList';
import { Template } from '../script/template';
import { StatisticsRow } from '../script/managers/statistics-manager';
import { TemplateCollection } from '../script/template';

interface LeftPanelProps {
    width: number;
    onTemplateSave?: (template: Template) => void;
    onTemplateLoad?: (template: Template) => void;
    statistics?: StatisticsRow[];
}

export const LeftPanel: React.FC<LeftPanelProps> = ({ width, onTemplateSave, onTemplateLoad, statistics = [] }) => {
    const [activeView, setActiveView] = useState<'template' | 'statistics' | 'templates'>('template');
    const collection = React.useRef(new TemplateCollection());

    const handleTemplateSave = (template: Template) => {
        // Add to collection
        collection.current.addTemplate(template);
        if (onTemplateSave) {
            onTemplateSave(template);
        }
    };

    const handleTemplateLoad = (template: Template) => {
        if (onTemplateLoad) {
            onTemplateLoad(template);
        }
        // Switch to template view
        setActiveView('template');
    };

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
            <div className="view-selector" style={{ marginBottom: '10px', display: 'flex', gap: '5px' }}>
                <button 
                    onClick={() => setActiveView('template')}
                    style={{ fontWeight: activeView === 'template' ? 'bold' : 'normal' }}
                >
                    Template
                </button>
                <button 
                    onClick={() => setActiveView('statistics')}
                    style={{ fontWeight: activeView === 'statistics' ? 'bold' : 'normal' }}
                >
                    Statistics
                </button>
                <button 
                    onClick={() => setActiveView('templates')}
                    style={{ fontWeight: activeView === 'templates' ? 'bold' : 'normal' }}
                >
                    Templates
                </button>
            </div>
            
            {activeView === 'template' && <TemplateConfig onTemplateSave={handleTemplateSave} />}
            {activeView === 'statistics' && <StatisticsView statistics={statistics} />}
            {activeView === 'templates' && <TemplateList onTemplateSelect={handleTemplateLoad} />}
        </div>
    );
};
