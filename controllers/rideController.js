const Ride = require('../models/Ride');

exports.createRide = async (req, res) => {
  const { pickup, destination } = req.body;
  const ride = await Ride.create({ passenger: req.user.id, pickup, destination });
  res.status(201).json(ride);
};

exports.acceptRide = async (req, res) => {
  const ride = await Ride.findByIdAndUpdate(req.params.id, { driver: req.user.id, status: 'accepted' }, { new: true });
  res.json(ride);
};

exports.getRides = async (req, res) => {
  let rides;
  if (req.user.role === 'admin') rides = await Ride.find().populate('passenger driver');
  else if (req.user.role === 'driver') rides = await Ride.find({ driver: req.user.id });
  else rides = await Ride.find({ passenger: req.user.id });

  res.json(rides);
};
