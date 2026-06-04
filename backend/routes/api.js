const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// A secret key to sign the ID badges (JWTs)
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_fallback_key_123!";

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required.' });
  }
  try {
    const token = header.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

async function getAuthedUser(req) {
  return User.findById(req.userId);
}

// 1. SECURE REGISTER
router.post('/auth/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or Username already in use.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ 
      email, 
      username, 
      password: hashedPassword 
    });
    
    await newUser.save();
    res.status(201).json({ message: 'Account created securely!' });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// 2. SECURE LOGIN
router.post('/auth/login', async (req, res) => {
  console.log("LOGIN ATTEMPT:", req.body);
  try {
    let { identifier, password } = req.body;

    identifier = typeof identifier === 'string' ? identifier.trim() : '';
    if (identifier.includes('@')) {
      identifier = identifier.toLowerCase();
    }

    if (!identifier || !password) {
      return res.status(400).json({ message: 'identifier and password are required.' });
    }
    
    const user = await User.findOne({ 
      $or: [{ email: identifier }, { username: identifier }] 
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ 
      message: 'Login successful', 
      token, 
      user: { username: user.username, email: user.email }
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// 3. SECURE GOOGLE BOOKS PROXY (WITH FALLBACK OVERRIDE)
router.get('/books/search', async (req, res) => {
  try {
    console.log(`\n--- BACKEND SEARCH TRIGGERED ---`);
    const { q } = req.query;

    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&key=${apiKey}`;
    const response = await fetch(googleUrl);
    const data = await response.json();
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Proxy Search Error:", error);
    res.status(500).json({ message: 'Error processing book search on server' });
  }
});

// 4. SAVE A BOOK (Upgraded for God-Level Schema)
router.post('/books/save', async (req, res) => {
  try {
    const { username, book } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const alreadySaved = user.shelf.some(b => b.bookId === book.bookId);
    if (alreadySaved) {
      return res.status(400).json({ message: 'Book is already on your shelf!' });
    }

    user.shelf.push({
      bookId: book.bookId,
      title: book.title,
      authors: book.authors,
      coverUrl: book.coverUrl,
      status: 'read_later' 
    });

    await user.save();
    res.status(200).json({ message: 'Book saved to shelf!' });
  } catch (error) {
    console.error("Save Error:", error);
    res.status(500).json({ message: 'Error saving book' });
  }
});

// 5. GET USER'S DETAILED SHELF
router.get('/books/list/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Return the entire array of book objects, not just IDs
    res.status(200).json(user.shelf);
  } catch (error) {
    console.error("Fetch Shelf Error:", error);
    res.status(500).json({ message: 'Error fetching shelf' });
  }
});

// 6. GOOGLE VOLUME DETAIL (proxy)
router.get('/books/volume/:volumeId', async (req, res) => {
  try {
    const { volumeId } = req.params;
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY || "AIzaSyCsKP58yHC1V0sDFc8BKGKUfMBlcAVe_7I";
    const googleUrl = `https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(volumeId)}?key=${apiKey}`;
    const response = await fetch(googleUrl);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Volume Detail Error:", error);
    res.status(500).json({ message: 'Error fetching book details' });
  }
});

// 7. GET authenticated user's library (God-Level Schema)
router.get('/books', authMiddleware, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user.shelf);
  } catch (error) {
    console.error("GET /books Error:", error);
    res.status(500).json({ message: 'Error fetching library' });
  }
});

// 8. POST save or upsert book (God-Level Schema)
router.post('/books', authMiddleware, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { book } = req.body;
    if (!book?.bookId || !book?.title) {
      return res.status(400).json({ message: 'book.bookId and book.title are required.' });
    }

    const idx = user.shelf.findIndex((b) => b.bookId === book.bookId);
    const shelfEntry = {
      bookId: book.bookId,
      title: book.title,
      authors: book.authors || [],
      coverUrl: book.coverUrl || '',
      publisher: book.publisher || '',
      publishedDate: book.publishedDate || '',
      totalPages: book.totalPages || 0,
      status: book.status || 'read_later',
      userRating: book.userRating ?? 0,
      tags: book.tags || [],
      dateStarted: book.dateStarted || undefined,
      dateFinished: book.status === 'finished' ? (book.dateFinished || new Date()) : book.dateFinished,
      dateModified: new Date(),
    };

    if (idx >= 0) {
      const existing = user.shelf[idx].toObject();
      user.shelf[idx] = { ...existing, ...shelfEntry };
      await user.save();
      return res.status(200).json({ message: 'Book updated in library!', book: user.shelf[idx] });
    }

    user.shelf.push({ ...shelfEntry, dateAdded: new Date() });
    await user.save();
    res.status(201).json({ message: 'Book saved to library!', book: user.shelf[user.shelf.length - 1] });
  } catch (error) {
    console.error("POST /books Error:", error);
    res.status(500).json({ message: 'Error saving book' });
  }
});

// 9b. POST log reading progress for a shelf book
router.post('/books/:bookId/progress', authMiddleware, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const pagesRead = Number(req.body.pagesRead);
    if (!pagesRead || pagesRead < 1) {
      return res.status(400).json({ message: 'pagesRead must be a positive number.' });
    }

    const { bookId } = req.params;
    const idx = user.shelf.findIndex((b) => b.bookId === bookId);
    if (idx < 0) {
      return res.status(404).json({ message: 'Book not found in library.' });
    }

    const entry = user.shelf[idx];
    const totalPages = entry.totalPages || 0;
    const nextPage = (entry.currentPage || 0) + pagesRead;
    entry.currentPage = totalPages > 0 ? Math.min(nextPage, totalPages) : nextPage;
    entry.readingLog = entry.readingLog || [];
    entry.readingLog.push({
      pagesRead,
      date: new Date(),
      note: req.body.note || '',
    });
    entry.dateModified = new Date();

    if (totalPages > 0 && entry.currentPage >= totalPages) {
      entry.status = 'finished';
      entry.dateFinished = new Date();
    }

    await user.save();
    res.status(200).json({
      message: 'Progress logged!',
      book: user.shelf[idx],
    });
  } catch (error) {
    console.error('POST /books/:bookId/progress Error:', error);
    res.status(500).json({ message: 'Error logging progress' });
  }
});

// 9. PUT update existing book by bookId
router.put('/books/:bookId', authMiddleware, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { bookId } = req.params;
    const { book } = req.body;
    const idx = user.shelf.findIndex((b) => b.bookId === bookId);

    if (idx < 0) {
      return res.status(404).json({ message: 'Book not found in library.' });
    }

    const existing = user.shelf[idx].toObject();
    user.shelf[idx] = {
      ...existing,
      ...book,
      bookId,
      dateModified: new Date(),
    };

    await user.save();
    res.status(200).json({ message: 'Book updated!', book: user.shelf[idx] });
  } catch (error) {
    console.error("PUT /books Error:", error);
    res.status(500).json({ message: 'Error updating book' });
  }
});

// 10. DELETE multiple books
router.delete('/books/batch', authMiddleware, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { bookIds } = req.body;
    if (!Array.isArray(bookIds) || bookIds.length === 0) {
      return res.status(400).json({ message: 'bookIds array is required.' });
    }

    const idSet = new Set(bookIds);
    user.shelf = user.shelf.filter((b) => !idSet.has(b.bookId));
    await user.save();
    res.status(200).json({ message: `${bookIds.length} book(s) removed.` });
  } catch (error) {
    console.error('DELETE /books/batch Error:', error);
    res.status(500).json({ message: 'Error deleting books' });
  }
});

// 11. PATCH batch update (e.g. move status)
router.patch('/books/batch', authMiddleware, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { bookIds, updates } = req.body;
    if (!Array.isArray(bookIds) || bookIds.length === 0) {
      return res.status(400).json({ message: 'bookIds array is required.' });
    }

    const idSet = new Set(bookIds);
    let changed = 0;
    user.shelf.forEach((entry, idx) => {
      if (!idSet.has(entry.bookId)) return;
      const merged = { ...entry.toObject(), ...updates, dateModified: new Date() };
      if (updates?.status === 'finished' && !merged.dateFinished) {
        merged.dateFinished = new Date();
      }
      user.shelf[idx] = merged;
      changed += 1;
    });

    await user.save();
    res.status(200).json({ message: `${changed} book(s) updated.`, shelf: user.shelf });
  } catch (error) {
    console.error('PATCH /books/batch Error:', error);
    res.status(500).json({ message: 'Error updating books' });
  }
});

module.exports = router;