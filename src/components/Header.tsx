import React from 'react';

interface HeaderProps {
    templateName: string;
    lastUpdated: Date;
    onTemplateButtonClick: () => void;
    onTemplatesButtonClick: () => void;
    onCloseButtonClick: () => void;
    hasActiveTemplate: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
    templateName, 
    lastUpdated, 
    onTemplateButtonClick, 
    onTemplatesButtonClick, 
    onCloseButtonClick,
    hasActiveTemplate 
}) => {
    return (
        <header className="header">
            <div className="header-left">
                <button 
                    className="templates-button"
                    onClick={onTemplatesButtonClick}
                    title="Templates"
                >
                    ☰
                </button>
                <h1 data-i18n="appTitle">
                    {templateName}
                </h1>
            </div>
            <div className="header-right">
                {hasActiveTemplate && (
                    <button 
                        className="close-button"
                        onClick={onCloseButtonClick}
                        title="Close"
                    >
                        ✕
                    </button>
                )}
                <button 
                    className="template-button"
                    onClick={onTemplateButtonClick}
                    title="Template"
                >
                    ✏️
                </button>
                <div className="last-updated">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
            </div>
        </header>
    );
};
