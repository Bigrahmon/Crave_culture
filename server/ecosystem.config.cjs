module.exports = {
  apps: [
    {
      name: "crave-culture-api",
      script: "src/server.js",
      cwd: __dirname,
      env: {
        NODE_ENV: "production"
      },
      time: true,
      max_restarts: 20,
      restart_delay: 1500
    }
  ]
};

