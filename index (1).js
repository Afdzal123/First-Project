// index.js

const { MongoClient } = require("mongodb");
const uri = "mongodb://localhost:27017"; // MongoDB connection string
const client = new MongoClient(uri);

// === PART 1: JSON OPERATIONS ===

/* 
=======================
Task 1: Define Drivers
=======================
*/
const drivers = [
  { name: "John Doe", rating: 4.5, available: true },
  { name: "Jane Smith", rating: 4.8, available: false },
  { name: "Ali Rahman", rating: 4.6, available: true }
];

/* 
=====================================
Task 2.1: Display Drivers' Names
=====================================
*/
drivers.forEach(driver => {
  console.log("Driver Name:", driver.name);
});

/* 
=====================================
Task 2.2: Add New Driver to the Array
=====================================
*/
drivers.push({ name: "Lisa Chan", rating: 4.7, available: true });

/* 
=======================
PART 2: MONGODB CRUD
=======================
*/

async function main() {
  try {
    await client.connect();
    const db = client.db("mytaxi");
    const collection = db.collection("drivers");

    /* 
    ==============================================
    Task 3: Insert All Drivers into MongoDB
    ==============================================
    */
    await collection.deleteMany({}); // Clear old data (optional for clean run)
    await collection.insertMany(drivers);
    console.log("✅ All drivers inserted.");

    /* 
    ==============================================
    Task 4: Query Available Drivers with rating >= 4.5
    ==============================================
    */
    const highRatedDrivers = await collection.find({
      available: true,
      rating: { $gte: 4.5 }
    }).toArray();
    console.log("⭐ High-rated Available Drivers:", highRatedDrivers);

    /* 
    ==============================================
    Task 5: Update John Doe's Rating by +0.1
    ==============================================
    */
    const updateResult = await collection.updateOne(
      { name: "John Doe" },
      { $inc: { rating: 0.1 } }
    );
    console.log("🔧 Update Result:", updateResult.modifiedCount);

    // Display the updated rating for John Doe
    const updatedDriver = await collection.findOne(
      { name: "John Doe" },
      { projection: { name: 1, rating: 1, _id: 0 } }
    );
    console.log("📈 Updated John Doe's Rating:", updatedDriver);

    /* 
    ==============================================
    Task 6: Delete All Unavailable Drivers
    ==============================================
    */
    const deleteResult = await collection.deleteMany({ available: false });
    console.log("🗑️ Deleted Unavailable Drivers:", deleteResult.deletedCount);

  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await client.close();
  }
}

main();
