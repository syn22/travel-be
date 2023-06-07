require('dotenv').config();
const { Pool } = require('pg');
const mongoose = require('mongoose');

// PostgreSQL connection settings
const pgPool = new Pool({
  user: process.env.POSTGRES_USERNAME,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
  ssl: {
    ca: process.env.POSTGRES_CA_CERT,
  },
});

// MongoDB connection settings
const mongoURL = process.env.MONGODB_URL;

// Connect to PostgreSQL
pgPool
  .connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch((error) => console.error('Error connecting to PostgreSQL:', error));

// Connect to MongoDB
mongoose
  .connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((error) => console.error('Error connecting to MongoDB Atlas:', error));

module.exports = { pgPool, mongoose };
