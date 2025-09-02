module.exports = {
    apps: [
        {
            name: 'wplace-stat',
            script: 'npx',
            args: 'serve -s dist -l ${process.env.PORT || 3000}',
            interpreter: 'none',
            env: {
                NODE_ENV: 'production'
            },
            watch: false,
            instances: 1,
            autorestart: true,
            max_memory_restart: '1G'
        }
    ]
};
