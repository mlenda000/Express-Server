const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;
require('dotenv').config();
const API_KEY = process.env.API_KEY;


// Authentication that requires the API_KEY in order to authenticate
const authenticate = (req, res, next) => {
const key = req.headers['x-api-key'];
if (key && key === API_KEY) {
    next(); // Authorized
} else {
    res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
}
};

//Rate limiter on how many times you can hit the server 
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
windowMs: 15 * 60 * 1000, // 15 minutes
max: 100, // limit each IP to 100 requests per windowMs
message: 'Too many requests, please try again later.',
});

app.use(limiter); // Apply to all routes


// Serve static files from each route
app.use('/music', limiter, authenticate, express.static(path.join(__dirname, 'music')));
app.use('/tv', limiter, authenticate, express.static(path.join(__dirname, 'tv')));
app.use('/movies', limiter, authenticate, express.static(path.join(__dirname, 'movies')));
app.use('/files', limiter, authenticate, express.static(path.join(__dirname, 'files')));

// Optional: root route
app.get('/', (req, res) => {
res.send('Welcome to the Flutter File Server!');
});

// Sets types of files that can be streamed
const mime = require('mime-types');
const contentType = mime.lookup(filePath) || 'application/octet-stream';


// Streaming routes for the files
const fs = require('fs');

app.get('/stream/:type/:filename', authenticate, (req, res) => {
  const { type, filename } = req.params;
  const folder = path.join(__dirname, type); // e.g., music, tv, movies
  const filePath = path.join(folder, filename);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      return res.status(404).send('File not found');
    }

    const range = req.headers.range;
    if (!range) {
      return res.status(416).send('Range header required');
    }

    const fileSize = stats.size;
    const CHUNK_SIZE = 10 ** 6; // 1MB
    const start = Number(range.replace(/\D/g, ''));
    const end = Math.min(start + CHUNK_SIZE, fileSize - 1);

    const contentLength = end - start + 1;
    const stream = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': contentLength,
        'Content-Type': contentType,
      });

    stream.pipe(res);
  });
});


app.listen(PORT, () => {
console.log(`Server running at http://localhost:${PORT}`);
});

