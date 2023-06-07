const express = require('express');
const cors = require('cors');
const placesRoutes = require('./routes/places');
const usersRoutes = require('./routes/users');
const plansRoutes = require('./routes/plans');
const { createServer } = require('http');
const portfinder = require('portfinder');

const app = express();
const startServer = async () => {
  const port = await portfinder.getPortPromise();

  app.use(cors());

  app.use('/api/places', placesRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/plans', plansRoutes);

  const server = createServer(app);

  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  const handleTermination = () => {
    console.log('Closing the server...');
    server.close(() => {
      console.log('Server closed. Exiting process...');
      process.exit(0);
    });
  };

  process.on('SIGTERM', handleTermination);
  process.on('SIGINT', handleTermination);
};

startServer();

module.exports = app;
