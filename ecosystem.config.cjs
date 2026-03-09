/** @type {import('pm2').StartOptions} */
module.exports = {
  apps: [
    {
      name: "plancraft",
      script: "server.js",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
