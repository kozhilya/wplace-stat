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
    const [language, setLanguage] = useState(LanguageManager.getCurrentLanguage());

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
            {/* Show close button when NOT in statistics view (activeView is not null) */}
            {activeView !== null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h2 style={{ margin: 0 }}>
                        {activeView === 'template' ? LanguageManager.getText('editTemplateHeader') : LanguageManager.getText('savedTemplatesHeader')}
                    </h2>
                    <button 
                        className="close-button"
                        onClick={onCloseView}
                        title={LanguageManager.getText('close')}
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
            {currentTemplate && activeView === null && (
                <StatisticsView statistics={statistics} />
            )}
        </div>
    );
};
