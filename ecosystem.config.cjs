module.exports = {
  apps: [
    {
      name: "plancraft",
      script: "server.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_file: ".env.local",
      error_file: "~/.pm2/logs/plancraft-error.log",
      out_file: "~/.pm2/logs/plancraft-out.log",
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
    },
  ],
};
