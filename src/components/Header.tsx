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
    const [isDarkMode, setIsDarkMode] = useState(document.body.classList.contains('dark-mode'));
    
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
                <button 
                    className="dark-mode-toggle"
                    onClick={() => {
                        const isDark = document.body.classList.toggle('dark-mode');
                        localStorage.setItem('darkMode', isDark ? 'true' : 'false');
                        setIsDarkMode(isDark);
                    }}
                    title={isDarkMode ? LanguageManager.getText('lightMode') : LanguageManager.getText('darkMode')}
                >
                    {isDarkMode ? '☀️' : '🌙'}
                </button>
                <div className="last-updated">
                    {LanguageManager.getText('lastUpdated')}: {lastUpdated.toLocaleTimeString()}
                </div>
                <a 
                    href="https://github.com/kozhilya/wplace-stat" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="github-link"
                    title="View on GitHub"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                </a>
            </div>
        </header>
    );
};
