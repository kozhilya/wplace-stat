import React from 'react';

interface HeaderProps {
    templateName: string;
    lastUpdated: Date;
}

export const Header: React.FC<HeaderProps> = ({ templateName, lastUpdated }) => {
    return (
        <header className="header">
            <h1 data-i18n="appTitle">
                {templateName}
            </h1>
            <div className="last-updated">
                Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
        </header>
    );
};
