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
    activeView: 'template' | 'templates' | null;
    onCloseView: () => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({ 
    width, 
    onTemplateSave, 
    onTemplateLoad, 
    statistics = [], 
    currentTemplate,
    activeView,
    onCloseView
}) => {
    const collection = React.useRef(new TemplateCollection());
    const [templates, setTemplates] = useState<Template[]>([]);

    useEffect(() => {
        // Load templates on mount
        const loadedTemplates = collection.current.getTemplates();
        setTemplates(loadedTemplates);
    }, []);

    const handleTemplateSave = (template: Template) => {
        // Add to collection
        collection.current.addTemplate(template);
        const updatedTemplates = collection.current.getTemplates();
        setTemplates(updatedTemplates);
        if (onTemplateSave) {
            onTemplateSave(template);
        }
        // Close the view
        onCloseView();
    };

    const handleTemplateLoad = (template: Template) => {
        if (onTemplateLoad) {
            onTemplateLoad(template);
        }
        // Close the view
        onCloseView();
    };

    return (
        <div className="left-panel" style={{ width: `${width}px` }}>
            {/* Show close button when statistics is active (activeView is null and currentTemplate exists) */}
            {currentTemplate && activeView === null && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                    <button 
                        className="close-button"
                        onClick={onCloseView}
                        title="Close"
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.2rem',
                            cursor: 'pointer',
                            padding: '5px',
                            borderRadius: '3px'
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}
            {activeView === 'template' && <TemplateConfig onTemplateSave={handleTemplateSave} />}
            {activeView === 'templates' && <TemplateList onTemplateSelect={handleTemplateLoad} />}
            {currentTemplate && activeView === null && <StatisticsView statistics={statistics} />}
        </div>
    );
};
