// import dotenv from 'dotenv';

// dotenv.config({ path: 'config.env' });
// import createUploadDirectories from './utils/createUploadDirectory.js';
// import dbConnection from './config/database.js';
// import app from './app.js';

const dotenv = await import('dotenv');

dotenv.config({ path: 'config.env' });

const createUploadDirectories = await import('./utils/createUploadDirectory.js');
const dbConnection = await import('./config/database.js');
const app = await import('./app.js');

// Create main uploads directory if it doesn't exist with model-specific subdirectories
createUploadDirectories.default();

// Connect with db
dbConnection.default();

const PORT = process.env.PORT || 8000;
const server = app.default.listen(PORT, () => {
  console.log(`App running on port ${PORT}`);
});

// Handle Unhandled Rejections outside express
process.on('unhandledRejection', (err: Error) => {
  console.log(`Unhandled Rejection Error: ${err.name} | ${err.message}`);
  console.log(err.stack);
  server.close(() => {
    console.log('Shutting down...');
    process.exit(1);
  });
});

// Handle Uncaught Exception
process.on('uncaughtException', (err: Error) => {
  console.log(`Uncaught Exception: ${err.name} | ${err.message}`);
  console.log('Shutting down...');

  process.exit(1);
});
