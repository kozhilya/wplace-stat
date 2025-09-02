module.exports = {
    apps: [
        {
            name: 'wplace-stat',
            script: 'npx',
            args: 'serve -s dist -l 3001',
            interpreter: 'none',
            env: {
                NODE_ENV: 'production',
                PORT: 3001
            },
            watch: false,
            instances: 1,
            autorestart: true,
            max_memory_restart: '1G'
        }
    ]
};
