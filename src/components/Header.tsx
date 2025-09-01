import React from 'react';

interface HeaderProps {
    templateName: string;
    lastUpdated: Date;
}

export const Header: React.FC<HeaderProps> = ({ templateName, lastUpdated }) => {
    return (
        <header className="header" style={{
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            backgroundColor: '#f5f5f5',
            borderBottom: '1px solid #ddd'
        }}>
            <h1 data-i18n="appTitle" style={{ margin: 0 }}>
                {templateName}
            </h1>
            <div className="controls" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button>Save</button>
                <button>Load</button>
                <button>Settings</button>
            </div>
            <div className="last-updated">
                Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
        </header>
    );
};
