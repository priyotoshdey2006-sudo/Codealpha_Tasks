const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());


// ===============================
// HOME
// ===============================

app.get("/", (req, res) => {
    res.json({
        message: "CodeAlpha Event Registration API is running!",
        version: "1.0.0"
    });
});


// ===============================
// GET ALL EVENTS
// ===============================

app.get("/events", (req, res) => {

    const sql = `
        SELECT 
            e.*,
            COUNT(r.id) AS registered_count
        FROM events e
        LEFT JOIN registrations r
            ON e.id = r.event_id
        GROUP BY e.id
        ORDER BY e.date ASC
    `;

    db.all(sql, [], (err, rows) => {

        if (err) {
            console.error(err.message);

            return res.status(500).json({
                error: "Failed to fetch events"
            });
        }

        res.json({
            count: rows.length,
            events: rows
        });
    });
});


// ===============================
// GET SINGLE EVENT
// ===============================

app.get("/events/:id", (req, res) => {

    const eventId = req.params.id;

    const sql = `
        SELECT 
            e.*,
            COUNT(r.id) AS registered_count
        FROM events e
        LEFT JOIN registrations r
            ON e.id = r.event_id
        WHERE e.id = ?
        GROUP BY e.id
    `;

    db.get(sql, [eventId], (err, event) => {

        if (err) {
            console.error(err.message);

            return res.status(500).json({
                error: "Failed to fetch event"
            });
        }

        if (!event) {
            return res.status(404).json({
                error: "Event not found"
            });
        }

        res.json(event);
    });
});


// ===============================
// CREATE EVENT
// ===============================

app.post("/events", (req, res) => {

    const {
        title,
        description,
        date,
        time,
        location,
        capacity
    } = req.body;

    if (!title || !date || !time || !location || !capacity) {
        return res.status(400).json({
            error: "Title, date, time, location and capacity are required"
        });
    }

    if (capacity <= 0) {
        return res.status(400).json({
            error: "Capacity must be greater than 0"
        });
    }

    const sql = `
        INSERT INTO events
        (title, description, date, time, location, capacity)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
            title,
            description || "",
            date,
            time,
            location,
            capacity
        ],
        function (err) {

            if (err) {
                console.error(err.message);

                return res.status(500).json({
                    error: "Failed to create event"
                });
            }

            res.status(201).json({
                message: "Event created successfully",
                event_id: this.lastID
            });
        }
    );
});


// ===============================
// UPDATE EVENT
// ===============================

app.put("/events/:id", (req, res) => {

    const eventId = req.params.id;

    const {
        title,
        description,
        date,
        time,
        location,
        capacity
    } = req.body;

    if (!title || !date || !time || !location || !capacity) {
        return res.status(400).json({
            error: "Title, date, time, location and capacity are required"
        });
    }

    const sql = `
        UPDATE events
        SET
            title = ?,
            description = ?,
            date = ?,
            time = ?,
            location = ?,
            capacity = ?
        WHERE id = ?
    `;

    db.run(
        sql,
        [
            title,
            description || "",
            date,
            time,
            location,
            capacity,
            eventId
        ],
        function (err) {

            if (err) {
                console.error(err.message);

                return res.status(500).json({
                    error: "Failed to update event"
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    error: "Event not found"
                });
            }

            res.json({
                message: "Event updated successfully"
            });
        }
    );
});


// ===============================
// DELETE EVENT
// ===============================

app.delete("/events/:id", (req, res) => {

    const eventId = req.params.id;

    const sql = `
        DELETE FROM events
        WHERE id = ?
    `;

    db.run(sql, [eventId], function (err) {

        if (err) {
            console.error(err.message);

            return res.status(500).json({
                error: "Failed to delete event"
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                error: "Event not found"
            });
        }

        res.json({
            message: "Event deleted successfully"
        });
    });
});


// ===============================
// REGISTER FOR EVENT
// ===============================

app.post("/events/:id/register", (req, res) => {

    const eventId = req.params.id;

    const {
        name,
        email,
        phone
    } = req.body;

    if (!name || !email) {
        return res.status(400).json({
            error: "Name and email are required"
        });
    }

    // First check event
    const eventSql = `
        SELECT
            e.id,
            e.title,
            e.capacity,
            COUNT(r.id) AS registered_count
        FROM events e
        LEFT JOIN registrations r
            ON e.id = r.event_id
        WHERE e.id = ?
        GROUP BY e.id
    `;

    db.get(eventSql, [eventId], (err, event) => {

        if (err) {
            console.error(err.message);

            return res.status(500).json({
                error: "Database error"
            });
        }

        if (!event) {
            return res.status(404).json({
                error: "Event not found"
            });
        }

        // Check capacity
        if (event.registered_count >= event.capacity) {
            return res.status(400).json({
                error: "Event registration is full"
            });
        }

        // Check duplicate registration
        const duplicateSql = `
            SELECT id
            FROM registrations
            WHERE event_id = ?
            AND email = ?
        `;

        db.get(
            duplicateSql,
            [eventId, email],
            (err, existingRegistration) => {

                if (err) {
                    console.error(err.message);

                    return res.status(500).json({
                        error: "Database error"
                    });
                }

                if (existingRegistration) {
                    return res.status(409).json({
                        error: "This email is already registered for this event"
                    });
                }

                // Create registration
                const registerSql = `
                    INSERT INTO registrations
                    (event_id, name, email, phone)
                    VALUES (?, ?, ?, ?)
                `;

                db.run(
                    registerSql,
                    [
                        eventId,
                        name,
                        email,
                        phone || ""
                    ],
                    function (err) {

                        if (err) {
                            console.error(err.message);

                            return res.status(500).json({
                                error: "Registration failed"
                            });
                        }

                        res.status(201).json({
                            message: "Registration successful",
                            registration_id: this.lastID,
                            event: event.title,
                            participant: name
                        });
                    }
                );
            }
        );
    });
});


// ===============================
// VIEW EVENT REGISTRATIONS
// ===============================

app.get("/events/:id/registrations", (req, res) => {

    const eventId = req.params.id;

    const sql = `
        SELECT
            r.id,
            r.name,
            r.email,
            r.phone,
            r.registered_at
        FROM registrations r
        WHERE r.event_id = ?
        ORDER BY r.registered_at DESC
    `;

    db.all(sql, [eventId], (err, rows) => {

        if (err) {
            console.error(err.message);

            return res.status(500).json({
                error: "Failed to fetch registrations"
            });
        }

        res.json({
            event_id: Number(eventId),
            total_registrations: rows.length,
            registrations: rows
        });
    });
});


// ===============================
// CANCEL REGISTRATION
// ===============================

app.delete("/registrations/:id", (req, res) => {

    const registrationId = req.params.id;

    const sql = `
        DELETE FROM registrations
        WHERE id = ?
    `;

    db.run(sql, [registrationId], function (err) {

        if (err) {
            console.error(err.message);

            return res.status(500).json({
                error: "Failed to cancel registration"
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                error: "Registration not found"
            });
        }

        res.json({
            message: "Registration cancelled successfully"
        });
    });
});


// ===============================
// 404 ROUTE
// ===============================

app.use((req, res) => {

    res.status(404).json({
        error: "API endpoint not found"
    });
});


// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {

    console.log(`
========================================
 CodeAlpha Event Registration System
========================================
 Server: http://localhost:${PORT}
 Status: Running
========================================
    `);
});