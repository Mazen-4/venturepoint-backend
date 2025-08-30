const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authenticateToken, JWT_SECRET } = require("./auth");

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

// ================= ADMIN AUTH =================
// Only allow one admin registration (first time)
app.post("/api/admin/register", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });
    db.query("SELECT COUNT(*) AS count FROM admins", (err, results) => {
        if (err) return res.status(500).send(err);
        if (results[0].count > 0) return res.status(403).json({ error: "Admin registration disabled" });
        const hash = bcrypt.hashSync(password, 10);
        db.query("INSERT INTO admins (username, password) VALUES (?, ?)", [username, hash], (err, result) => {
            if (err) return res.status(500).send(err);
            res.json({ success: true, id: result.insertId });
        });
    });
});

app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });
    db.query("SELECT * FROM admins WHERE username = ?", [username], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(401).json({ error: "Invalid credentials" });
        const admin = results[0];
        if (!bcrypt.compareSync(password, admin.password)) return res.status(401).json({ error: "Invalid credentials" });
        const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: "12h" });
        res.json({ token });
    });
});

// ================= PROTECT ALL POST/PUT/DELETE ROUTES =================
function protectRoutes(app) {
    const methods = ["post", "put", "delete"];
    const unprotected = [
        "/api/admin/register",
        "/api/admin/login"
    ];
    methods.forEach(method => {
        const orig = app[method].bind(app);
        app[method] = (path, ...handlers) => {
            if (unprotected.includes(path)) {
                return orig(path, ...handlers);
            }
            return orig(path, authenticateToken, ...handlers);
        };
    });
}
protectRoutes(app);

// ================== FULL CRUD ROUTES FOR ALL TABLES ==================

// SERVICES CRUD
app.get("/api/services/:id", (req, res) => {
    db.query("SELECT * FROM services WHERE id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).json({ error: "Not found" });
        res.json(results[0]);
    });
});
app.post("/api/services", (req, res) => {
    db.query("INSERT INTO services SET ?", req.body, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true, id: result.insertId });
    });
});
app.put("/api/services/:id", (req, res) => {
    db.query("UPDATE services SET ? WHERE id = ?", [req.body, req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});
app.delete("/api/services/:id", (req, res) => {
    db.query("DELETE FROM services WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

// TEAM MEMBERS CRUD
app.get("/api/team/:id", (req, res) => {
    db.query("SELECT * FROM team_members WHERE id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).json({ error: "Not found" });
        res.json(results[0]);
    });
});
app.post("/api/team", (req, res) => {
    db.query("INSERT INTO team_members SET ?", req.body, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true, id: result.insertId });
    });
});
app.put("/api/team/:id", (req, res) => {
    db.query("UPDATE team_members SET ? WHERE id = ?", [req.body, req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});
app.delete("/api/team/:id", (req, res) => {
    db.query("DELETE FROM team_members WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

// PROJECTS CRUD
app.get("/api/projects/:id", (req, res) => {
    db.query("SELECT * FROM projects WHERE id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).json({ error: "Not found" });
        res.json(results[0]);
    });
});
app.post("/api/projects", (req, res) => {
    db.query("INSERT INTO projects SET ?", req.body, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true, id: result.insertId });
    });
});
app.put("/api/projects/:id", (req, res) => {
    db.query("UPDATE projects SET ? WHERE id = ?", [req.body, req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});
app.delete("/api/projects/:id", (req, res) => {
    db.query("DELETE FROM projects WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

// BLOG POSTS CRUD
app.get("/api/blog/:id", (req, res) => {
    db.query("SELECT * FROM blog_posts WHERE id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).json({ error: "Not found" });
        res.json(results[0]);
    });
});
app.post("/api/blog", (req, res) => {
    db.query("INSERT INTO blog_posts SET ?", req.body, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true, id: result.insertId });
    });
});
app.put("/api/blog/:id", (req, res) => {
    db.query("UPDATE blog_posts SET ? WHERE id = ?", [req.body, req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});
app.delete("/api/blog/:id", (req, res) => {
    db.query("DELETE FROM blog_posts WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

// EVENTS CRUD
app.get("/api/events/:id", (req, res) => {
    db.query("SELECT * FROM events WHERE id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).json({ error: "Not found" });
        res.json(results[0]);
    });
});
app.post("/api/events", (req, res) => {
    db.query("INSERT INTO events SET ?", req.body, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true, id: result.insertId });
    });
});
app.put("/api/events/:id", (req, res) => {
    db.query("UPDATE events SET ? WHERE id = ?", [req.body, req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});
app.delete("/api/events/:id", (req, res) => {
    db.query("DELETE FROM events WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

// JOB POSTINGS CRUD
app.get("/api/jobs/:id", (req, res) => {
    db.query("SELECT * FROM job_postings WHERE id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).json({ error: "Not found" });
        res.json(results[0]);
    });
});
app.post("/api/jobs", (req, res) => {
    db.query("INSERT INTO job_postings SET ?", req.body, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true, id: result.insertId });
    });
});
app.put("/api/jobs/:id", (req, res) => {
    db.query("UPDATE job_postings SET ? WHERE id = ?", [req.body, req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});
app.delete("/api/jobs/:id", (req, res) => {
    db.query("DELETE FROM job_postings WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

// CONTACT MESSAGES CRUD
app.get("/api/contact/:id", (req, res) => {
    db.query("SELECT * FROM contact_messages WHERE id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).json({ error: "Not found" });
        res.json(results[0]);
    });
});
app.put("/api/contact/:id", (req, res) => {
    db.query("UPDATE contact_messages SET ? WHERE id = ?", [req.body, req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});
app.delete("/api/contact/:id", (req, res) => {
    db.query("DELETE FROM contact_messages WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});
