module.exports = {
  apps: [
    {
      name: "hisabo-api",
      cwd: "./apps/api",
      script: "dist/index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 4000
      }
    },
    {
      name: "hisabo-web",
      cwd: "./apps/web",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
