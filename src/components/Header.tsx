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

    const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newLanguage = event.target.value as 'en' | 'ru';
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
                <h1>
                    WPlace Progress Tracker - {templateName}
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
                <select 
                    value={currentLanguage}
                    onChange={handleLanguageChange}
                    className="language-selector"
                >
                    <option value="en">EN</option>
                    <option value="ru">RU</option>
                    <option value="es">ES</option>
                </select>
                <div className="last-updated">
                    {LanguageManager.getText('lastUpdated')}: {lastUpdated.toLocaleTimeString()}
                </div>
            </div>
        </header>
    );
};
