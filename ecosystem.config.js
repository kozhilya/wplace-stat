export default {
    apps: [
        {
            name: 'wplace-stat',
            script: 'server/index.js',
            interpreter: 'node',
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
