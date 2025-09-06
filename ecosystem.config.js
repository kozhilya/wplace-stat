module.exports = {
    apps: [
        {
            name: 'wplace-stat',
            script: 'server/start.cjs',
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
