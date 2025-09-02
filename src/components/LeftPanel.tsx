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
    currentTemplate?: Template;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({ 
    width, 
    onTemplateSave, 
    onTemplateLoad, 
    statistics = [], 
    currentTemplate 
}) => {
    const [activeView, setActiveView] = useState<'template' | 'statistics' | 'templates'>('template');
    const collection = React.useRef(new TemplateCollection());
    const [templates, setTemplates] = useState<Template[]>([]);

    useEffect(() => {
        // Load templates on mount
        const loadedTemplates = collection.current.getTemplates();
        setTemplates(loadedTemplates);
        
        // Determine initial view based on current template, hash, and templates
        if (currentTemplate) {
            setActiveView('statistics');
        } else if (window.location.hash) {
            setActiveView('template');
        } else if (loadedTemplates.length > 0) {
            setActiveView('templates');
        } else {
            setActiveView('template');
        }
    }, [currentTemplate]);

    useEffect(() => {
        // Update view when currentTemplate changes
        if (currentTemplate) {
            setActiveView('statistics');
        }
    }, [currentTemplate]);

    const handleTemplateSave = (template: Template) => {
        // Add to collection
        collection.current.addTemplate(template);
        const updatedTemplates = collection.current.getTemplates();
        setTemplates(updatedTemplates);
        if (onTemplateSave) {
            onTemplateSave(template);
        }
        // Switch to statistics view
        setActiveView('statistics');
    };

    const handleTemplateLoad = (template: Template) => {
        if (onTemplateLoad) {
            onTemplateLoad(template);
        }
        // Switch to statistics view
        setActiveView('statistics');
    };

    return (
        <div className="left-panel" style={{ width: `${width}px` }}>
            <div className="view-selector">
                <button 
                    onClick={() => setActiveView('template')}
                    className={activeView === 'template' ? 'active' : ''}
                >
                    Template
                </button>
                <button 
                    onClick={() => setActiveView('statistics')}
                    className={activeView === 'statistics' ? 'active' : ''}
                >
                    Statistics
                </button>
                <button 
                    onClick={() => setActiveView('templates')}
                    className={activeView === 'templates' ? 'active' : ''}
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
