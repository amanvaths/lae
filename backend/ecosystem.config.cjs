/** PM2 process definition — run from backend/ on VPS */
module.exports = {
  apps: [
    {
      name: "lae-analytics-api",
      script: "dist/server.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 15,
      min_uptime: "10s",
      watch: false,
      time: true,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
