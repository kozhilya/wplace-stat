import React, { useEffect, useState } from 'react';
import { AppComponent } from './components/AppComponent';

const App: React.FC = () => {
    const [tileLoaded, setTileLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Test the proxy by loading a tile
        const testProxy = async () => {
            try {
                const response = await fetch('/api/tile/1295/653');
                if (response.ok) {
                    setTileLoaded(true);
                } else {
                    setError(`HTTP error: ${response.status}`);
                }
            } catch (err) {
                setError(`Failed to load tile: ${(err as Error).message}`);
            }
        };

        testProxy();
    }, []);

    return (
        <>
            <div>
                <h1>WPlace Stat Application</h1>
                <p>Application is working!</p>
                {tileLoaded && <p>✅ Tile loaded successfully through proxy!</p>}
                {error && <p style={{ color: 'red' }}>❌ Error: {error}</p>}
            </div>
            <AppComponent />
        </>
    );
};

export default App;
