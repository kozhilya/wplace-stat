import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { Splitter } from './Splitter';
import { LanguageManager } from '../script/managers/language-manager';

export const AppComponent: React.FC = () => {
    const [templateName, setTemplateName] = useState<string>('Untitled Template');
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [leftPanelWidth, setLeftPanelWidth] = useState<number>(300);
    const [isResizing, setIsResizing] = useState<boolean>(false);

    useEffect(() => {
        LanguageManager.initialize();
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

    return (
        <div className="app">
            <Header 
                templateName={templateName} 
                lastUpdated={lastUpdated} 
            />
            <div className="main-content" style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
                <LeftPanel width={leftPanelWidth} />
                <Splitter onMouseDown={handleSplitterMouseDown} />
                <RightPanel />
            </div>
        </div>
    );
};
