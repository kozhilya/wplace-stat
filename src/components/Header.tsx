import React, { useState, useEffect } from 'react';
import { LanguageManager } from '../script/managers/language-manager';
import { debug } from '../utils';

interface HeaderProps {
    templateName: string;
    lastUpdated: Date;
    onTemplateButtonClick: () => void;
    onTemplatesButtonClick: () => void;
    hasActiveTemplate: boolean;
    isUpdating: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
    templateName, 
    lastUpdated, 
    onTemplateButtonClick, 
    onTemplatesButtonClick,
    hasActiveTemplate,
    isUpdating 
}) => {
    const [currentLanguage, setCurrentLanguage] = useState(LanguageManager.getCurrentLanguage());
    const [isDarkMode, setIsDarkMode] = useState(document.body.classList.contains('dark-mode'));
    
    useEffect(() => {
        debug('Header.useEffect: Setting up language change listener');
        const handleLanguageChange = () => {
            debug('Header.handleLanguageChange: Language changed, updating state');
            setCurrentLanguage(LanguageManager.getCurrentLanguage());
        };
        
        LanguageManager.onLanguageChange(handleLanguageChange);
        
        return () => {
            debug('Header.useEffect: Cleaning up language change listener');
            LanguageManager.removeLanguageChangeListener(handleLanguageChange);
        };
    }, []);

    const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newLanguage = event.target.value as 'en' | 'ru' | 'es';
        debug(`Header.handleLanguageChange: Language changed to: ${newLanguage}`);
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
                    <i className="fas fa-bars"></i>
                </button>
                <h1>
                    WPlace Progress Tracker - {templateName}
                </h1>
                {hasActiveTemplate && (
                    <button 
                        className="template-button"
                        onClick={() => {
                            debug('Header.onClick: Template edit button clicked');
                            onTemplateButtonClick();
                        }}
                        title={LanguageManager.getText('template')}
                    >
                        <i className="fas fa-pencil-alt"></i>
                    </button>
                )}
            </div>
            <div className="header-right">
                <div className="last-updated-container">
                    <button 
                        className="last-updated-button"
                        onClick={() => {
                            if (!isUpdating) {
                                debug('Header.onClick: Manual update requested');
                                // Trigger manual update
                                const event = new CustomEvent('manualUpdateRequested');
                                window.dispatchEvent(event);
                            }
                        }}
                        title="Click to update now"
                        disabled={isUpdating}
                    >
                        <i className={`fas fa-sync-alt refresh-icon ${isUpdating ? 'rotating' : ''}`}></i>
                        {LanguageManager.getText('lastUpdated')}: {lastUpdated.toLocaleTimeString()}
                    </button>
                </div>
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
                        debug(`Header.onClick: Dark mode ${isDark ? 'enabled' : 'disabled'}`);
                        localStorage.setItem('darkMode', isDark ? 'true' : 'false');
                        setIsDarkMode(isDark);
                    }}
                    title={isDarkMode ? LanguageManager.getText('lightMode') : LanguageManager.getText('darkMode')}
                >
                    <i className={isDarkMode ? 'fas fa-sun' : 'fas fa-moon'}></i>
                </button>
                <a 
                    href="https://github.com/kozhilya/wplace-stat" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="button github-link"
                    title="View on GitHub"
                >
                    <i className="fab fa-github"></i>
                </a>
            </div>
        </header>
    );
};
