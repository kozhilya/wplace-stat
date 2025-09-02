import React, { useState, useEffect } from 'react';
import { LanguageManager } from '../script/managers/language-manager';

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
    const [currentLanguage, setCurrentLanguage] = useState(LanguageManager.getCurrentLanguage());
    
    useEffect(() => {
        const handleLanguageChange = () => {
            setCurrentLanguage(LanguageManager.getCurrentLanguage());
        };
        
        LanguageManager.onLanguageChange(handleLanguageChange);
        
        return () => {
            LanguageManager.removeLanguageChangeListener(handleLanguageChange);
        };
    }, []);

    const handleLanguageChange = () => {
        const newLanguage = currentLanguage === 'en' ? 'ru' : 'en';
        LanguageManager.setLanguage(newLanguage);
    };

    return (
        <header className="header">
            <div className="header-left">
                <button 
                    className="templates-button"
                    onClick={onTemplatesButtonClick}
                    title={LanguageManager.getText('templates')}
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
                        title={LanguageManager.getText('template')}
                    >
                        ✏️
                    </button>
                )}
            </div>
            <div className="header-right">
                <button 
                    className="language-button"
                    onClick={handleLanguageChange}
                    title="Switch language"
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        padding: '5px',
                        borderRadius: '3px',
                        marginRight: '10px'
                    }}
                >
                    {currentLanguage.toUpperCase()}
                </button>
                <div className="last-updated">
                    {LanguageManager.getText('lastUpdated')}: {lastUpdated.toLocaleTimeString()}
                </div>
            </div>
        </header>
    );
};
