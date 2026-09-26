const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
    res.send("CodeAlpha URL Shortener API is running!");
});

// Create short URL
app.post("/shorten", (req, res) => {
    const { original_url } = req.body;

    if (!original_url) {
        return res.status(400).json({
            error: "Original URL is required"
        });
    }

    const short_code = Math.random()
        .toString(36)
        .substring(2, 8);

    const sql = `
        INSERT INTO urls (short_code, original_url)
        VALUES (?, ?)
    `;

    db.run(sql, [short_code, original_url], function (err) {
        if (err) {
            console.error(err.message);

            return res.status(500).json({
                error: "Failed to create short URL"
            });
        }

        res.json({
            message: "URL shortened successfully",
            original_url: original_url,
            short_code: short_code,
            short_url: `http://localhost:${PORT}/${short_code}`
        });
    });
});

// Redirect short URL
app.get("/:short_code", (req, res) => {
    const { short_code } = req.params;

    const sql = `
        SELECT original_url
        FROM urls
        WHERE short_code = ?
    `;

    db.get(sql, [short_code], (err, row) => {
        if (err) {
            console.error(err.message);

            return res.status(500).json({
                error: "Database error"
            });
        }

        if (!row) {
            return res.status(404).json({
                error: "Short URL not found"
            });
        }

        res.redirect(row.original_url);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});