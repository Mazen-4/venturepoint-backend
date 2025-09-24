
// ================== ALL REQUIRES AND CONSTS AT TOP ==================
const analyticsRouter = require('./routes/analytics');
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authenticateToken, requireRole, requireAnyRole } = require("./auth");
const app = express();
// ================= AUTHORS CRUD =================
// Create authors table if not exists (run this SQL in your DB):
// CREATE TABLE IF NOT EXISTS authors (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL UNIQUE);

app.use(cors({
    origin: ['http://localhost:3000', 'https://venturepoint-egypt.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/images', express.static(path.join(__dirname, 'images')));


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'images');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 100 * 1024 * 1024 }
});
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const pool = mysql.createPool({
    host: "148.72.3.185",
    user: "vp_DBAdmin",
    password: "Vp_ed#2025%1624*P@s$",
    database: "venturepoint_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
pool.getConnection((err, connection) => {
    if (err) {
        console.error("❌ DB pool connection failed: ", err);
        return;
    }
    console.log("✅ Connected to MySQL database (pool)");
    connection.release();
});

// ================= OPTIONAL ENHANCEMENTS =================
// For future: Implement audit logging (track admin actions for security and accountability)
// For future: Add pagination and filtering to API endpoints for scalability and usability


// Middleware
app.use('/api/events', (req, res, next) => {
    // Skip body parsing for file upload routes
    if ((req.method === 'POST' || req.method === 'PUT') && req.headers['content-type']?.includes('multipart/form-data')) {
        return next();
    }
    express.json()(req, res, () => {
        express.urlencoded({ extended: true })(req, res, next);
    });
});


// Get all partners (public)
app.get("/api/partners", (req, res) => {
    pool.query("SELECT * FROM partners", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json({ data: results });
    });
});

// Get a single partner by ID (public)
app.get("/api/partners/:id", (req, res) => {
    pool.query("SELECT * FROM partners WHERE id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (!results || results.length === 0) return res.status(404).json({ error: "Partner not found" });
        res.json({ data: results[0] });
    });
});

// Add a new partner (admin or superadmin, with image upload)
app.post("/api/partners", authenticateToken, requireAnyRole(["admin", "superadmin"]), upload.single('image'), (req, res) => {
    try {
        const { name, description, website, ...otherFields } = req.body;
        if (!name) return res.status(400).json({ error: "Partner name required" });
        let insertData = { name, description, website, ...otherFields };
        if (req.file) {
            insertData.image_url = `/images/${req.file.filename}`;
        }
        const fields = Object.keys(insertData);
        const placeholders = fields.map(() => '?').join(', ');
        const query = `INSERT INTO partners (${fields.join(', ')}) VALUES (${placeholders})`;
        pool.query(query, Object.values(insertData), (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: "Partner already exists" });
                }
                return res.status(500).send(err);
            }
            res.status(201).json({ success: true, id: result.insertId, partner: { id: result.insertId, ...insertData } });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a partner (admin/superadmin, with image upload)
app.put("/api/partners/:id", authenticateToken, requireAnyRole(["admin", "superadmin"]), upload.single('image'), (req, res) => {
    const partnerId = req.params.id;
    const { name, description, website, ...otherFields } = req.body;
    // Get old image_url if no new image is uploaded
    pool.query('SELECT image_url FROM partners WHERE id = ?', [partnerId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!results || results.length === 0) return res.status(404).json({ error: "Partner not found" });
        let updateData = { ...otherFields };
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (website !== undefined) updateData.website = website;
        if (req.file) {
            updateData.image_url = `/images/${req.file.filename}`;
        } else {
            updateData.image_url = results[0]?.image_url || '';
        }
        const fields = Object.keys(updateData);
        const values = fields.map(f => updateData[f]);
        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const query = `UPDATE partners SET ${setClause} WHERE id = ?`;
        values.push(partnerId);
        pool.query(query, values, (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Partner updated successfully' });
        });
    });
});

// Delete a partner (superadmin only)
app.delete("/api/partners/:id", authenticateToken, requireRole("superadmin"), (req, res) => {
    pool.query("DELETE FROM partners WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Partner not found" });
        res.json({ success: true, message: "Partner deleted successfully" });
    });
});


// Get all authors
app.get("/api/authors", (req, res) => {
    pool.query("SELECT * FROM authors", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});


// Add a new author
app.post("/api/authors", (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Author name required" });
    pool.query("INSERT INTO authors (name) VALUES (?)", [name], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: "Author already exists" });
            }
            return res.status(500).send(err);
        }
        res.json({ success: true, id: result.insertId, name });
    });
});


// For all other routes
app.use((req, res, next) => {
    if (req.path.startsWith('/api/events')) {
        return next();
    }
    express.json()(req, res, () => {
        express.urlencoded({ extended: true })(req, res, next);
    });
});
// Create event route with image upload
app.post("/api/events", authenticateToken, upload.single('image'), (req, res) => {
    try {
        console.log('=== CREATE EVENT DEBUG ===');
        console.log('Body:', req.body);
        console.log('File:', req.file);
        console.log('==========================');


        const { title, description, event_date } = req.body;

        // Validate required fields
        if (!title || !sanitizeForMySQL(title)) {
            return res.status(400).json({
                success: false,
                message: 'Title is required'
            });
        }

        const insertData = {
            title: sanitizeForMySQL(title),
            description: sanitizeForMySQL(description),
            event_date: sanitizeForMySQL(event_date),
            image_url: req.file ? `images/${req.file.filename}` : null
        };

        console.log('Insert data:', insertData);

        const fields = Object.keys(insertData);
        const placeholders = fields.map(() => '?').join(', ');
        const query = `INSERT INTO events (${fields.join(', ')}) VALUES (${placeholders})`;
        console.log('Insert Query:', query);

        pool.query(query, Object.values(insertData), (err, result) => {
            if (err) {
                console.error('Create event error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to create event',
                    error: process.env.NODE_ENV === 'development' ? err.message : undefined
                });
            }

            res.status(201).json({
                success: true,
                message: 'Event created successfully',
                data: {
                    id: result.insertId,
                    ...insertData
                }
            });
        });
// Update event route with image upload
app.put("/api/events/:id", authenticateToken, upload.single('image'), (req, res) => {
    try {
        console.log('=== UPDATE EVENT DEBUG ===');
        console.log('Body:', req.body);
        console.log('File:', req.file);
        console.log('==========================');

        const { title, description, event_date } = req.body;
        const id = req.params.id;

        // Validate required fields
        if (!title || !sanitizeForMySQL(title)) {
            return res.status(400).json({
                success: false,
                message: 'Title is required'
            });
        }

        // Build update fields
        let updateData = {
            title: sanitizeForMySQL(title),
            description: sanitizeForMySQL(description),
            event_date: sanitizeForMySQL(event_date)
        };
        let newImageUrl = undefined;
        if (req.file) {
            updateData.image_url = `images/${req.file.filename}`;
            newImageUrl = updateData.image_url;
        }

        const fields = Object.keys(updateData).map(field => `${field} = ?`).join(', ');
        const values = Object.values(updateData);
        const query = `UPDATE events SET ${fields} WHERE id = ?`;
        values.push(id);
        console.log('Update Query:', query);

    pool.query(query, values, (err, result) => {
            if (err) {
                console.error('Update event error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update event',
                    error: process.env.NODE_ENV === 'development' ? err.message : undefined
                });
            }

            // Always return the current image_url (new or existing)
            if (newImageUrl) {
                // If a new image was uploaded, return it
                return res.status(200).json({
                    success: true,
                    message: 'Event updated successfully',
                    image_url: newImageUrl,
                    data: {
                        id,
                        ...updateData
                    }
                });
            } else {
                // If no new image, fetch the current image_url from DB
                pool.query('SELECT image_url FROM events WHERE id = ?', [id], (err2, rows) => {
                    let imageUrl = null;
                    if (!err2 && rows && rows.length > 0) {
                        imageUrl = rows[0].image_url;
                    }
                    return res.status(200).json({
                        success: true,
                        message: 'Event updated successfully',
                        image_url: imageUrl,
                        data: {
                            id,
                            ...updateData,
                            image_url: imageUrl
                        }
                    });
                });
            }
        });
    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update event',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create event',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
// Error logging middleware for uploads and general errors
app.use((error, req, res, next) => {
    console.error('=== MIDDLEWARE ERROR ===');
    console.error('Path:', req.path);
    console.error('Method:', req.method);
    console.error('Error:', error);
    console.error('========================');
    if (error instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message: `File upload error: ${error.message}`,
            code: error.code
        });
    }
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.headers.authorization) {
    console.log('Authorization header present:', req.headers.authorization.substring(0, 20) + '...');
  }
  next();
});

// Serve uploaded images statically
// The uploads directory is inside the backend folder, which is correct for server-side storage
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Static files for frontend (if you have any)

// Multer storage config

// Helper function to safely convert values to strings for MySQL
const sanitizeForMySQL = (value) => {
    if (value === undefined || value === null || value === 'undefined' || value === 'null') {
        return '';
    }
    return String(value).trim();
};

// Test DB connection


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// ================= PUBLIC ROUTES (NO AUTH REQUIRED) =================
// Get about page data (single row)
app.get("/api/about", (req, res) => {
    pool.query("SELECT * FROM about LIMIT 1", (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send(err);
        }
        if (!results || results.length === 0) {
            return res.status(404).json({ error: "No about data found" });
        }
        console.log("About data fetched:", results[0]);
        res.json(results[0]);
    });
});

//    <Route path="/services" element={<ServicesPage />} />


// Get all services (public)
app.get("/api/services", (req, res) => {
    pool.query("SELECT * FROM services", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Get all team members (public)
app.get("/api/team", (req, res) => {
    pool.query("SELECT * FROM team_members", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Get all projects (public)
app.get("/api/projects", (req, res) => {
    pool.query("SELECT * FROM projects", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Get all articles (public)
app.get("/api/articles", (req, res) => {
    pool.query("SELECT * FROM articles", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Get all events (public)
app.get("/api/events", (req, res) => {
    pool.query("SELECT * FROM events", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Get all job postings (public)
app.get("/api/jobs", (req, res) => {
    pool.query("SELECT * FROM job_postings", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Save a new contact message (public)
app.post("/api/contact", (req, res) => {
    const { name, email, subject, message } = req.body;
    pool.query(
        "INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)",
        [name, email, subject, message],
        (err, result) => {
            if (err) return res.status(500).send(err);
            res.json({ success: true, id: result.insertId });
        }
    );
});

// Mark contact message as read
app.post("/api/contact/:id/read", authenticateToken, (req, res) => {
    pool.query("UPDATE contact_messages SET read = 1 WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

// Mark contact message as unread
app.post("/api/contact/:id/unread", authenticateToken, (req, res) => {
    pool.query("UPDATE contact_messages SET read = 0 WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});


// ================= ADMIN AUTH =================

// Admin registration (first time only)
app.post("/api/admin/register", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });
    
    pool.query("SELECT COUNT(*) AS count FROM admins", (err, results) => {
        if (err) return res.status(500).send(err);
        if (results[0].count > 0) return res.status(403).json({ error: "Admin registration disabled" });
        
        const hash = bcrypt.hashSync(password, 10);
    pool.query("INSERT INTO admins (username, password, role) VALUES (?, ?, 'superadmin')", [username, hash], (err, result) => {
            if (err) return res.status(500).send(err);
            res.json({ success: true, id: result.insertId });
        });
    });
});

// Admin login
app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });

    pool.query("SELECT * FROM admins WHERE username = ?", [username], (err, results) => {
        if (err) {
            console.error("DB error during admin login:", err);
            return res.status(500).json({ error: "Database error" });
        }
        if (results.length === 0) return res.status(401).json({ error: "Invalid credentials" });

        const admin = results[0];
        if (!bcrypt.compareSync(password, admin.password)) return res.status(401).json({ error: "Invalid credentials" });

        console.log("Login success for user:", admin.username, "role:", admin.role);

        const payload = {
            id: admin.id,
            username: admin.username,
            role: admin.role
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
        return res.json({ token });
    });
});

// ================= ADMIN MANAGEMENT (SUPERADMIN ONLY) =================

// Admin password reset (superadmin only)
app.post("/api/admin/reset-password", authenticateToken, requireRole("superadmin"), (req, res) => {
    const { username, newPassword } = req.body;
    if (!username || !newPassword) return res.status(400).json({ error: "Username and new password required" });
    
    const hash = bcrypt.hashSync(newPassword, 10);
    pool.query("UPDATE admins SET password = ? WHERE username = ?", [hash, username], (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Admin not found" });
        res.json({ success: true });
    });
});

// List all admins (superadmin only)
app.get("/api/admins", authenticateToken, requireRole("superadmin"), (req, res) => {
    pool.query("SELECT id, username, role FROM admins", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Add a new admin (superadmin only)
app.post("/api/admins", authenticateToken, requireRole("superadmin"), (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password || !role) return res.status(400).json({ error: "Username, password, and role required" });
    
    const hash = bcrypt.hashSync(password, 10);
    pool.query("INSERT INTO admins (username, password, role) VALUES (?, ?, ?)", [username, hash, role], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true, id: result.insertId });
    });
});

// Update an admin's info/role (superadmin only)
app.put("/api/admins/:id", authenticateToken, requireRole("superadmin"), (req, res) => {
    const { username, password, role } = req.body;
    let updateFields = [];
    let params = [];
    
    if (username) { updateFields.push("username = ?"); params.push(username); }
    if (password) { updateFields.push("password = ?"); params.push(bcrypt.hashSync(password, 10)); }
    if (role) { updateFields.push("role = ?"); params.push(role); }
    
    if (updateFields.length === 0) return res.status(400).json({ error: "No fields to update" });
    
    params.push(req.params.id);
    pool.query(`UPDATE admins SET ${updateFields.join(", ")} WHERE id = ?`, params, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

// Delete an admin (superadmin only)
app.delete("/api/admins/:id", authenticateToken, requireRole("superadmin"), (req, res) => {
    pool.query("DELETE FROM admins WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

// ================== AUTHENTICATED CRUD ROUTES ==================
// Analytics endpoint (admin only)
// If analyticsRouter does not provide /api/admin/analytics, define it here:
const { google } = require('googleapis');
const analyticsKeyPath = path.join(__dirname, 'credentials/venturepoint-042379c47b7f.json');
const GA4_PROPERTY_ID = '505423261'; // <-- Replace with your actual property ID if needed

app.get('/api/admin/analytics', async (req, res) => {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: analyticsKeyPath,
            scopes: 'https://www.googleapis.com/auth/analytics.readonly',
        });
        const analyticsData = google.analyticsdata({ version: 'v1beta', auth });

        const response = await analyticsData.properties.runReport({
            property: `properties/${GA4_PROPERTY_ID}`,
            requestBody: {
                dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
                metrics: [{ name: 'sessions' }],
                dimensions: [{ name: 'date' }],
            },
        });

        // Debug log
        console.log('GA4 API response:', response.data);
        if (response && response.data) {
            res.json({
                ...response.data,
                rows: response.data.rows || []
            });
        } else {
            res.json({ rows: [] });
        }
    } catch (error) {
        // Enhanced error logging for debugging
        if (error && error.response && error.response.data) {
            console.error('Analytics API error response:', error.response.data);
        } else {
            console.error('Analytics API error:', error);
        }
        res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
});
app.use('/api', analyticsRouter);

// SERVICES CRUD
app.get("/api/services/:id", (req, res) => {
    pool.query("SELECT * FROM services WHERE id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).json({ error: "Not found" });
        res.json(results[0]);
    });
});

app.post("/api/services", authenticateToken, (req, res) => {
    pool.query("INSERT INTO services SET ?", req.body, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true, id: result.insertId });
    });
});

app.put("/api/services/:id", authenticateToken, (req, res) => {
    pool.query("UPDATE services SET ? WHERE id = ?", [req.body, req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

app.delete("/api/services/:id", authenticateToken, requireRole("superadmin"), (req, res) => {
    pool.query("DELETE FROM services WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

// TEAM MEMBERS CRUD
app.get("/api/team/:id", (req, res) => {
    pool.query("SELECT * FROM team_members WHERE id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).json({ error: "Not found" });
        res.json(results[0]);
    });
});


// Add new team member (with optional image upload, flexible file field)
app.post("/api/team", upload.any(), (req, res) => {
    try {
        const { name, role, bio } = req.body;
        if (!name || !role || !bio) {
            return res.status(400).json({ success: false, message: 'Name, role, and bio are required.' });
        }
        // Accept any file field name
        let file = req.files && req.files.length > 0 ? req.files[0] : null;
        const imagePath = file ? '/images/' + file.filename : '';
        const insertData = {
            name,
            role,
            bio,
            photo_url: imagePath
        };
        const fields = Object.keys(insertData);
        const placeholders = fields.map(() => '?').join(', ');
        const query = `INSERT INTO team_members (${fields.join(', ')}) VALUES (${placeholders})`;
        pool.query(query, Object.values(insertData), (err, result) => {
            if (err) {
                console.error('Add member error:', err);
                return res.status(500).json({ success: false, message: 'Failed to add member', error: err.message });
            }
            res.status(201).json({ 
                success: true, 
                message: 'Member added successfully', 
                id: result.insertId, 
                member: { 
                    ...insertData, 
                    id: result.insertId 
                } 
            });
        });
    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({ success: false, message: 'Failed to add member', error: error.message });
    }
});

// Update team member (with optional image upload)

// Update team member (with optional image upload, flexible file field)
app.put('/api/team/:id', upload.any(), (req, res) => {
    const memberId = req.params.id;
    const { name, role, bio } = req.body;
    if (!name || !role || !bio) {
        return res.status(400).json({ success: false, message: 'Name, role, and bio are required.' });
    }
    // If no new image, keep the old photo_url
    pool.query('SELECT photo_url FROM team_members WHERE id = ?', [memberId], (err, results) => {
        if (err) {
            console.error('Fetch old photo_url error:', err);
            return res.status(500).json({ success: false, message: 'Failed to update member', error: err.message });
        }
        let updateData = { name, role, bio };
        // Accept any file field name
        let file = req.files && req.files.length > 0 ? req.files[0] : null;
        if (file) {
            updateData.photo_url = `/images/${file.filename}`;
        } else {
            updateData.photo_url = results[0]?.photo_url || '';
        }
        const fields = Object.keys(updateData);
        const values = fields.map(f => updateData[f]);
        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const query = `UPDATE team_members SET ${setClause} WHERE id = ?`;
        values.push(memberId);
    pool.query(query, values, (err, result) => {
            if (err) {
                console.error('Update member error:', err);
                return res.status(500).json({ success: false, message: 'Failed to update member', error: err.message });
            }
            res.json({ success: true, message: 'Member updated successfully' });
        });
    });
});

// Delete a team member (superadmin only)
app.delete("/api/team/:id", authenticateToken, requireRole("superadmin"), (req, res) => {
    pool.query("DELETE FROM team_members WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

// PROJECTS CRUD
app.get("/api/projects/:id", (req, res) => {
    pool.query("SELECT * FROM projects WHERE id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).json({ error: "Not found" });
        res.json(results[0]);
    });
});

app.post("/api/projects", authenticateToken, upload.any(), (req, res) => {
    try {
        console.log('--- Add Project Debug ---');
        console.log('req.body:', req.body);
        console.log('req.files:', req.files);
        // Parse fields from req.body
        const { name, description, region, start_date, end_date } = req.body;
        let insertData = { name, description, region, start_date, end_date };
        // Accept any file field name
        let file = req.files && req.files.length > 0 ? req.files[0] : null;
        if (file) {
            insertData.image_url = `/images/${file.filename}`;
        } else {
            insertData.image_url = '';
        }
        const fields = Object.keys(insertData);
        const placeholders = fields.map(() => '?').join(', ');
        const query = `INSERT INTO projects (${fields.join(', ')}) VALUES (${placeholders})`;
        console.log('Insert query:', query);
        console.log('Insert values:', Object.values(insertData));
        pool.query(query, Object.values(insertData), (err, result) => {
            if (err) {
                console.error('Add project error:', err);
                return res.status(500).json({ success: false, message: 'Failed to add project', error: err.message });
            }
            res.status(201).json({ 
                success: true, 
                message: 'Project added successfully', 
                id: result.insertId, 
                project: { 
                    ...insertData, 
                    id: result.insertId 
                } 
            });
        });
    } catch (error) {
        console.error('Add project error:', error);
        res.status(500).json({ success: false, message: 'Failed to add project', error: error.message });
    }
});


// Update a project, with optional image upload
app.put("/api/projects/:id", authenticateToken, upload.any(), (req, res) => {
    const projectId = req.params.id;
    console.log('--- Edit Project Debug ---');
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);
    // Parse fields from req.body
    const { title, description, ...otherFields } = req.body;
    // Get old image_url if no new image is uploaded
    pool.query('SELECT image_url FROM projects WHERE id = ?', [projectId], (err, results) => {
        if (err) {
            console.error('Fetch old image_url error:', err);
            return res.status(500).json({ success: false, message: 'Failed to update project', error: err.message });
        }
        let updateData = { ...otherFields };
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        // Accept any file field name
        let file = req.files && req.files.length > 0 ? req.files[0] : null;
        if (file) {
            updateData.image_url = `/images/${file.filename}`;
        } else {
            updateData.image_url = results[0]?.image_url || '';
        }
        const fields = Object.keys(updateData);
        const values = fields.map(f => updateData[f]);
        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const query = `UPDATE projects SET ${setClause} WHERE id = ?`;
        values.push(projectId);
        console.log('Update query:', query);
        console.log('Update values:', values);
    pool.query(query, values, (err, result) => {
            if (err) {
                console.error('Update project error:', err);
                return res.status(500).json({ success: false, message: 'Failed to update project', error: err.message });
            }
            res.json({ success: true, message: 'Project updated successfully' });
        });
    });
});

// PROJECT DELETE - SUPERADMIN ONLY (This is your main requirement)
app.delete("/api/projects/:id", authenticateToken, requireRole("superadmin"), (req, res) => {
    const projectId = req.params.id;
    console.log("DELETE /api/projects/:id called. id:", projectId);
    console.log("req.user:", req.user);

    pool.query("DELETE FROM projects WHERE id = ?", [projectId], (err, result) => {
        if (err) {
            console.error("SQL error during DELETE projects:", err);
            return res.status(500).json({ error: "Database error" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Project not found" });
        }
        return res.json({ success: true, message: "Project deleted successfully" });
    });
});

// ARTICLES CRUD
app.get("/api/articles/:id", (req, res) => {
    pool.query("SELECT * FROM articles WHERE id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).json({ error: "Not found" });
        res.json(results[0]);
    });
});

app.post("/api/articles", authenticateToken, (req, res) => {
    pool.query("INSERT INTO articles SET ?", req.body, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true, id: result.insertId });
    });
});

app.put("/api/articles/:id", authenticateToken, (req, res) => {
    pool.query("UPDATE articles SET ? WHERE id = ?", [req.body, req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

app.delete("/api/articles/:id", authenticateToken, requireRole("superadmin"), (req, res) => {
    pool.query("DELETE FROM articles WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

// EVENTS CRUD
app.get("/api/events/:id", (req, res) => {
    pool.query("SELECT * FROM events WHERE id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).json({ error: "Not found" });
        res.json(results[0]);
    });
});

app.post("/api/events", authenticateToken, (req, res) => {
    pool.query("INSERT INTO events SET ?", req.body, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true, id: result.insertId });
    });
});

// Replace with simplified test PUT route
app.put("/api/events/:id", authenticateToken, upload.single('image'), (req, res) => {
    try {
        console.log('\n=== UPDATE EVENT DEBUG ===');
        console.log('Content-Type:', req.headers['content-type']);
        console.log('Request body:', req.body);
        console.log('File:', req.file);
        const eventId = req.params.id;
        const { title, description, event_date } = req.body;
        // Only update fields that exist in the events table
        pool.query('SELECT image_url FROM events WHERE id = ?', [eventId], (err, results) => {
            if (err) {
                console.error('Fetch old image_url error:', err);
                return res.status(500).json({ success: false, message: 'Failed to update event', error: err.message });
            }
            let updateData = {};
            if (title !== undefined) updateData.title = title;
            if (description !== undefined) updateData.description = description;
            if (event_date !== undefined) updateData.event_date = event_date;
            if (req.file) {
                updateData.image_url = `images/${req.file.filename}`;
            } else {
                // Remove any leading slash for consistency
                let oldUrl = results[0]?.image_url || '';
                if (oldUrl.startsWith('/')) oldUrl = oldUrl.substring(1);
                updateData.image_url = oldUrl;
            }
            const fields = Object.keys(updateData);
            const values = fields.map(f => updateData[f]);
            const setClause = fields.map(f => `${f} = ?`).join(', ');
            const query = `UPDATE events SET ${setClause} WHERE id = ?`;
            values.push(eventId);
            console.log('Update Query:', query);
            console.log('Update Values:', values);
            pool.query(query, values, (err, result) => {
                if (err) {
                    console.error('Update event error:', err);
                    return res.status(500).json({ success: false, message: 'Failed to update event', error: err.message });
                }
                res.json({ success: true, message: 'Event updated successfully' });
            });
        });
    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({ success: false, message: 'Failed to update event', error: error.message });
    }
});
// Robust error handling middleware (add before PORT section)
app.use((error, req, res, next) => {
    console.error('\n=== MIDDLEWARE ERROR CAUGHT ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Path:', req.path);
    console.error('Method:', req.method);
    console.error('===============================\n');
    res.status(500).json({
        success: false,
        message: 'Middleware error',
        error: error.message
    });
});

app.delete("/api/events/:id", authenticateToken, requireRole("superadmin"), (req, res) => {
    pool.query("DELETE FROM events WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

// JOB POSTINGS CRUD
app.get("/api/jobs/:id", (req, res) => {
    pool.query("SELECT * FROM job_postings WHERE id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).json({ error: "Not found" });
        res.json(results[0]);
    });
});

app.post("/api/jobs", authenticateToken, (req, res) => {
    pool.query("INSERT INTO job_postings SET ?", req.body, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true, id: result.insertId });
    });
});

app.put("/api/jobs/:id", authenticateToken, (req, res) => {
    pool.query("UPDATE job_postings SET ? WHERE id = ?", [req.body, req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

app.delete("/api/jobs/:id", authenticateToken, requireRole("superadmin"), (req, res) => {
    pool.query("DELETE FROM job_postings WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

// CONTACT MESSAGES CRUD (Admin access)
app.get("/api/contact", authenticateToken, (req, res) => {
    pool.query("SELECT * FROM contact_messages", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

app.get("/api/contact/:id", authenticateToken, (req, res) => {
    pool.query("SELECT * FROM contact_messages WHERE id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).json({ error: "Not found" });
        res.json(results[0]);
    });
});

app.put("/api/contact/:id", authenticateToken, (req, res) => {
    pool.query("UPDATE contact_messages SET ? WHERE id = ?", [req.body, req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

app.delete("/api/contact/:id", authenticateToken, requireRole("superadmin"), (req, res) => {
    pool.query("DELETE FROM contact_messages WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});




// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 CORS enabled for: http://localhost:3000`);
});
