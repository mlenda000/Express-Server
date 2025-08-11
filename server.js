"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const path = require("path");
const helmet = require("helmet");
const { check, validationResult } = require("express-validator");
const dotenv = require("dotenv");
const env = require("env-var");
const fs = require("fs");
const mime = require("mime-types");
const rateLimit = require("express-rate-limit");
dotenv.config();
const app = express();
const API_KEY = env.get("API_KEY").required().asString();
const PORT = env.get("PORT").default(3000).asInt();
// Helmet for security headers
app.use(helmet());
// Rate limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests, please try again later.",
});
app.use(limiter);
// Authentication middleware
const authenticate = (req, res, next) => {
    const key = req.headers["x-api-key"];
    if (key && key === API_KEY) {
        next();
    }
    else {
        res.status(401).json({ error: "Unauthorized: Invalid or missing API key" });
    }
};
// Streaming route
app.get("/stream/:type/:filename", [
    check("type").isAlphanumeric(),
    check("filename").isString().trim().escape(),
], authenticate, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { type, filename } = req.params;
    const folder = path.join(__dirname, type);
    const resolvedPath = path.resolve(folder, filename);
    if (!resolvedPath.startsWith(folder)) {
        return res.status(403).send("Forbidden");
    }
    fs.stat(resolvedPath, (err, stats) => {
        if (err || !stats.isFile()) {
            return res.status(404).send("File not found");
        }
        const range = req.headers.range;
        if (!range) {
            return res.status(416).send("Range header required");
        }
        const fileSize = stats.size;
        const CHUNK_SIZE = 10 ** 6;
        const start = Number(range.replace(/\D/g, ""));
        const end = Math.min(start + CHUNK_SIZE, fileSize - 1);
        const contentLength = end - start + 1;
        const contentType = mime.lookup(resolvedPath) || "application/octet-stream";
        const stream = fs.createReadStream(resolvedPath, { start, end });
        res.writeHead(206, {
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": contentLength,
            "Content-Type": contentType,
        });
        stream.pipe(res);
    });
});
// Static file options
const staticOptions = {
    maxAge: "1d",
    etag: false,
};
// Static file routes
app.use("/music", limiter, authenticate, express.static(path.join(__dirname, "music"), staticOptions));
app.use("/tv", limiter, authenticate, express.static(path.join(__dirname, "tv"), staticOptions));
app.use("/movies", limiter, authenticate, express.static(path.join(__dirname, "movies"), staticOptions));
app.use("/files", limiter, authenticate, express.static(path.join(__dirname, "files"), staticOptions));
// Root route
app.get("/", (req, res) => {
    res.send("Welcome to the Flutter File Server!");
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal Server Error" });
});
// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map