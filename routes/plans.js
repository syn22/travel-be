const express = require('express');
const router = express.Router();
const { pgPool } = require('../db');

router.get('/', async (req, res) => {
  const { user_id, username } = req.query;

  // Check if both user_id and username are provided
  if (user_id && username) {
    return res.status(400).json({ error: 'Please provide either user_id or username, not both' });
  }

  let query;
  let queryParams;

  if (user_id) {
    query = `
    SELECT plans.id AS plan_id, plans.name AS plan_name,
    places.id AS place_id, places.name AS place_name,
    places.longitude, places.latitude, places.type AS place_type, places.types, places.photo_url, places.opening_hours
    FROM plans
    LEFT JOIN plan_places ON plans.id = plan_places.plan_id AND plan_places.is_deleted = false
    LEFT JOIN places ON plan_places.place_id = places.id
    WHERE plans.user_id = $1 AND plans.is_deleted = false
    `;
    queryParams = [user_id];
  } else if (username) {
    query = `
    SELECT plans.id AS plan_id, plans.name AS plan_name,
    places.id AS place_id, places.name AS place_name,
    places.longitude, places.latitude, places.type AS place_type, places.types, places.photo_url, places.opening_hours
    FROM plans
    LEFT JOIN plan_places ON plans.id = plan_places.plan_id AND plan_places.is_deleted = false
    LEFT JOIN places ON plan_places.place_id = places.id
    JOIN users ON plans.user_id = users.id
    WHERE users.username = $1
    AND plans.is_deleted = false
    AND plans.public = true
    `;
    queryParams = [username];
  } else {
    return res.status(400).json({ error: 'Please provide either user_id or username' });
  }

  try {
    const result = await pgPool.query(query, queryParams);

    // Group places by plan_id
    const plans = {};
    result.rows.forEach((row) => {
      const { plan_id, plan_name, place_id, place_name, place_type, longitude, latitude, types, photo_url, opening_hours } = row;
      if (!plans[plan_id]) {
        plans[plan_id] = {
          plan_id,
          plan_name,
          places: [],
        };
      }
      plans[plan_id].places.push({ place_id, place_name, longitude, latitude, place_type, types, photo_url, opening_hours });
    });

    // Convert plans object to an array of objects
    const plansArray = Object.values(plans);

    res.json(plansArray);
  } catch (error) {
    console.error('Error retrieving plans:', error);
    res.status(500).json({ error: 'An error occurred while retrieving plans' });
  }
});
  
  router.post('/', express.json(), async (req, res) => {
    const { name, user_id, is_public } = req.body;
  
    // Validate request data
    if (!name || !user_id || !is_public) {
      return res.status(400).json({ error: 'Invalid request data' });
    }
  
    try {
      const query = `
        INSERT INTO plans (name, user_id, public)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      const values = [name, user_id, is_public];
      const result = await pgPool.query(query, values);
  
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error adding new plan:', error);
      res.status(500).json({ error: 'An error occurred while adding a new plan' });
    }
  });

  router.delete('/:plan_id/places/:place_id', async (req, res) => {
    const { plan_id, place_id } = req.params;
  
    try {
      // Check if the plan exists
      const planQuery = 'SELECT * FROM plans WHERE id = $1';
      const planResult = await pgPool.query(planQuery, [plan_id]);
  
      if (planResult.rows.length === 0) {
        return res.status(404).json({ error: 'Plan not found' });
      }
  
      // Check if the place exists
      const placeQuery = 'SELECT * FROM places WHERE id = $1';
      const placeResult = await pgPool.query(placeQuery, [place_id]);
  
      if (placeResult.rows.length === 0) {
        return res.status(404).json({ error: 'Place not found' });
      }
  
      // Update the is_deleted column in the plan_places table
      const deleteQuery = `
        UPDATE plan_places
        SET is_deleted = true
        WHERE plan_id = $1 AND place_id = $2;
      `;
      await pgPool.query(deleteQuery, [plan_id, place_id]);
  
      res.status(200).send('Place removed from the plan successfully');
    } catch (error) {
      console.error('Error removing place from plan:', error);
      res.status(500).json({ error: 'An error occurred while removing place from plan' });
    }
  });
  
  module.exports = router;