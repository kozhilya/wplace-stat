import React, { useState, useEffect } from 'react';
import { TemplateConfig } from './TemplateConfig';
import { StatisticsView } from './StatisticsView';
import { TemplateList } from './TemplateList';
import { Template } from '../types/template';
import { StatisticsRow } from '../managers/statistics-manager';
import { TemplateCollection } from '../types/template-collection';
import { LanguageManager } from '../managers/language-manager';
import { debug } from '../utils';

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
    onTemplateButtonClick: () => void;
    selectedColorId?: number | null;
}

export const LeftPanel: React.FC<LeftPanelProps> = (props) => {
    const { 
        width, 
        onTemplateSave, 
        onTemplateLoad, 
        statistics = [], 
        currentTemplate,
        activeView,
        onCloseView,
        onStatisticsRowClick,
        onCreateTemplate,
        onTemplateButtonClick,
        selectedColorId
    } = props;
    const collection = React.useRef(new TemplateCollection());
    const [templates, setTemplates] = useState<Template[]>([]);
    const [language, setLanguage] = useState(LanguageManager.getCurrentLanguage());
    const [isNewTemplate, setIsNewTemplate] = useState(false);

    useEffect(() => {
        debug('LeftPanel.useEffect: Loading templates on mount');
        // Load templates on mount
        const loadedTemplates = collection.current.getTemplates();
        debug(`LeftPanel.useEffect: Loaded ${loadedTemplates.length} templates`);
        setTemplates(loadedTemplates);
    }, []);

    useEffect(() => {
        debug('LeftPanel.useEffect: Setting up language change listener');
        const handleLanguageChange = () => {
            debug('LeftPanel.handleLanguageChange: Language changed, updating state');
            setLanguage(LanguageManager.getCurrentLanguage());
        };
        
        LanguageManager.onLanguageChange(handleLanguageChange);
        
        return () => {
            debug('LeftPanel.useEffect: Cleaning up language change listener');
            LanguageManager.removeLanguageChangeListener(handleLanguageChange);
        };
    }, []);

    const handleTemplateSave = (template: Template) => {
        debug(`LeftPanel.handleTemplateSave: Saving template: ${template.name}`);
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
        debug('LeftPanel.handleCreateTemplate: Creating new template');
        setIsNewTemplate(true);
        // The parent component should handle switching to the template view
        // We'll assume onCreateTemplate does this
        onCreateTemplate();
    };

    const handleTemplateLoad = (template: Template) => {
        debug(`LeftPanel.handleTemplateLoad: Loading template from list: ${template.name}`);
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
                            onClick={() => {
                                debug('LeftPanel.onClick: Closing view');
                                onCloseView();
                            }}
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
                    currentTemplate={isNewTemplate ? undefined : currentTemplate}
                    editedTemplate={isNewTemplate ? null : currentTemplate}
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
                    currentTemplate={isNewTemplate ? undefined : currentTemplate}
                    editedTemplate={isNewTemplate ? null : undefined}
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
