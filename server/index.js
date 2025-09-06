const express = require('express');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware для обработки CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Прокси для загрузки тайлов
app.get('/api/tile/:x/:y', async (req, res) => {
    const { x, y } = req.params;
    const tileUrl = `https://backend.wplace.live/files/s0/tiles/${x}/${y}.png`;
    
    try {
        const response = await fetch(tileUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Устанавливаем соответствующие заголовки
        res.set('Content-Type', 'image/png');
        res.set('Cache-Control', 'public, max-age=300'); // Кэшируем на 5 минут
        
        // Пересылаем данные
        const buffer = await response.buffer();
        res.send(buffer);
    } catch (error) {
        console.error('Error fetching tile:', error);
        res.status(500).send('Error fetching tile');
    }
});

// Обслуживание статических файлов из dist после сборки
app.use(express.static(path.join(__dirname, '../dist')));

// Все остальные запросы отправляем на index.html для поддержки клиентской маршрутизации
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
