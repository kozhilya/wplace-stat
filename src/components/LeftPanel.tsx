import React, { useState, useEffect } from 'react';
import { TemplateConfig } from './TemplateConfig';
import { StatisticsView } from './StatisticsView';
import { TemplateList } from './TemplateList';
import { Template } from '../script/template';
import { StatisticsRow } from '../script/managers/statistics-manager';
import { TemplateCollection } from '../script/template';
import { LanguageManager } from '../script/managers/language-manager';

interface LeftPanelProps {
    width: number;
    onTemplateSave?: (template: Template) => void;
    onTemplateLoad?: (template: Template) => void;
    statistics?: StatisticsRow[];
    currentTemplate?: Template;
    activeView: 'template' | 'templates' | null;
    onCloseView: () => void;
    onStatisticsRowClick?: (colorId: number | null) => void;
    onCreateTemplate: () => void;
    selectedColorId?: number | null;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({ 
    width, 
    onTemplateSave, 
    onTemplateLoad, 
    statistics = [], 
    currentTemplate,
    activeView,
    onCloseView,
    onStatisticsRowClick,
    onCreateTemplate,
    selectedColorId
}) => {
    const collection = React.useRef(new TemplateCollection());
    const [templates, setTemplates] = useState<Template[]>([]);
    const [language, setLanguage] = useState(LanguageManager.getCurrentLanguage());
    const [isNewTemplate, setIsNewTemplate] = useState(false);

    useEffect(() => {
        // Load templates on mount
        const loadedTemplates = collection.current.getTemplates();
        setTemplates(loadedTemplates);
    }, []);

    useEffect(() => {
        const handleLanguageChange = () => {
            setLanguage(LanguageManager.getCurrentLanguage());
        };
        
        LanguageManager.onLanguageChange(handleLanguageChange);
        
        return () => {
            LanguageManager.removeLanguageChangeListener(handleLanguageChange);
        };
    }, []);

    const handleTemplateSave = (template: Template) => {
        // Add to collection
        collection.current.addTemplate(template);
        const updatedTemplates = collection.current.getTemplates();
        setTemplates(updatedTemplates);
        if (onTemplateSave) {
            onTemplateSave(template);
        }
        // Reset new template flag
        setIsNewTemplate(false);
        // Close the view
        onCloseView();
    };

    const handleCreateTemplate = () => {
        setIsNewTemplate(true);
        onCreateTemplate();
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
            {/* Show header when NOT in statistics view (activeView is not null) or when showing new template */}
            {(activeView !== null || (templates.length === 0 && !currentTemplate)) && (
                <div className="left-panel-header">
                    <h2>
                        {activeView === 'template' || (templates.length === 0 && !currentTemplate) 
                            ? (isNewTemplate || (templates.length === 0 && !currentTemplate) ? LanguageManager.getText('newTemplate') : LanguageManager.getText('editTemplateHeader'))
                            : LanguageManager.getText('savedTemplatesHeader')}
                    </h2>
                    {activeView !== null && (
                        <button 
                            className="close-button"
                            onClick={onCloseView}
                            title={LanguageManager.getText('close')}
                        >
                            ✕
                        </button>
                    )}
                </div>
            )}
            {activeView === 'template' && (
                <TemplateConfig 
                    onTemplateSave={handleTemplateSave} 
                    isNewTemplate={isNewTemplate}
                    currentTemplate={currentTemplate}
                />
            )}
            {activeView === 'templates' && (
                <TemplateList 
                    onTemplateSelect={handleTemplateLoad} 
                    onCreateTemplate={handleCreateTemplate}
                />
            )}
            {/* Show TemplateConfig when no templates exist and no current template */}
            {templates.length === 0 && !currentTemplate && activeView === null && (
                <TemplateConfig 
                    onTemplateSave={handleTemplateSave} 
                    isNewTemplate={isNewTemplate}
                    currentTemplate={currentTemplate}
                />
            )}
            {currentTemplate && activeView === null && (
                <StatisticsView 
                    statistics={statistics} 
                    onRowClick={onStatisticsRowClick} 
                    selectedColorId={selectedColorId}
                />
            )}
        </div>
    );
};
