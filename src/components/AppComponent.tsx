import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { Splitter } from './Splitter';
import { LanguageManager } from '../script/managers/language-manager';
import { Template } from '../script/template';
import { StatisticsRow } from '../script/managers/statistics-manager';

export const AppComponent: React.FC = () => {
    const [templateName, setTemplateName] = useState<string>('Untitled Template');
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [leftPanelWidth, setLeftPanelWidth] = useState<number>(300);
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [statistics, setStatistics] = useState<StatisticsRow[]>([]);

    useEffect(() => {
        LanguageManager.initialize();
        
        // Listen for hash changes to update the template
        const handleHashChange = () => {
            if (window.location.hash) {
                try {
                    const hash = window.location.hash.substring(1);
                    const template = Template.deserialize(hash);
                    setTemplateName(template.name);
                    setLastUpdated(new Date());
                } catch (error) {
                    console.error('Error loading template from hash change:', error);
                }
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
        // Serialize and add to hash
        const serialized = template.serialize();
        window.location.hash = serialized;
    };

    const handleTemplateLoad = (template: Template) => {
        setTemplateName(template.name);
        setLastUpdated(new Date());
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
                <RightPanel />
            </div>
        </div>
    );
};
