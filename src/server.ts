// import mongoose from 'mongoose';
// import app from './app';
// import config from './app/config';
// import { startupLogger } from './app/utils/startupLogger';


// const port = Number(config.port) || 5001;

// const startServer = async () => {
//   try {
//     await mongoose.connect(config.database_url as string);
//     console.log('Database connected');

//     app.listen(port, () => {
//      startupLogger(Number(port));
//     });
//   } catch (err) {
//     console.error('Error starting server:', err);
//     process.exit(1);
//   }
// };

// startServer();

// // Handle unhandled promise rejections
// process.on('unhandledRejection', (err: any) => {
//   console.error('Unhandled Rejection:', err);
//   process.exit(1);
// });

// // Handle uncaught exceptions
// process.on('uncaughtException', (err: any) => {
//   console.error('Uncaught Exception:', err);
//   process.exit(1);
// });

import mongoose from 'mongoose';
import { createServer } from 'http';
import app from './app';
import config from './app/config';
import { startupLogger } from './app/utils/startupLogger';
import initializeSocketIO from './socketIo';

const port = Number(config.port) || 5000;
export let io: any;

const startServer = async () => {
  try {
    await mongoose.connect(config.database_url as string);
    console.log('Database connected');

    const server = createServer(app);
    io = initializeSocketIO(server);
    app.locals.io = io;

    server.listen(port, () => startupLogger(port));
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
};

startServer();

process.on('unhandledRejection', (err: any) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err: any) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});