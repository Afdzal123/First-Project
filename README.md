# Week 2: JSON Fundamentals & MongoDB CRUD (Node.js)

## 📚 Objective
This lab focuses on learning how to:
- Use JSON to define and manipulate driver data
- Perform MongoDB CRUD operations using Node.js
- Query, update, and delete records in a MongoDB collection
- Validate results via MongoDB Compass

---

## 📁 Folder Structure
```
index.js             # Main file with all CRUD operations
screenshots/         # Compass screenshots for each task
README.md            # This file
```

---

## ✅ Tasks Completed

### Task 1 & 2: JSON Operations
- Defined an array of drivers with `name`, `rating`, and `available`
- Displayed names using `forEach`
- Added a new driver (`Lisa Chan`) using `.push()`

### Task 3: Insert into MongoDB
- Used `insertMany()` to insert all driver objects
- Verified in MongoDB Compass

### Task 4: Query Drivers
- Queried for drivers with:
```json
{ "available": true, "rating": { "$gte": 4.5 } }
```

### Task 5: Update Driver
- Used `updateOne()` and `$inc` to increase `John Doe`'s rating by `0.1`
- Fetched updated value with `findOne()`

### Task 6: Delete Unavailable Drivers
- Removed all drivers with `available: false` using `deleteMany()`

---

## 🧪 Sample Output (Console)
```
Driver Name: John Doe
Driver Name: Jane Smith
Driver Name: Ali Rahman
Driver Name: Lisa Chan
✅ Drivers inserted.
⭐ High-rated Drivers: [...]
📈 Updated John Doe: { name: "John Doe", rating: 4.6 }
🗑️ Deleted Unavailable Drivers: 1
```

---

## 🖼️ Screenshots (Compass)
- [ ] Inserted Data
- [ ] Query Result (rating ≥ 4.5)
- [ ] Updated Rating
- [ ] After Deletion

---

## 🧠 Key Learnings
- JSON is essential for representing structured data in Node.js
- MongoDB provides flexible methods for document-based operations
- MongoDB Compass is a powerful GUI for visual validation

---

## ✍️ Author
Azrel  
BERR2243 – Database and Cloud Systems
