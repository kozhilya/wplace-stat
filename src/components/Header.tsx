import React from 'react';

interface HeaderProps {
    templateName: string;
    lastUpdated: Date;
    onTemplateButtonClick: () => void;
    onTemplatesButtonClick: () => void;
    hasActiveTemplate: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
    templateName, 
    lastUpdated, 
    onTemplateButtonClick, 
    onTemplatesButtonClick,
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
                {hasActiveTemplate && (
                    <button 
                        className="template-button"
                        onClick={onTemplateButtonClick}
                        title="Template"
                    >
                        ✏️
                    </button>
                )}
            </div>
            <div className="header-right">
                <div className="last-updated">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
            </div>
        </header>
    );
};
