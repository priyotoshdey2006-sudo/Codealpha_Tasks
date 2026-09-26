const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());


// ===============================
// HOME
// ===============================

app.get("/", (req, res) => {
    res.json({
        message: "CodeAlpha Restaurant Management API is running!",
        version: "1.0.0"
    });
});


// ===============================
// MENU APIs
// ===============================

// Get all menu items
app.get("/menu", (req, res) => {

    db.all("SELECT * FROM menu ORDER BY id DESC", [], (err, rows) => {

        if (err) {
            return res.status(500).json({
                error: "Failed to fetch menu"
            });
        }

        res.json(rows);
    });
});


// Add menu item
app.post("/menu", (req, res) => {

    const {
        name,
        description,
        category,
        price
    } = req.body;

    if (!name || !category || price === undefined) {
        return res.status(400).json({
            error: "Name, category and price are required"
        });
    }

    if (Number(price) <= 0) {
        return res.status(400).json({
            error: "Price must be greater than 0"
        });
    }

    const sql = `
        INSERT INTO menu
        (name, description, category, price)
        VALUES (?, ?, ?, ?)
    `;

    db.run(
        sql,
        [name, description || "", category, Number(price)],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: "Failed to add menu item"
                });
            }

            res.status(201).json({
                message: "Menu item added successfully",
                id: this.lastID
            });
        }
    );
});


// Update menu item
app.put("/menu/:id", (req, res) => {

    const { id } = req.params;

    const {
        name,
        description,
        category,
        price,
        available
    } = req.body;

    const sql = `
        UPDATE menu
        SET name = ?,
            description = ?,
            category = ?,
            price = ?,
            available = ?
        WHERE id = ?
    `;

    db.run(
        sql,
        [
            name,
            description || "",
            category,
            Number(price),
            available === undefined ? 1 : available,
            id
        ],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: "Failed to update menu item"
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    error: "Menu item not found"
                });
            }

            res.json({
                message: "Menu item updated successfully"
            });
        }
    );
});


// Delete menu item
app.delete("/menu/:id", (req, res) => {

    db.run(
        "DELETE FROM menu WHERE id = ?",
        [req.params.id],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: "Failed to delete menu item"
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    error: "Menu item not found"
                });
            }

            res.json({
                message: "Menu item deleted successfully"
            });
        }
    );
});


// ===============================
// TABLE APIs
// ===============================

// Get all tables
app.get("/tables", (req, res) => {

    db.all(
        "SELECT * FROM restaurant_tables ORDER BY table_number",
        [],
        (err, rows) => {

            if (err) {
                return res.status(500).json({
                    error: "Failed to fetch tables"
                });
            }

            res.json(rows);
        }
    );
});


// Add restaurant table
app.post("/tables", (req, res) => {

    const {
        table_number,
        capacity
    } = req.body;

    if (!table_number || !capacity) {
        return res.status(400).json({
            error: "Table number and capacity are required"
        });
    }

    const sql = `
        INSERT INTO restaurant_tables
        (table_number, capacity)
        VALUES (?, ?)
    `;

    db.run(
        sql,
        [table_number, capacity],
        function (err) {

            if (err) {
                return res.status(400).json({
                    error: "Table number already exists or invalid data"
                });
            }

            res.status(201).json({
                message: "Restaurant table added successfully",
                id: this.lastID
            });
        }
    );
});


// Update table status
app.put("/tables/:id/status", (req, res) => {

    const { status } = req.body;

    const validStatuses = [
        "available",
        "occupied",
        "reserved"
    ];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            error: "Invalid table status"
        });
    }

    db.run(
        "UPDATE restaurant_tables SET status = ? WHERE id = ?",
        [status, req.params.id],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: "Failed to update table status"
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    error: "Table not found"
                });
            }

            res.json({
                message: "Table status updated successfully"
            });
        }
    );
});


// ===============================
// RESERVATION APIs
// ===============================

// Get reservations
app.get("/reservations", (req, res) => {

    const sql = `
        SELECT
            reservations.*,
            restaurant_tables.table_number
        FROM reservations
        JOIN restaurant_tables
        ON reservations.table_id = restaurant_tables.id
        ORDER BY reservation_date, reservation_time
    `;

    db.all(sql, [], (err, rows) => {

        if (err) {
            return res.status(500).json({
                error: "Failed to fetch reservations"
            });
        }

        res.json(rows);
    });
});


// Create reservation
app.post("/reservations", (req, res) => {

    const {
        table_id,
        customer_name,
        phone,
        reservation_date,
        reservation_time,
        guests
    } = req.body;

    if (
        !table_id ||
        !customer_name ||
        !phone ||
        !reservation_date ||
        !reservation_time ||
        !guests
    ) {
        return res.status(400).json({
            error: "All reservation fields are required"
        });
    }

    db.get(
        "SELECT * FROM restaurant_tables WHERE id = ?",
        [table_id],
        (err, table) => {

            if (err) {
                return res.status(500).json({
                    error: "Database error"
                });
            }

            if (!table) {
                return res.status(404).json({
                    error: "Table not found"
                });
            }

            if (guests > table.capacity) {
                return res.status(400).json({
                    error: "Number of guests exceeds table capacity"
                });
            }

            const sql = `
                INSERT INTO reservations
                (
                    table_id,
                    customer_name,
                    phone,
                    reservation_date,
                    reservation_time,
                    guests
                )
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            db.run(
                sql,
                [
                    table_id,
                    customer_name,
                    phone,
                    reservation_date,
                    reservation_time,
                    guests
                ],
                function (err) {

                    if (err) {
                        return res.status(500).json({
                            error: "Failed to create reservation"
                        });
                    }

                    db.run(
                        "UPDATE restaurant_tables SET status = 'reserved' WHERE id = ?",
                        [table_id]
                    );

                    res.status(201).json({
                        message: "Reservation created successfully",
                        reservation_id: this.lastID
                    });
                }
            );
        }
    );
});


// Cancel reservation
app.delete("/reservations/:id", (req, res) => {

    db.get(
        "SELECT table_id FROM reservations WHERE id = ?",
        [req.params.id],
        (err, reservation) => {

            if (err) {
                return res.status(500).json({
                    error: "Database error"
                });
            }

            if (!reservation) {
                return res.status(404).json({
                    error: "Reservation not found"
                });
            }

            db.run(
                "DELETE FROM reservations WHERE id = ?",
                [req.params.id],
                function (err) {

                    if (err) {
                        return res.status(500).json({
                            error: "Failed to cancel reservation"
                        });
                    }

                    db.run(
                        "UPDATE restaurant_tables SET status = 'available' WHERE id = ?",
                        [reservation.table_id]
                    );

                    res.json({
                        message: "Reservation cancelled successfully"
                    });
                }
            );
        }
    );
});


// ===============================
// INVENTORY APIs
// ===============================

// Get inventory
app.get("/inventory", (req, res) => {

    db.all(
        "SELECT * FROM inventory ORDER BY item_name",
        [],
        (err, rows) => {

            if (err) {
                return res.status(500).json({
                    error: "Failed to fetch inventory"
                });
            }

            res.json(rows);
        }
    );
});


// Add inventory item
app.post("/inventory", (req, res) => {

    const {
        item_name,
        quantity,
        unit,
        minimum_quantity
    } = req.body;

    if (
        !item_name ||
        quantity === undefined ||
        !unit
    ) {
        return res.status(400).json({
            error: "Item name, quantity and unit are required"
        });
    }

    const sql = `
        INSERT INTO inventory
        (
            item_name,
            quantity,
            unit,
            minimum_quantity
        )
        VALUES (?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
            item_name,
            Number(quantity),
            unit,
            Number(minimum_quantity || 0)
        ],
        function (err) {

            if (err) {
                return res.status(400).json({
                    error: "Inventory item already exists"
                });
            }

            res.status(201).json({
                message: "Inventory item added successfully",
                id: this.lastID
            });
        }
    );
});


// Update inventory
app.put("/inventory/:id", (req, res) => {

    const {
        quantity,
        minimum_quantity
    } = req.body;

    const sql = `
        UPDATE inventory
        SET quantity = ?,
            minimum_quantity = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;

    db.run(
        sql,
        [
            Number(quantity),
            Number(minimum_quantity || 0),
            req.params.id
        ],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: "Failed to update inventory"
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    error: "Inventory item not found"
                });
            }

            res.json({
                message: "Inventory updated successfully"
            });
        }
    );
});


// ===============================
// ORDERS APIs
// ===============================

// Get all orders
app.get("/orders", (req, res) => {

    const sql = `
        SELECT
            orders.*,
            restaurant_tables.table_number
        FROM orders
        LEFT JOIN restaurant_tables
        ON orders.table_id = restaurant_tables.id
        ORDER BY orders.id DESC
    `;

    db.all(sql, [], (err, rows) => {

        if (err) {
            return res.status(500).json({
                error: "Failed to fetch orders"
            });
        }

        res.json(rows);
    });
});


// Create order
app.post("/orders", (req, res) => {

    const {
        table_id,
        customer_name,
        items
    } = req.body;

    if (!customer_name || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            error: "Customer name and order items are required"
        });
    }

    const placeholders = items.map(() => "?").join(",");

    const sql = `
        SELECT *
        FROM menu
        WHERE id IN (${placeholders})
        AND available = 1
    `;

    db.all(
        sql,
        items.map(item => item.menu_id),
        (err, menuItems) => {

            if (err) {
                return res.status(500).json({
                    error: "Failed to fetch menu items"
                });
            }

            if (menuItems.length !== items.length) {
                return res.status(400).json({
                    error: "One or more menu items are invalid or unavailable"
                });
            }

            let totalAmount = 0;

            const itemDetails = items.map(item => {

                const menuItem = menuItems.find(
                    menu => menu.id === Number(item.menu_id)
                );

                const quantity = Number(item.quantity);

                const itemTotal = menuItem.price * quantity;

                totalAmount += itemTotal;

                return {
                    menu_id: menuItem.id,
                    quantity,
                    price: menuItem.price
                };
            });

            db.run(
                `
                INSERT INTO orders
                (table_id, customer_name, total_amount)
                VALUES (?, ?, ?)
                `,
                [
                    table_id || null,
                    customer_name,
                    totalAmount
                ],
                function (err) {

                    if (err) {
                        return res.status(500).json({
                            error: "Failed to create order"
                        });
                    }

                    const orderId = this.lastID;

                    const stmt = db.prepare(`
                        INSERT INTO order_items
                        (
                            order_id,
                            menu_id,
                            quantity,
                            price
                        )
                        VALUES (?, ?, ?, ?)
                    `);

                    itemDetails.forEach(item => {

                        stmt.run(
                            orderId,
                            item.menu_id,
                            item.quantity,
                            item.price
                        );
                    });

                    stmt.finalize();

                    if (table_id) {
                        db.run(
                            "UPDATE restaurant_tables SET status = 'occupied' WHERE id = ?",
                            [table_id]
                        );
                    }

                    res.status(201).json({
                        message: "Order created successfully",
                        order_id: orderId,
                        total_amount: totalAmount
                    });
                }
            );
        }
    );
});


// Get order details
app.get("/orders/:id", (req, res) => {

    db.get(
        "SELECT * FROM orders WHERE id = ?",
        [req.params.id],
        (err, order) => {

            if (err) {
                return res.status(500).json({
                    error: "Database error"
                });
            }

            if (!order) {
                return res.status(404).json({
                    error: "Order not found"
                });
            }

            db.all(
                `
                SELECT
                    order_items.*,
                    menu.name
                FROM order_items
                JOIN menu
                ON order_items.menu_id = menu.id
                WHERE order_items.order_id = ?
                `,
                [req.params.id],
                (err, items) => {

                    if (err) {
                        return res.status(500).json({
                            error: "Failed to fetch order items"
                        });
                    }

                    res.json({
                        order,
                        items
                    });
                }
            );
        }
    );
});


// Update order status
app.put("/orders/:id/status", (req, res) => {

    const {
        status
    } = req.body;

    const validStatuses = [
        "pending",
        "preparing",
        "ready",
        "completed",
        "cancelled"
    ];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            error: "Invalid order status"
        });
    }

    db.run(
        "UPDATE orders SET status = ? WHERE id = ?",
        [status, req.params.id],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: "Failed to update order status"
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    error: "Order not found"
                });
            }

            res.json({
                message: "Order status updated successfully"
            });
        }
    );
});


// ===============================
// 404 HANDLER
// ===============================

app.use((req, res) => {
    res.status(404).json({
        error: "Endpoint not found"
    });
});


// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {
    console.log(`Restaurant Management API running at http://localhost:${PORT}`);
});