module.exports = {
  apps: [
    {
      name: "vev",
      cwd: "/var/www/vev",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3010",
      interpreter: "/usr/bin/node",
      env: {
        NODE_ENV: "production",
        PORT: "3010",
        NEXT_TELEMETRY_DISABLED: "1",
      },
      autorestart: true,
      restart_delay: 5000,
    },
  ],
};
