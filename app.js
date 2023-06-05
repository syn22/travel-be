const express = require('express');
const cors = require('cors');
const placesRoutes = require('./routes/places');
const usersRoutes = require('./routes/users');
const plansRoutes = require('./routes/plans');

const app = express();

app.use(cors());

app.use('/api/places', placesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/plans', plansRoutes);


const port = process.env.PORT || 5001;
app.listen(port, () => console.log(`Server is running on port ${port}`));

module.exports = app;