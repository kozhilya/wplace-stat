// Переделай этот React-компонент в представление в виде `class`. Создай документацию для методов этого файла, а также создай больше `debug`-сообщений. Добавь префиксом в квадратных скобках класс и метод, в котором выводит сообщение. AI!

import React, { useEffect, useRef } from 'react';

interface SplitterProps {
    onResize: (deltaX: number) => void;
}

export const Splitter: React.FC<SplitterProps> = ({ onResize }) => {
    const isResizing = useRef(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizing.current) {
                onResize(e.movementX);
            }
        };

        const handleMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [onResize]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    return (
        <div 
            className="splitter" 
            onMouseDown={handleMouseDown}
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
