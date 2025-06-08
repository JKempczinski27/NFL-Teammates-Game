// filepath: /workspaces/NFL-Teammates-Game/nfl-teamates-game/backend/routes/track.js
const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  // You can log or save req.body to your database here
  console.log(req.body);
  res.sendStatus(200);
});

module.exports = router;