const express = require('express');
const cors = require('cors');
const placesRoutes = require('./routes/places');
const usersRoutes = require('./routes/users');
const plansRoutes = require('./routes/plans');
const getPort = require('get-port');

const app = express();
let server;

app.use(cors());

app.use('/api/places', placesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/plans', plansRoutes);

// Find an available port dynamically
getPort().then((port) => {
  // Start the server
  server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}).catch((error) => {
  console.error('Failed to find an available port:', error);
  process.exit(1);
});

// Gracefully handle termination signal
const handleTermination = () => {
  console.log('Closing the server...');
  server.close(() => {
    console.log('Server closed. Exiting process...');
    process.exit(0);
  });
};

process.on('SIGTERM', handleTermination);
process.on('SIGINT', handleTermination);

module.exports = app;
