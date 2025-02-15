/* eslint-disable no-undef */
module.exports = {
  apps: [
    {
      name: 'app',
      script: './dist/main.js', // Entry point of your Express application
      instances: '10', // Number of instances
      exec_mode: 'cluster', // Use "cluster" mode if you want load balancing
      env: {
        NODE_ENV: 'production',
        PORT: 9650,
      },
      node_args: '--max-old-space-size=32768',
      error_file: './logs/err.log', // Path to store error logs
      out_file: './logs/out.log', // Path to store output logs
      merge_logs: true, // Merge logs across instances
      autorestart: true, // Auto-restart on crash
      watch: false, // Disable watching file changes in production
      time: true,
    },
  ],
};
