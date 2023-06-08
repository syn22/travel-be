const express = require('express');
const router = express.Router();
const { pgPool, mongoose } = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pgPool.query('SELECT * FROM Places');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while retrieving data' });
  }
});

router.post('/', express.json(), async (req, res) => {
  const { place } = req.body;

  if (!place || !place.name || !place.geometry || !place.types || !place.photos || !place.current_opening_hours) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Extract the necessary data
  const name = place.name;
  const type = place.types[0]; // Select the first type for the 'type' field
  const types = place.types; // All types
  const longitude = place.geometry.location.lng;
  const latitude = place.geometry.location.lat;
  const photo_url = place.photos.map(photo => photo.html_attributions[0]); // Getting all photo urls
  const opening_hours = place.current_opening_hours.weekday_text; // Assuming opening_hours is an array

  const query = `
    INSERT INTO places (name, type, types, longitude, latitude, photo_url, opening_hours)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;

  const values = [name, type, types, longitude, latitude, photo_url, opening_hours];

  try {
    const result = await pgPool.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding new place:', error);
    res.status(500).json({ error: 'An error occurred while adding a new place' });
  }
});

router.post('/plan', express.json(), async (req, res) => {
  const { plan_id, place_name } = req.body;

  if (!plan_id || !place_name) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  try {
    // Retrieve the place_id for the given place_name
    const placeQuery = `
      SELECT id
      FROM places
      WHERE name = $1;
    `;
    const placeResult = await pgPool.query(placeQuery, [place_name]);

    if (placeResult.rows.length === 0) {
      return res.status(400).json({ error: 'Place not found' });
    }

    const place_id = placeResult.rows[0].id;

    // Check if the place is already associated with the travel plan
    const associationQuery = `
      SELECT *
      FROM plan_places
      WHERE plan_id = $1 AND place_id = $2;
    `;
    const associationResult = await pgPool.query(associationQuery, [plan_id, place_id]);

    if (associationResult.rows.length > 0) {
      return res.status(400).json({ error: 'Place already associated with the travel plan' });
    }

    // Associate the place_id with the plan_id in the plan_places table
    const insertQuery = `
      INSERT INTO plan_places (plan_id, place_id)
      VALUES ($1, $2);
    `;
    await pgPool.query(insertQuery, [plan_id, place_id]);

    res.send('Place associated with the travel plan successfully');
  } catch (error) {
    console.error('Error associating place with the travel plan:', error);
    res.status(500).json({ error: 'An error occurred while associating place with the travel plan' });
  }
});

router.post('/mongodb-data', express.json(), (req, res) => {
  // Specify the name of the collection
  const collectionName = 'your_collection';

  // Check if the model already exists
  const existingModel = mongoose.models[collectionName];

  // Create a new schema for each request
  const schema = new mongoose.Schema({}, { strict: false });

  const CollectionModel = existingModel || mongoose.model(collectionName, schema);

  // Create a new object with the request body
  const newData = new CollectionModel(req.body);

  newData.save()
    .then(() => res.send('Data saved successfully'))
    .catch((error) => {
      console.error('Error saving data:', error);
      res.status(500).send('Error saving data');
    });
});

module.exports = router;
