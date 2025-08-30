const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MySQL
const db = mysql.createConnection({
    host: "localhost",
    user: "root",       // WAMP default user
    password: "",       // if you set a password in phpMyAdmin, put it here
    database: "venturepoint_db"
});

// Test DB connection
db.connect(err => {
    if (err) {
        console.error("❌ DB connection failed: ", err);
        return;
    }
    console.log("✅ Connected to MySQL database");
});

// Test route
app.get("/", (req, res) => {
    res.send("VenturePoint API is running...");
});

// Example route: Get all services
app.get("/api/services", (req, res) => {
    db.query("SELECT * FROM services", (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// ================= TEAM MEMBERS =================
app.get("/api/team", (req, res) => {
    db.query("SELECT * FROM team_members", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// ================= PROJECTS =================
app.get("/api/projects", (req, res) => {
    db.query("SELECT * FROM projects", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// ================= BLOG POSTS =================
app.get("/api/blog", (req, res) => {
    db.query("SELECT * FROM blog_posts", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// ================= EVENTS =================
app.get("/api/events", (req, res) => {
    db.query("SELECT * FROM events", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// ================= JOB POSTINGS =================
app.get("/api/jobs", (req, res) => {
    db.query("SELECT * FROM job_postings", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// ================= CONTACT MESSAGES =================
// Save a new contact message
app.post("/api/contact", (req, res) => {
    const { name, email, subject, message } = req.body;
    db.query(
        "INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)",
        [name, email, subject, message],
        (err, result) => {
            if (err) return res.status(500).send(err);
            res.json({ success: true, id: result.insertId });
        }
    );
});

// Get all contact messages (for admin panel later, optional)
app.get("/api/contact", (req, res) => {
    db.query("SELECT * FROM contact_messages", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});


// Start server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
