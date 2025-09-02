import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { Splitter } from './Splitter';
import { LanguageManager } from '../script/managers/language-manager';
import { Template, TemplateCollection } from '../script/template';
import { StatisticsRow } from '../script/managers/statistics-manager';

export const AppComponent: React.FC = () => {
    const [templateName, setTemplateName] = useState<string>('Untitled Template');
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [leftPanelWidth, setLeftPanelWidth] = useState<number>(300);
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [statistics, setStatistics] = useState<StatisticsRow[]>([]);
    const [currentTemplate, setCurrentTemplate] = useState<Template | undefined>();
    const [templates, setTemplates] = useState<Template[]>([]);
    const templateCollection = React.useRef(new TemplateCollection());

    useEffect(() => {
        LanguageManager.initialize();
        
        // Load templates from localStorage
        const loadedTemplates = templateCollection.current.getTemplates();
        setTemplates(loadedTemplates);
        
        // Handle hash on mount
        const handleInitialHash = async () => {
            if (window.location.hash) {
                try {
                    const hash = window.location.hash.substring(1);
                    const template = Template.deserialize(hash);
                    
                    // Check if the template exists in the collection
                    const exists = loadedTemplates.some(t => 
                        t.name === template.name && 
                        t.tlX === template.tlX && 
                        t.tlY === template.tlY && 
                        t.pxX === template.pxX && 
                        t.pxY === template.pxY && 
                        t.imageDataUrl === template.imageDataUrl
                    );
                    
                    // If not exists, add to collection
                    if (!exists) {
                        templateCollection.current.addTemplate(template);
                        const updatedTemplates = templateCollection.current.getTemplates();
                        setTemplates(updatedTemplates);
                    }
                    
                    // Load and set the current template
                    await template.loadTemplateImage();
                    await template.loadActualCanvas();
                    setCurrentTemplate(template);
                    setTemplateName(template.name);
                    setLastUpdated(new Date());
                } catch (error) {
                    console.error('Error loading template from hash:', error);
                }
            } else if (loadedTemplates.length > 0) {
                // If hash is empty but there are templates, show the template list view
                // This will be handled by LeftPanel
            }
            // Otherwise, show the template config view (default)
        };

        handleInitialHash();
        
        // Listen for hash changes to update the template
        const handleHashChange = async () => {
            if (window.location.hash) {
                try {
                    const hash = window.location.hash.substring(1);
                    const template = Template.deserialize(hash);
                    await template.loadTemplateImage();
                    await template.loadActualCanvas();
                    setCurrentTemplate(template);
                    setTemplateName(template.name);
                    setLastUpdated(new Date());
                } catch (error) {
                    console.error('Error loading template from hash change:', error);
                }
            } else {
                setCurrentTemplate(undefined);
                setTemplateName('Untitled Template');
                setLastUpdated(new Date());
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        
        // Cleanup
        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, []);

    const handleSplitterMouseDown = (e: React.MouseEvent) => {
        setIsResizing(true);
        document.addEventListener('mousemove', handleMouseMove as any);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isResizing) {
            const newWidth = e.clientX;
            if (newWidth > 200 && newWidth < window.innerWidth - 200) {
                setLeftPanelWidth(newWidth);
            }
        }
    };

    const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove as any);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    const handleTemplateSave = (template: Template) => {
        setTemplateName(template.name);
        setLastUpdated(new Date());
        setCurrentTemplate(template);
        // Serialize and add to hash
        const serialized = template.serialize();
        window.location.hash = serialized;
    };

    const handleTemplateLoad = (template: Template) => {
        setTemplateName(template.name);
        setLastUpdated(new Date());
        setCurrentTemplate(template);
        // Serialize and add to hash
        const serialized = template.serialize();
        window.location.hash = serialized;
    };

    return (
        <div className="app">
            <Header 
                templateName={templateName} 
                lastUpdated={lastUpdated} 
            />
            <div className="main-content" style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
                <LeftPanel 
                    width={leftPanelWidth} 
                    statistics={statistics} 
                    onTemplateSave={handleTemplateSave}
                    onTemplateLoad={handleTemplateLoad}
                />
                <Splitter onMouseDown={handleSplitterMouseDown} />
                <RightPanel currentTemplate={currentTemplate} />
            </div>
        </div>
    );
};
