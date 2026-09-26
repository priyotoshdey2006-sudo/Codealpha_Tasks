# CodeAlpha Restaurant Management System

A REST API-based Restaurant Management System developed using Node.js, Express.js, and SQLite as part of the CodeAlpha Backend Development Internship.

## Features

* Menu management
* Restaurant table management
* Table availability and status management
* Customer reservations
* Reservation cancellation
* Order management
* Order item management
* Order status tracking
* Inventory management
* RESTful API architecture
* SQLite database
* JSON-based API responses
* CORS support
* Input validation
* Proper HTTP status codes

## Technologies Used

* Node.js
* Express.js
* SQLite
* SQLite3
* JavaScript
* REST API
* CORS

## API Endpoints

### Menu

| Method | Endpoint    | Description        |
| ------ | ----------- | ------------------ |
| GET    | `/menu`     | Get all menu items |
| POST   | `/menu`     | Add a menu item    |
| PUT    | `/menu/:id` | Update a menu item |
| DELETE | `/menu/:id` | Delete a menu item |

### Restaurant Tables

| Method | Endpoint             | Description               |
| ------ | -------------------- | ------------------------- |
| GET    | `/tables`            | Get all restaurant tables |
| POST   | `/tables`            | Add a restaurant table    |
| PUT    | `/tables/:id/status` | Update table status       |

### Reservations

| Method | Endpoint            | Description          |
| ------ | ------------------- | -------------------- |
| GET    | `/reservations`     | Get all reservations |
| POST   | `/reservations`     | Create a reservation |
| DELETE | `/reservations/:id` | Cancel a reservation |

### Orders

| Method | Endpoint             | Description         |
| ------ | -------------------- | ------------------- |
| GET    | `/orders`            | Get all orders      |
| POST   | `/orders`            | Create an order     |
| GET    | `/orders/:id`        | Get order details   |
| PUT    | `/orders/:id/status` | Update order status |

### Inventory

| Method | Endpoint         | Description        |
| ------ | ---------------- | ------------------ |
| GET    | `/inventory`     | Get inventory      |
| POST   | `/inventory`     | Add inventory item |
| PUT    | `/inventory/:id` | Update inventory   |

## Project Structure

```text
Task-3-Restaurant-Management/
│
├── database.js
├── server.js
├── package.json
├── package-lock.json
├── README.md
├── .gitignore
└── restaurant.db
```

`restaurant.db` and `node_modules` are excluded from GitHub using `.gitignore`.

## Installation

Clone the repository and enter the Task 3 folder:

```bash
cd Task-3-Restaurant-Management
```

Install dependencies:

```bash
npm install
```

## Run the Application

Production/start mode:

```bash
npm start
```

Development mode:

```bash
npm run dev
```

The API runs at:

```text
http://localhost:3000
```

## Example Menu Request

### POST `/menu`

```json
{
  "name": "Chicken Biryani",
  "description": "Aromatic chicken biryani with basmati rice",
  "category": "Main Course",
  "price": 220
}
```

## Example Order Request

### POST `/orders`

```json
{
  "table_id": 1,
  "customer_name": "Priyotosh Dey",
  "items": [
    {
      "menu_id": 1,
      "quantity": 2
    }
  ]
}
```

## Example Reservation Request

### POST `/reservations`

```json
{
  "table_id": 1,
  "customer_name": "Priyotosh Dey",
  "phone": "9876543210",
  "reservation_date": "2026-09-30",
  "reservation_time": "19:30",
  "guests": 4
}
```

## Database

SQLite is used as the database.

The system automatically creates the following tables:

* `menu`
* `restaurant_tables`
* `reservations`
* `orders`
* `order_items`
* `inventory`

## Internship

This project was developed as **Task 3 — Restaurant Management System** for the **CodeAlpha Backend Development Internship**.

## Author

**Priyotosh Dey**

B.Tech — CSE (AIML)

Dr. B.C. Roy Engineering College
