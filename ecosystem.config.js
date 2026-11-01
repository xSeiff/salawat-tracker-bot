module.exports = {
  apps: [
    {
      name: 'salah-bot',
      script: 'src/index.js',
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
