const mongoose = require('mongoose');

// Blueprint for the "Reading Log History" feature
const ReadingSessionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  pagesRead: { type: Number, required: true },
  note: { type: String } 
});

// Blueprint for a Single Book on your Shelf
const ShelfBookSchema = new mongoose.Schema({
  // Core Metadata (Supports Search & Manual Entry)
  bookId: { type: String }, 
  isbn: { type: String }, 
  title: { type: String, required: true },
  authors: [{ type: String }],
  coverUrl: { type: String },
  publisher: { type: String },
  publishedDate: { type: String },
  totalPages: { type: Number, default: 0 },
  format: { 
    type: String, 
    enum: ['physical', 'ebook', 'audiobook'], 
    default: 'physical' 
  },

  // Library Management (Status & Tags)
  status: { 
    type: String, 
    enum: ['read_later', 'currently_reading', 'finished', 'dnf'], 
    default: 'read_later' 
  },
  tags: [{ type: String }], 

  // Telemetry & Progress
  currentPage: { type: Number, default: 0 },
  readingLog: [ReadingSessionSchema], 
  dateStarted: { type: Date },
  dateFinished: { type: Date },

  // Reviews & Ratings
  userRating: { type: Number, min: 0, max: 5, default: 0 }, 
  review: { type: String, default: '' },
  privateNotes: { type: String, default: '' },
  
  // Sorting Data
  dateAdded: { type: Date, default: Date.now },
  dateModified: { type: Date, default: Date.now }
});

// Blueprint for the User (Enterprise Security)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true }, 
  
  shelf: [ShelfBookSchema] 
}, { timestamps: true });

// Auto-update 'dateModified' whenever a book is changed
ShelfBookSchema.pre('save', function(next) {
  this.dateModified = Date.now();
  next();
});

module.exports = mongoose.model('User', UserSchema);