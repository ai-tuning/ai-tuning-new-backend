/* eslint-disable no-undef */
module.exports = {
  apps: [
    {
      name: 'new-backend',
      script: './dist/main.js', // Entry point of your Express application
      env: {
        NODE_ENV: 'production',
        PORT: 2600,
      },
      error_file: './logs/err.log', // Path to store error logs
      out_file: './logs/out.log', // Path to store output logs
      merge_logs: true, // Merge logs across instances
      autorestart: true, // Auto-restart on crash
      watch: false, // Disable watching file changes in production
      time: true,
    },
  ],
};
