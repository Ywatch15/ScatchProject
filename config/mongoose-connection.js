const mongoose = require('mongoose');
const dbgr = require('debug')('development:mongoose');

// Use environment variable first. `.env` is loaded in `app.js` via dotenv.
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/scatch';

mongoose
	.connect(uri)
	.then(() => dbgr('MongoDB connected'))
	.catch((err) => console.error('MongoDB connection error:', err));

module.exports = mongoose.connection;