import React from 'react';

interface SplitterProps {
    onMouseDown: (e: React.MouseEvent) => void;
}

export const Splitter: React.FC<SplitterProps> = ({ onMouseDown }) => {
    return (
        <div 
            className="splitter" 
            onMouseDown={onMouseDown}
            style={{
                width: '5px',
                height: '100%',
                backgroundColor: '#ddd',
                cursor: 'col-resize',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <div style={{
                width: '3px',
                height: '30px',
                backgroundColor: '#999',
                borderRadius: '2px'
            }} />
        </div>
    );
};
