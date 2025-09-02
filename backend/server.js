// ================= OPTIONAL ENHANCEMENTS =================
// For future: Implement audit logging (track admin actions for security and accountability)
// For future: Add pagination and filtering to API endpoints for scalability and usability
// ================= ADMIN PASSWORD RESET =================
/**
 * POST /api/admin/reset-password
 * Allows a superadmin to reset another admin's password.
 * Body: { username, newPassword }
 * Only accessible by superadmin.
 */
// Route defined after app initialization below

// ================= ADMIN MANAGEMENT (SUPERADMIN ONLY) =================
// Routes defined after app initialization below

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authenticateToken, JWT_SECRET, requireRole } = require("./auth");


const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// ================= ADMIN PASSWORD RESET =================
app.post("/api/admin/reset-password", authenticateToken, requireRole("superadmin"), (req, res) => {
    const { username, newPassword } = req.body;
    if (!username || !newPassword) return res.status(400).json({ error: "Username and new password required" });
    const hash = bcrypt.hashSync(newPassword, 10);
    db.query("UPDATE admins SET password = ? WHERE username = ?", [hash, username], (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Admin not found" });
        res.json({ success: true });
    });
});

// ================= ADMIN MANAGEMENT (SUPERADMIN ONLY) =================
// List all admins
app.get("/api/admins", authenticateToken, requireRole("superadmin"), (req, res) => {
    db.query("SELECT id, username, role FROM admins", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Add a new admin
app.post("/api/admins", authenticateToken, requireRole("superadmin"), (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password || !role) return res.status(400).json({ error: "Username, password, and role required" });
    const hash = bcrypt.hashSync(password, 10);
    db.query("INSERT INTO admins (username, password, role) VALUES (?, ?, ?)", [username, hash, role], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true, id: result.insertId });
    });
});

// Update an admin's info/role
app.put("/api/admins/:id", authenticateToken, requireRole("superadmin"), (req, res) => {
    const { username, password, role } = req.body;
    let updateFields = [];
    let params = [];
    if (username) { updateFields.push("username = ?"); params.push(username); }
    if (password) { updateFields.push("password = ?"); params.push(bcrypt.hashSync(password, 10)); }
    if (role) { updateFields.push("role = ?"); params.push(role); }
    if (updateFields.length === 0) return res.status(400).json({ error: "No fields to update" });
    params.push(req.params.id);
    db.query(`UPDATE admins SET ${updateFields.join(", ")} WHERE id = ?`, params, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

// Delete an admin
app.delete("/api/admins/:id", authenticateToken, requireRole("superadmin"), (req, res) => {
    db.query("DELETE FROM admins WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});


// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer storage config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

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

// ================= ARTICLES =================
app.get("/api/articles", (req, res) => {
    db.query("SELECT * FROM articles", (err, results) => {
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
        // Include role in JWT
        const token = jwt.sign({ id: admin.id, username: admin.username, role: admin.role }, JWT_SECRET, { expiresIn: "12h" });
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
            // For destructive actions, require superadmin
            if (method === "delete") {
                return orig(path, authenticateToken, requireRole("superadmin"), ...handlers);
            }
            // For other actions, require any authenticated admin
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
// Create team member with photo upload
app.post("/api/team", upload.single('photo'), (req, res) => {
    const data = req.body;
    if (req.file) {
        data.photo = `/uploads/${req.file.filename}`;
    }
    db.query("INSERT INTO team_members SET ?", data, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true, id: result.insertId, photo: data.photo });
    });
});
// Update team member with optional photo upload
app.put("/api/team/:id", upload.single('photo'), (req, res) => {
    const data = req.body;
    if (req.file) {
        data.photo = `/uploads/${req.file.filename}`;
    }
    db.query("UPDATE team_members SET ? WHERE id = ?", [data, req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true, photo: data.photo });
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

// ARTICLES CRUD
app.get("/api/articles/:id", (req, res) => {
    db.query("SELECT * FROM articles WHERE id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).json({ error: "Not found" });
        res.json(results[0]);
    });
});
app.post("/api/articles", (req, res) => {
    db.query("INSERT INTO articles SET ?", req.body, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true, id: result.insertId });
    });
});
app.put("/api/articles/:id", (req, res) => {
    db.query("UPDATE articles SET ? WHERE id = ?", [req.body, req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});
app.delete("/api/articles/:id", (req, res) => {
    db.query("DELETE FROM articles WHERE id = ?", [req.params.id], (err, result) => {
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

