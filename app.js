const express = require('express');
const cors = require('cors');
const placesRoutes = require('./routes/places');
const usersRoutes = require('./routes/users');
const plansRoutes = require('./routes/plans');

const app = express();
const port = process.env.PORT || 5001;
let server;

app.use(cors());

app.use('/api/places', placesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/plans', plansRoutes);

// Start the server
server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Gracefully handle termination signal
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Closing the server...');
  server.close(() => {
    console.log('Server closed. Exiting process...');
    process.exit(0);
  });
});

module.exports = app;