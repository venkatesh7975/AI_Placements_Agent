const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const analyzeRoutes = require('./routes/analyze');
const roadmapRoutes = require('./routes/roadmap');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Simple log middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Mount Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/analyze', require('./routes/analyze'));
app.use('/api/roadmap', require('./routes/roadmap'));
app.use('/api/admin', require('./routes/admin'));

// Base route
app.get('/', (req, res) => {
  res.json({ message: "Welcome to HireReady AI Employability Intelligence Engine API" });
});

// Configure Mongoose with robust options & quick timeouts
const PORT = process.env.PORT || 5000;
const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hireready';

console.log('Attempting connection to MongoDB database...');
mongoose.connect(DB_URI, {
  serverSelectionTimeoutMS: 4000 // Fast timeout
})
.then(() => {
  console.log('MongoDB database connected successfully.');
  app.listen(PORT, () => {
    console.log(`HireReady AI Backend server running in Production mode on port ${PORT}`);
  });
})
.catch((err) => {
  console.error('================================================================');
  console.error('WARNING: MongoDB Connection Failed!');
  console.error('The server will operate in offline mock-memory fallback storage mode.');
  console.error('Ensure MongoDB is installed and running locally for persistence.');
  console.error('================================================================');

  // Launch a memory database mockup wrapper so that endpoints don't crash
  setupMockPersistence();

  app.listen(PORT, () => {
    console.log(`HireReady AI Backend server running in RESILIENT MOCK DB mode on port ${PORT}`);
  });
});

// Mock database storage in memory if MongoDB is offline
function setupMockPersistence() {
  const mockUserDb = [];
  const mockAssessmentDb = [];
  const mockRoadmapDb = [];

  // Monkey-patch Mongoose queries for User, Assessment, and Roadmap!
  // This is a premium safety net so standard mongoose operations can run in memory
  // if MongoDB is not active on the user's system!
  
  // Note: Express controllers will use Mongoose models. If connection fails,
  // we will override model queries so they pull/push from local memory!
  
  const models = [
    require('./models/User'),
    require('./models/Assessment'),
    require('./models/Roadmap')
  ];

  models.forEach(model => {
    const db = model.modelName === 'User' ? mockUserDb : (model.modelName === 'Assessment' ? mockAssessmentDb : mockRoadmapDb);
    
    // Override standard saving
    model.prototype.save = async function() {
      const doc = this.toObject();
      if (!doc._id) doc._id = new mongoose.Types.ObjectId().toString();
      
      const idx = db.findIndex(x => x._id.toString() === doc._id.toString() || (doc.email && x.email === doc.email) || (doc.userId && x.userId?.toString() === doc.userId?.toString()));
      if (idx > -1) {
        db[idx] = { ...db[idx], ...doc };
      } else {
        db.push(doc);
      }
      return doc;
    };

    // Override model statics
    model.findOne = function(query) {
      return {
        exec: async () => findRecord(db, query),
        select: () => ({ exec: async () => findRecord(db, query) }),
        then: function(cb) { return this.exec().then(cb); }
      };
    };

    model.findById = function(id) {
      return {
        select: () => ({ exec: async () => db.find(x => x._id.toString() === id.toString()) }),
        exec: async () => db.find(x => x._id.toString() === id.toString()),
        then: function(cb) { return this.exec().then(cb); }
      };
    };

    model.deleteMany = async function(query) {
      const initialLength = db.length;
      if (query.userId) {
        const idStr = query.userId.toString();
        for (let i = db.length - 1; i >= 0; i--) {
          if (db[i].userId?.toString() === idStr) db.splice(i, 1);
        }
      }
      return { deletedCount: initialLength - db.length };
    };
  });
}

function findRecord(db, query) {
  return db.find(x => {
    for (let key in query) {
      if (query[key] instanceof RegExp) {
        if (!query[key].test(x[key])) return false;
      } else if (x[key]?.toString() !== query[key]?.toString()) {
        return false;
      }
    }
    return true;
  });
}
