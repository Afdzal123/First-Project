require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
let db;

async function connectToMongoDB() {
  try {
    await client.connect();
    db = client.db("mydatabase");
    console.log("✅ Connected to MongoDB!");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}
connectToMongoDB();

// ========================== AUTH MIDDLEWARE ==========================

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const authorize = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

// Root route
app.get('/', (req, res) => {
  res.send('🚀 Ride-Hailing API is running!');
});

// ========================== USERS ==========================

app.post('/users', async (req, res) => {
  try {
    const { name, contact, role, email, password } = req.body;
    if (!name || !contact || !role || !email || !password) {
      return res.status(400).json({ error: "Missing required user fields" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.collection('users').insertOne({
      name,
      contact,
      role,
      email,
      password: hashedPassword,
      isBlocked: false,
      createdAt: new Date()
    });
    res.status(201).json({ message: "User created", id: result.insertedId });
  } catch (err) {
    res.status(400).json({ error: "Invalid user data", details: err.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.collection('users').findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.status(200).json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ error: "Login failed", details: err.message });
  }
});

app.get('/users', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const users = await db.collection('users').find().toArray();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ========================== RIDES ==========================

app.post('/rides/request', authenticate, authorize(['passenger']), async (req, res) => {
  try {
    const { passengerId, pickup, destination } = req.body;
    if (!passengerId || !pickup || !destination) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const result = await db.collection('rides').insertOne({
      passengerId: new ObjectId(passengerId),
      pickup,
      destination,
      status: "pending",
      acceptedBy: null,
      createdAt: new Date()
    });
    res.status(201).json({ message: "Ride requested", id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: "Failed to request ride", details: err.message });
  }
});

app.patch('/rides/:id/accept', authenticate, authorize(['driver']), async (req, res) => {
  try {
    const rideId = req.params.id;
    const { driverId } = req.body;
    const driver = await db.collection('users').findOne({ _id: new ObjectId(driverId), role: "driver" });
    if (!driver || driver.isBlocked) {
      return res.status(403).json({ error: "Driver cannot accept rides" });
    }
    const result = await db.collection('rides').updateOne(
      { _id: new ObjectId(rideId), status: "pending" },
      {
        $set: {
          status: "accepted",
          acceptedBy: new ObjectId(driverId),
          acceptedAt: new Date()
        }
      }
    );
    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Ride not found or already accepted" });
    }
    res.status(200).json({ message: "Ride accepted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to accept ride", details: err.message });
  }
});

app.patch('/rides/:id/complete', authenticate, async (req, res) => {
  try {
    const rideId = req.params.id;
    const result = await db.collection('rides').updateOne(
      { _id: new ObjectId(rideId), status: "accepted" },
      { $set: { status: "completed", completedAt: new Date() } }
    );
    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Ride not found or not in accepted state" });
    }
    res.status(200).json({ message: "Ride marked as completed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to complete ride", details: err.message });
  }
});

app.get('/rides', authenticate, async (req, res) => {
  try {
    const rides = await db.collection('rides').aggregate([
      {
        $lookup: {
          from: "users",
          localField: "passengerId",
          foreignField: "_id",
          as: "passenger"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "acceptedBy",
          foreignField: "_id",
          as: "driver"
        }
      },
      {
        $addFields: {
          passengerName: { $arrayElemAt: ["$passenger.name", 0] },
          driverName: { $arrayElemAt: ["$driver.name", 0] }
        }
      },
      {
        $project: {
          passenger: 0,
          driver: 0
        }
      }
    ]).toArray();
    res.status(200).json(rides);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch rides", details: err.message });
  }
});

// ========================== ADMIN ==========================

app.get('/admin/analytics', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const analytics = await db.collection('rides').aggregate([
      { $match: { status: "completed", acceptedBy: { $ne: null } } },
      {
        $group: {
          _id: "$acceptedBy",
          totalCompletedRides: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "driver"
        }
      },
      {
        $addFields: {
          driverName: { $arrayElemAt: ["$driver.name", 0] },
          driverContact: { $arrayElemAt: ["$driver.contact", 0] },
          isBlocked: { $arrayElemAt: ["$driver.isBlocked", 0] }
        }
      },
      {
        $project: {
          driver: 0
        }
      }
    ]).toArray();
    res.status(200).json(analytics);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate analytics", details: err.message });
  }
});

app.patch('/admin/users/:id/block', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const userId = req.params.id;
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { isBlocked: true } }
    );
    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "User not found or already blocked" });
    }
    res.status(200).json({ message: "User has been blocked" });
  } catch (err) {
    res.status(500).json({ error: "Failed to block user", details: err.message });
  }
});

// ========================== SERVER START ==========================

app.listen(port, () => {
  console.log(`🚗 Server is running at http://localhost:${port}`);
});
