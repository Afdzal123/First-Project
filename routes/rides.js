const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { createRide, acceptRide, getRides } = require('../controllers/rideController');

router.post('/', auth, createRide);              // passenger books ride
router.put('/:id/accept', auth, acceptRide);     // driver accepts
router.get('/', auth, getRides);                 // all rides (admin) or user's rides

module.exports = router;
