import React, { useState, useEffect } from 'react';
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
    const [templates, setTemplates] = useState<Template[]>([]);

    useEffect(() => {
        // Load templates on mount
        const loadedTemplates = collection.current.getTemplates();
        setTemplates(loadedTemplates);
        
        // Determine initial view based on hash and templates
        if (window.location.hash) {
            setActiveView('template');
        } else if (loadedTemplates.length > 0) {
            setActiveView('templates');
        } else {
            setActiveView('template');
        }
    }, []);

    const handleTemplateSave = (template: Template) => {
        // Add to collection
        collection.current.addTemplate(template);
        const updatedTemplates = collection.current.getTemplates();
        setTemplates(updatedTemplates);
        if (onTemplateSave) {
            onTemplateSave(template);
        }
        // Switch to template view
        setActiveView('template');
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
