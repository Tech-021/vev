/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");

const appCwd = fs.existsSync("/var/www/vev/current")
  ? "/var/www/vev/current"
  : "/var/www/vev";

module.exports = {
  apps: [
    {
      name: "vev",
      // The workflow switches this symlink to each successful release.
      // Before the first deployment, keep using the existing app directory.
      cwd: appCwd,
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
