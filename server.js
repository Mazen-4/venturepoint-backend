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
    allowedHeaders: ['Content-Type', 'Authorization'],
    // Expose these headers so the browser can read them (e.g. Content-Disposition for filenames)
    exposedHeaders: ['Content-Disposition', 'Content-Length', 'Content-Type']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/images', express.static(path.join(__dirname, 'images')));

// PDF upload and retrieval is handled via DB BLOB, not static folder or separate router

// Serve favicon if requested to avoid noisy 404s (use backend/images/favicon.ico if present,
// fall back to VPED-logo.png, otherwise return 204 No Content)
app.get('/favicon.ico', (req, res) => {
    try {
        const faviconPath = path.join(__dirname, 'images', 'favicon.ico');
        if (fs.existsSync(faviconPath)) {
            return res.sendFile(faviconPath);
        }
        const fallback = path.join(__dirname, 'images', 'VPED-logo.png');
        if (fs.existsSync(fallback)) {
            res.setHeader('Content-Type', 'image/png');
            return res.sendFile(fallback);
        }
    } catch (err) {
        console.error('Error serving favicon:', err);
    }
    return res.status(204).end();
});


const fileFilter = (req, file, cb) => {
    // Allow images and common document types (pdf, doc, docx, txt)
    const allowed = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ];
    if (file.mimetype.startsWith('image/') || allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        // As a fallback, allow based on filename extension for some servers that may provide generic mimetypes
        const lower = (file.originalname || '').toLowerCase();
        if (lower.endsWith('.pdf') || lower.endsWith('.doc') || lower.endsWith('.docx') || lower.endsWith('.txt')) {
            cb(null, true);
        } else {
            cb(new Error('Only image or document files (pdf/doc/docx/txt) are allowed!'), false);
        }
    }
};
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter, // keep existing filter
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

// Ensure required columns exist in articles table (add blob & metadata columns if missing)
const ensureArticleColumns = () => {
    const needed = [
        { name: 'article', sql: 'LONGBLOB' },
        { name: 'article_mimetype', sql: 'VARCHAR(255)' },
        { name: 'article_name', sql: 'VARCHAR(512)' },
        { name: 'article_url', sql: 'VARCHAR(512)' }
    ];

    pool.query('SHOW COLUMNS FROM articles', (err, results) => {
        if (err) {
            console.error('Failed to check articles table columns:', err.message || err);
            return;
        }
        const existing = new Set(results.map(r => r.Field));
        const alters = [];
        needed.forEach(col => {
            if (!existing.has(col.name)) {
                alters.push(`ADD COLUMN ${col.name} ${col.sql} DEFAULT NULL`);
            }
        });
        if (alters.length === 0) {
            console.log('Articles table has required file columns');
            return;
        }
        const q = `ALTER TABLE articles ${alters.join(', ')}`;
        console.log('Altering articles table to add missing columns:', alters.map(a => a.split(' ')[2]).join(', '));
        pool.query(q, (aerr) => {
            if (aerr) {
                console.error('Failed to add missing columns to articles table:', aerr.message || aerr);
            } else {
                console.log('Successfully added missing columns to articles table');
            }
        });
    });
};

// Ensure required columns exist in partners table (add image BLOB & metadata columns if missing)
const ensurePartnerColumns = () => {
    const needed = [
        { name: 'image_data', sql: 'LONGBLOB' },
        { name: 'image_mimetype', sql: 'VARCHAR(255)' }
    ];

    pool.query('SHOW COLUMNS FROM partners', (err, results) => {
        if (err) {
            console.error('Failed to check partners table columns:', err.message || err);
            return;
        }
        const existing = new Set(results.map(r => r.Field));
        const alters = [];
        needed.forEach(col => {
            if (!existing.has(col.name)) {
                alters.push(`ADD COLUMN ${col.name} ${col.sql} DEFAULT NULL`);
            }
        });
        if (alters.length === 0) {
            console.log('Partners table has required image columns');
            return;
        }
        const q = `ALTER TABLE partners ${alters.join(', ')}`;
        console.log('Altering partners table to add missing columns:', alters.map(a => a.split(' ')[2]).join(', '));
        pool.query(q, (aerr) => {
            if (aerr) {
                console.error('Failed to add missing columns to partners table:', aerr.message || aerr);
            } else {
                console.log('Successfully added missing columns to partners table');
            }
        });
    });
};

// Run the schema check at startup
ensureArticleColumns();
ensurePartnerColumns();

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

// Handling uploads on the database (for /upload)
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const { originalname, mimetype, buffer } = req.file;
    const query = 'INSERT INTO uploads (name, mimetype, data) VALUES (?, ?, ?)';
    pool.query(query, [originalname, mimetype, buffer], (err, result) => {
        if (err) {
            console.error('Upload error:', err);
            return res.status(500).json({ error: 'Failed to upload image' });
        }
        const newId = result.insertId;
        res.json({
            id: newId,
            message: 'Image uploaded successfully',
            url: `/image/${newId}` // you can use this directly in <img src="">
        });
    });
});

// GET image by ID (from uploads table)
app.get('/image/:id', (req, res) => {
    const { id } = req.params;
    pool.query('SELECT mimetype, data FROM uploads WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Image fetch error:', err);
            return res.status(500).json({ error: 'Failed to load image' });
        }
        if (!results || results.length === 0) {
            return res.status(404).json({ error: 'Image not found' });
        }
        const { mimetype, data } = results[0];
        res.setHeader('Content-Type', mimetype || 'image/jpeg');
        res.send(data);
    });
});

// Get all partners (public)
app.get("/api/partners", (req, res) => {
    pool.query("SELECT * FROM partners", (err, results) => {
        if (err) return res.status(500).send(err);
        
        // Map partners to include image data for frontend preloading
        const mapped = results.map(r => {
            const out = { ...r };
            const hasImageData = r.image_data && r.image_data.length > 0;
            const hasImage = r.image && r.image.length > 0;
            
            // If image_data exists (newer uploads), keep it
            // If image exists (legacy column), move it to image_data for consistent handling
            if (!hasImageData && hasImage) {
                out.image_data = r.image;
                // Try to infer mimetype if not stored
                if (!out.image_mimetype) {
                    out.image_mimetype = 'image/jpeg'; // default fallback
                }
            }
            
            // Indicate whether an image is available; frontend uses the image endpoint directly
            out.has_image = !!(hasImageData || hasImage);
            
            return out;
        });
        
        console.log(`[PARTNERS] Returning ${mapped.length} partners`);
        res.json({ data: mapped });
    });
});

// Get a single partner by ID (public)
app.get("/api/partners/:id", (req, res) => {
    pool.query("SELECT * FROM partners WHERE id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (!results || results.length === 0) return res.status(404).json({ error: "Partner not found" });
        
        const partner = results[0];
        const hasImageData = partner.image_data && partner.image_data.length > 0;
        const hasImage = partner.image && partner.image.length > 0;
        
        // If image_data doesn't exist but image does (legacy), copy it over
        if (!hasImageData && hasImage) {
            partner.image_data = partner.image;
            // Try to infer mimetype if not stored
            if (!partner.image_mimetype) {
                partner.image_mimetype = 'image/jpeg'; // default fallback
            }
        }
        
        // Indicate whether an image is available for this partner
        partner.has_image = !!(hasImageData || hasImage);
        
        // Log what we have
        console.log(`[PARTNER] Fetching partner ${req.params.id}:`, {
            id: partner.id,
            name: partner.name,
            has_image_data: !!(partner.image_data && partner.image_data.length > 0),
            image_data_type: typeof partner.image_data,
            image_data_length: partner.image_data ? partner.image_data.length : 0,
            image_mimetype: partner.image_mimetype,
            has_image: partner.has_image
        });
        
        res.json({ data: partner });
    });
});

// Add a new partner (admin or superadmin, with image upload)
app.post("/api/partners", authenticateToken, requireAnyRole(["admin", "superadmin"]), upload.single('image'), (req, res) => {
    try {
        const { name, description, details, website, ...otherFields } = req.body;
        if (!name) return res.status(400).json({ error: "Partner name required" });
        let insertData = { name, website, ...otherFields };
        // Handle both 'description' and 'details' field names (frontend uses 'details')
        insertData.description = description || details || '';
        if (req.file) {
            insertData.image_data = req.file.buffer || null;
            insertData.image_mimetype = req.file.mimetype || null;
            insertData.image = null; // Clear legacy column
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
            const partnerId = result.insertId;
            // Respond with created partner metadata; indicate has_image if a file was uploaded
            const responsePartner = { id: partnerId, ...insertData, has_image: !!req.file };
            res.status(201).json({ success: true, id: partnerId, partner: responsePartner });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a partner (admin/superadmin, with image upload)
app.put("/api/partners/:id", authenticateToken, requireAnyRole(["admin", "superadmin"]), upload.single('image'), (req, res) => {
    const partnerId = req.params.id;
    const { name, description, details, website, ...otherFields } = req.body;
    console.log(`[PARTNER UPDATE] Request to update partner ${partnerId}`);
    console.log('[PARTNER UPDATE] req.body keys:', Object.keys(req.body));
    console.log('[PARTNER UPDATE] req.body sample:', {
        name: req.body.name,
        description: req.body.description,
        details: req.body.details,
        website: req.body.website
    });
    console.log('[PARTNER UPDATE] req.file:', req.file ? { originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size } : null);

    // Get old image data if no new image is uploaded
        // Include the legacy `image` column so existing images stored in that column are preserved
        // NOTE: some databases may not have an `image_url` column; do NOT select it here to avoid ER_BAD_FIELD_ERROR
        pool.query('SELECT image_data, image_mimetype, image FROM partners WHERE id = ?', [partnerId], (err, results) => {        if (err) {
            console.error('Error fetching partner for update:', err);
            return res.status(500).json({ error: err.message });
        }
        if (!results || results.length === 0) return res.status(404).json({ error: "Partner not found" });
        
        const existing = results[0];
        let updateData = { ...otherFields };
        
        if (name !== undefined) updateData.name = name;
        // Handle both 'description' and 'details' field names (frontend uses 'details')
        if (description !== undefined) updateData.description = description;
        if (details !== undefined) updateData.description = details;
        if (website !== undefined) updateData.website = website;
        
        if (req.file) {
            // New image uploaded -> write into the new blob column and clear legacy column
            updateData.image_data = req.file.buffer || null;
            updateData.image_mimetype = req.file.mimetype || null;
            updateData.image = null; // Clear legacy column so we don't have duplicate storage
        } else {
            // No new image - preserve existing image from either image_data or image column
            const hasImageData = existing.image_data && existing.image_data.length > 0;
            const hasImage = existing.image && existing.image.length > 0;
            
            if (hasImageData) {
                updateData.image_data = existing.image_data;
                updateData.image_mimetype = existing.image_mimetype || 'image/jpeg';
            } else if (hasImage) {
                // copy legacy `image` into `image_data` so the rest of the app uses a single column
                updateData.image_data = existing.image;
                updateData.image_mimetype = existing.image_mimetype || 'image/jpeg';
            }
        }
        const fields = Object.keys(updateData);
        if (fields.length === 0) {
            return res.status(400).json({ error: 'No update fields provided' });
        }
        const values = fields.map(f => updateData[f]);
        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const query = `UPDATE partners SET ${setClause} WHERE id = ?`;
        values.push(partnerId);

        console.log(`[PARTNER UPDATE] Updating partner ${partnerId}, fields:`, fields);
        console.log('[PARTNER UPDATE] Generated query:', query);
        try {
            console.log('[PARTNER UPDATE] Values preview:', values.map(v => (Buffer.isBuffer(v) ? `<Buffer ${v.length} bytes>` : (typeof v === 'string' && v.length > 100 ? v.slice(0, 100) + '...' : v))));
        } catch (logErr) {
            console.error('Error while logging update values preview:', logErr);
        }

        pool.query(query, values, (err, result) => {
            if (err) {
                console.error('Error updating partner:', err);
                return res.status(500).json({ error: err.message, stack: err.stack });
            }
            res.json({ success: true, message: 'Partner updated successfully' });
        });
    });
});

// Serve partner image from DB blob (from either image_data or image column)
app.get('/api/partners/:id/image', (req, res) => {
    const partnerId = req.params.id;
    pool.query('SELECT image_data, image_mimetype, image FROM partners WHERE id = ?', [partnerId], (err, results) => {
        if (err) {
            console.error('Error fetching partner image:', err);
            return res.status(500).json({ error: 'Failed to load image' });
        }
        if (!results || results.length === 0) return res.status(404).json({ error: 'Partner not found' });
        
        const r = results[0];
        let imageData = null;
        
        // Try image_data first (newer), fall back to image (legacy)
        if (r.image_data && r.image_data.length > 0) {
            imageData = r.image_data;
        } else if (r.image && r.image.length > 0) {
            imageData = r.image;
        }
        
        if (!imageData) {
            console.log(`[PARTNER IMAGE] No image found for partner ${partnerId}`);
            return res.status(404).json({ error: 'No image found' });
        }
        
        // Ensure we're working with a proper buffer
        const buf = Buffer.isBuffer(imageData) ? imageData : Buffer.from(imageData);
        const mime = r.image_mimetype || 'image/jpeg';
        
        console.log(`[PARTNER IMAGE] Serving image for partner ${partnerId}, size: ${buf.length}, mimetype: ${mime}`);
        
        res.setHeader('Content-Type', mime);
        res.setHeader('Content-Length', buf.length);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(buf);
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

// ===== AUTHORS CRUD =====
// Get all authors (public)
app.get("/api/authors", (req, res) => {
    pool.query("SELECT * FROM authors", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json({ data: results });
    });
});

// GET /api/advisors - Fetch all advisors
app.get('/api/advisors', (req, res) => {
    console.log('Fetching advisors from database...');
    const query = `
        SELECT *
        FROM advisors 
        ORDER BY area_of_focus, name
    `;
    pool.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching advisors:', err);
            try {
                require('fs').appendFileSync('advisors-error.log', `\n[${new Date().toISOString()}] QUERY: ${query}\nERROR: ${JSON.stringify(err)}\nCONNECTION STATE: ${JSON.stringify(pool.config)}\n`);
            } catch (logErr) {
                console.error('Failed to write to advisors-error.log:', logErr);
            }
            return res.status(500).json({ 
                error: 'Failed to fetch advisors',
                details: err.message,
                code: err.code || null,
                stack: err.stack || null
            });
        }
        // map blob rows to photo endpoint and remove binary fields
        const mapped = results.map(r => {
            const hasBlob = r.photo_data && r.photo_data.length > 0;
            const out = { ...r };
            delete out.photo_data;
            delete out.photo_mimetype;
            delete out.photo_name;
            if (hasBlob) {
                out.photo_url = `/api/advisors/${r.id}/photo`;
            }
            return out;
        });
        console.log(`Found ${mapped.length} advisors`);
        res.json(mapped);
    });
});

// GET /api/advisors/:id - Fetch a specific advisor by ID
app.get('/api/advisors/:id', (req, res) => {
    const advisorId = req.params.id;
    console.log(`Fetching advisor with ID: ${advisorId}`);
    const query = `
        SELECT *
        FROM advisors 
        WHERE id = ?
    `;
    pool.query(query, [advisorId], (err, results) => {
        if (err) {
            console.error('Error fetching advisor:', err);
            return res.status(500).json({ 
                error: 'Failed to fetch advisor',
                details: err.message 
            });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Advisor not found' });
        }
        const r = results[0];
        const out = { ...r };
        delete out.photo_data;
        delete out.photo_mimetype;
        delete out.photo_name;
        if (r.photo_data && r.photo_data.length > 0) {
            out.photo_url = `/api/advisors/${r.id}/photo`;
        }
        console.log(`Found advisor: ${r.name}`);
        res.json(out);
    });
});

// POST /api/advisors - Create a new advisor (admin/superadmin, with image upload)
app.post('/api/advisors', authenticateToken, requireAnyRole(["admin", "superadmin"]), upload.any(), (req, res) => {
    try {
        const { name, area_of_focus, bio, is_top_advisor } = req.body;
        if (!name || !area_of_focus || !bio) {
            return res.status(400).json({ error: 'Name, area_of_focus, and bio are required' });
        }
        let insertData = { name, area_of_focus, bio };
        if (is_top_advisor !== undefined && is_top_advisor !== null) {
            insertData.is_top_advisor = is_top_advisor;
        }
        let file = req.files && req.files.length > 0 ? req.files[0] : null;
        if (file) {
            insertData.photo_name = file.originalname || file.filename || null;
            insertData.photo_mimetype = file.mimetype || null;
            insertData.photo_data = file.buffer || null;
            insertData.photo_url = '';
        } else {
            insertData.photo_url = '';
        }
        const fields = Object.keys(insertData);
        const placeholders = fields.map(() => '?').join(', ');
        const query = `INSERT INTO advisors (${fields.join(', ')}) VALUES (${placeholders})`;
        pool.query(query, Object.values(insertData), (err, result) => {
            if (err) {
                console.error('Create advisor error:', err);
                return res.status(500).json({ error: 'Failed to create advisor', details: err.message });
            }
            const newId = result.insertId;
            if (file) {
                pool.query('UPDATE advisors SET photo_url = ? WHERE id = ?', [`/api/advisors/${newId}/photo`, newId], (uerr) => {
                    if (uerr) console.error('Failed to set photo_url after insert:', uerr);
                    return res.status(201).json({ success: true, id: newId, advisor: { ...insertData, photo_url: `/api/advisors/${newId}/photo`, id: newId } });
                });
            } else {
                res.status(201).json({ success: true, id: newId, advisor: { ...insertData, id: newId } });
            }
        });
    } catch (error) {
        console.error('Create advisor error:', error);
        res.status(500).json({ error: 'Failed to create advisor', details: error.message });
    }
});

// PUT /api/advisors/:id - Update an advisor (admin/superadmin, with image upload)
app.put('/api/advisors/:id', authenticateToken, requireAnyRole(["admin", "superadmin"]), upload.any(), (req, res) => {
    const advisorId = req.params.id;
    const { name, area_of_focus, bio, is_top_advisor } = req.body;
    pool.query('SELECT photo_url FROM advisors WHERE id = ?', [advisorId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!results || results.length === 0) return res.status(404).json({ error: 'Advisor not found' });
        let updateData = {};
        if (name !== undefined) updateData.name = name;
        if (area_of_focus !== undefined) updateData.area_of_focus = area_of_focus;
        if (bio !== undefined) updateData.bio = bio;
        if (is_top_advisor !== undefined && is_top_advisor !== null) updateData.is_top_advisor = is_top_advisor;
        let file = req.files && req.files.length > 0 ? req.files[0] : null;
        if (file) {
            updateData.photo_name = file.originalname || file.filename || null;
            updateData.photo_mimetype = file.mimetype || null;
            updateData.photo_data = file.buffer || null;
            updateData.photo_url = `/api/advisors/${advisorId}/photo`;
        } else {
            updateData.photo_url = results[0]?.photo_url || '';
        }
        const fields = Object.keys(updateData);
        const values = fields.map(f => updateData[f]);
        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const query = `UPDATE advisors SET ${setClause} WHERE id = ?`;
        values.push(advisorId);
        pool.query(query, values, (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Advisor updated successfully' });
        });
    });
});

// Serve advisor photo from DB blob or filesystem path
app.get('/api/advisors/:id/photo', (req, res) => {
    const advisorId = req.params.id;
    pool.query('SELECT photo_name, photo_mimetype, photo_data, photo_url FROM advisors WHERE id = ?', [advisorId], (err, results) => {
        if (err) {
            console.error('Error fetching advisor photo:', err);
            return res.status(500).json({ error: 'Failed to load photo' });
        }
        if (!results || results.length === 0) return res.status(404).json({ error: 'Advisor not found' });
        const r = results[0];
        const hasBlob = r.photo_data && r.photo_data.length > 0;
        console.log(`[ADVISOR PHOTO] request for ${advisorId} - hasBlob=${!!hasBlob} mimetype=${r.photo_mimetype} url=${r.photo_url}`);
        if (hasBlob) {
            const buf = Buffer.isBuffer(r.photo_data) ? r.photo_data : Buffer.from(r.photo_data);
            res.setHeader('Content-Type', r.photo_mimetype || 'image/jpeg');
            res.setHeader('Content-Length', buf.length);
            return res.send(buf);
        }
        if (r.photo_url && r.photo_url.startsWith('/images/')) {
            const filePath = path.join(__dirname, r.photo_url);
            return res.sendFile(filePath, (sendErr) => {
                if (sendErr) {
                    console.error('Failed to send file fallback:', sendErr);
                    res.status(500).end();
                }
            });
        }
        return res.status(404).json({ error: 'Photo not found' });
    });
});

// DELETE /api/advisors/:id - Delete an advisor (superadmin only)
app.delete('/api/advisors/:id', authenticateToken, requireRole('superadmin'), (req, res) => {
    pool.query('DELETE FROM advisors WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Advisor not found' });
        res.json({ success: true, message: 'Advisor deleted successfully' });
    });
});

// Get a single author by ID (public)
app.get("/api/authors/:id", (req, res) => {
    pool.query("SELECT * FROM authors WHERE id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (!results || results.length === 0) return res.status(404).json({ error: "Author not found" });
        res.json({ data: results[0] });
    });
});

// Add a new author (admin or superadmin)
app.post("/api/authors", authenticateToken, requireAnyRole(["admin", "superadmin"]), (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Author name required" });
    pool.query("INSERT INTO authors (name) VALUES (?)", [name], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: "Author already exists" });
            }
            return res.status(500).send(err);
        }
        res.status(201).json({ success: true, id: result.insertId, author: { id: result.insertId, name } });
    });
});

// Update an author (admin or superadmin)
app.put("/api/authors/:id", authenticateToken, requireAnyRole(["admin", "superadmin"]), (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Author name required" });
    pool.query("UPDATE authors SET name = ? WHERE id = ?", [name, req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Author not found" });
        res.json({ success: true, message: "Author updated successfully" });
    });
});

// Delete an author (superadmin only)
app.delete("/api/authors/:id", authenticateToken, requireRole("superadmin"), (req, res) => {
    pool.query("DELETE FROM authors WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Author not found" });
        res.json({ success: true, message: "Author deleted successfully" });
    });
});


// EVENTS CRUD - consolidated handlers that store images as DB blobs
// Get all events (public) - map blob rows to image endpoint and strip binary fields
app.get("/api/events", (req, res) => {
    pool.query("SELECT * FROM events", (err, results) => {
        if (err) return res.status(500).send(err);
        const mapped = results.map(r => {
            const hasBlob = r.image_data && r.image_data.length > 0;
            const out = { ...r };
            delete out.image_data;
            delete out.image_mimetype;
            delete out.image_name;
            if (hasBlob) {
                out.image_url = `/api/events/${r.id}/image`;
            }
            return out;
        });
        res.json(mapped);
    });
});

// Get single event (public) - strip blob fields and map image endpoint
app.get("/api/events/:id", (req, res) => {
    pool.query("SELECT * FROM events WHERE id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).json({ error: "Not found" });
        const r = results[0];
        const out = { ...r };
        delete out.image_data;
        delete out.image_mimetype;
        delete out.image_name;
        if (r.image_data && r.image_data.length > 0) {
            out.image_url = `/api/events/${r.id}/image`;
        }
        res.json(out);
    });
});

// Create a new event with optional image upload (multipart/form-data)
app.post("/api/events", authenticateToken, upload.any(), (req, res) => {
    try {
        console.log('--- Add Event Debug ---');
        console.log('req.body:', req.body);
        console.log('req.files:', req.files);
        const { title, description, event_date } = req.body;
        if (!title) return res.status(400).json({ error: 'Title required' });
        let insertData = { title, description, event_date };
        let file = req.files && req.files.length > 0 ? req.files[0] : null;
        if (file) {
            insertData.image_name = file.originalname || file.filename || null;
            insertData.image_mimetype = file.mimetype || null;
            insertData.image_data = file.buffer || null;
            insertData.image_url = '';
        } else {
            insertData.image_url = '';
        }
        const fields = Object.keys(insertData);
        const placeholders = fields.map(() => '?').join(', ');
        const query = `INSERT INTO events (${fields.join(', ')}) VALUES (${placeholders})`;
        pool.query(query, Object.values(insertData), (err, result) => {
            if (err) {
                console.error('Add event error:', err);
                return res.status(500).json({ success: false, message: 'Failed to add event', error: err.message });
            }
            const newId = result.insertId;
            if (file) {
                pool.query('UPDATE events SET image_url = ? WHERE id = ?', [`/api/events/${newId}/image`, newId], (uerr) => {
                    if (uerr) console.error('Failed to set image_url after insert:', uerr);
                    return res.status(201).json({
                        success: true,
                        message: 'Event added successfully',
                        id: newId,
                        event: { ...insertData, image_url: `/api/events/${newId}/image`, id: newId }
                    });
                });
            } else {
                res.status(201).json({ success: true, message: 'Event added successfully', id: newId, event: { ...insertData, id: newId } });
            }
        });
    } catch (error) {
        console.error('Add event error:', error);
        res.status(500).json({ success: false, message: 'Failed to add event', error: error.message });
    }
});

// Update an event, with optional image upload
app.put("/api/events/:id", authenticateToken, upload.any(), (req, res) => {
    const eventId = req.params.id;
    console.log('--- Edit Event Debug ---');
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);
    const { title, description, event_date } = req.body;
    // Get old image_url if no new image is uploaded
    pool.query('SELECT image_url FROM events WHERE id = ?', [eventId], (err, results) => {
        if (err) {
            console.error('Fetch old image_url error:', err);
            return res.status(500).json({ success: false, message: 'Failed to update event', error: err.message });
        }
        if (!results || results.length === 0) return res.status(404).json({ error: 'Event not found' });
        let updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (event_date !== undefined) updateData.event_date = event_date;
        let file = req.files && req.files.length > 0 ? req.files[0] : null;
        if (file) {
            updateData.image_name = file.originalname || file.filename || null;
            updateData.image_mimetype = file.mimetype || null;
            updateData.image_data = file.buffer || null;
            updateData.image_url = `/api/events/${eventId}/image`;
        } else {
            updateData.image_url = results[0]?.image_url || '';
        }
        const fields = Object.keys(updateData);
        const values = fields.map(f => updateData[f]);
        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const query = `UPDATE events SET ${setClause} WHERE id = ?`;
        values.push(eventId);
        console.log('Update query:', query);
        console.log('Update values:', values);
        pool.query(query, values, (err, result) => {
            if (err) {
                console.error('Update event error:', err);
                return res.status(500).json({ success: false, message: 'Failed to update event', error: err.message });
            }
            res.json({ success: true, message: 'Event updated successfully' });
        });
    });
});

// Serve event image from DB blob or filesystem path
app.get('/api/events/:id/image', (req, res) => {
    const eventId = req.params.id;
    pool.query('SELECT image_name, image_mimetype, image_data, image_url FROM events WHERE id = ?', [eventId], (err, results) => {
        if (err) {
            console.error('Error fetching event image:', err);
            return res.status(500).json({ error: 'Failed to load image' });
        }
        if (!results || results.length === 0) return res.status(404).json({ error: 'Event not found' });
        const r = results[0];
        const hasBlob = r.image_data && r.image_data.length > 0;
        console.log(`[EVENT IMAGE] request for event ${eventId} - hasBlob=${!!hasBlob} mimetype=${r.image_mimetype} url=${r.image_url}`);
        if (hasBlob) {
            const buf = Buffer.isBuffer(r.image_data) ? r.image_data : Buffer.from(r.image_data);
            res.setHeader('Content-Type', r.image_mimetype || 'image/jpeg');
            res.setHeader('Content-Length', buf.length);
            return res.send(buf);
        }
        if (r.image_url && r.image_url.startsWith('/images/')) {
            const filePath = path.join(__dirname, r.image_url);
            return res.sendFile(filePath, (sendErr) => {
                if (sendErr) {
                    console.error('Failed to send file fallback:', sendErr);
                    res.status(500).end();
                }
            });
        }
        return res.status(404).json({ error: 'Image not found' });
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
// Create event route (JSON, image_url is uploads table ID)

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
        const r = results[0];
        const out = { ...r };
        const id = r.id || 1;
        
        try {
            Object.keys(out).forEach(key => {
                const val = out[key];
                
                // Log all fields for debugging
                if (key === 'our_approach' || key === 'what_we_offer') {
                    console.log(`Processing ${key}: type=${typeof val}, isBuffer=${Buffer.isBuffer(val)}, length=${val ? (Buffer.isBuffer(val) ? val.length : String(val).length) : 'null'}`);
                }
                
                // Handle mysql2 Buffer instances
                if (Buffer.isBuffer(val)) {
                    // Check for image signatures first (PNG, JPEG, GIF, WebP)
                    const isImage = (buf) => {
                        if (buf.length < 4) return false;
                        const head = buf.slice(0, 12);
                        // PNG signature
                        if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4E && head[3] === 0x47) return true;
                        // JPEG signature
                        if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return true;
                        // GIF signature
                        if (head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46) return true;
                        // WebP signature
                        if (buf.length >= 12 && buf.slice(8, 12).toString('ascii') === 'WEBP') return true;
                        return false;
                    };
                    
                    if (isImage(val)) {
                        // Binary image data - replace with empty and provide URL
                        out[key] = '';
                        out[`${key}_url`] = `/api/about/${id}/image/${encodeURIComponent(key)}`;
                        console.log(`✅ Detected binary image in ${key} column, size=${val.length}`);
                        return;
                    }
                    
                    // Try to decode as UTF-8 text
                    try {
                        const text = val.toString('utf8').trim();
                        if (text.length > 0 && !text.startsWith('\x00')) {
                            out[key] = text;
                        } else {
                            out[key] = '';
                        }
                    } catch (e) {
                        out[key] = '';
                    }
                    return;
                }
                
                // Handle serialized Buffer objects
                if (val && typeof val === 'object' && val.type === 'Buffer' && Array.isArray(val.data)) {
                    try {
                        const buf = Buffer.from(val.data);
                        // Check for image signatures
                        const isImage = (b) => {
                            if (b.length < 4) return false;
                            const head = b.slice(0, 12);
                            if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4E && head[3] === 0x47) return true;
                            if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return true;
                            if (head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46) return true;
                            if (b.length >= 12 && b.slice(8, 12).toString('ascii') === 'WEBP') return true;
                            return false;
                        };
                        
                        if (isImage(buf)) {
                            out[key] = '';
                            out[`${key}_url`] = `/api/about/${id}/image/${encodeURIComponent(key)}`;
                            console.log(`Detected binary image in serialized ${key} column`);
                            return;
                        }
                        
                        const text = buf.toString('utf8').trim();
                        out[key] = text.length > 0 ? text : '';
                    } catch (e) {
                        out[key] = '';
                    }
                    return;
                }
            });
        } catch (e) {
            console.error('Error normalizing about row:', e);
        }

        console.log("About data fetched (normalized)");
        res.json(out);
    });
});

// Serve per-field about image from DB blob or filesystem path
app.get('/api/about/:id/image/:field', (req, res) => {
    try {
        const { id, field } = req.params;
        // Protect against injection by only allowing simple field names
        if (!/^[a-zA-Z0-9_]+$/.test(field)) {
            console.error('[IMAGE-FETCH] Invalid field name:', field);
            return res.status(400).json({ error: 'Invalid field' });
        }
        
        console.log(`[IMAGE-FETCH] Fetching image for about id=${id}, field=${field}`);
        
        // Query only the field column (mimetype column may not exist)
        const query = `SELECT \`${field}\` FROM about WHERE id = ?`;
        pool.query(query, [id], (err, results) => {
            try {
                if (err) {
                    console.error('[IMAGE-FETCH] Database error:', err.message);
                    return res.status(500).json({ error: 'Failed to load image', details: err.message });
                }
                
                if (!results || results.length === 0) {
                    console.warn(`[IMAGE-FETCH] No record found for about id=${id}`);
                    return res.status(404).json({ error: 'Not found' });
                }
                
                const row = results[0];
                const value = row[field];
                
                // Detect mimetype from binary data
                let mimetype = 'image/jpeg'; // default
                if (Buffer.isBuffer(value)) {
                    const head = value.slice(0, 12);
                    if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4E && head[3] === 0x47) {
                        mimetype = 'image/png';
                    } else if (value[0] === 0xFF && value[1] === 0xD8 && value[2] === 0xFF) {
                        mimetype = 'image/jpeg';
                    } else if (head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46) {
                        mimetype = 'image/gif';
                    } else if (value.length >= 12 && value.slice(8, 12).toString('ascii') === 'WEBP') {
                        mimetype = 'image/webp';
                    }
                }
                
                console.log(`[IMAGE-FETCH] Field ${field}: type=${typeof value}, isBuffer=${Buffer.isBuffer(value)}, detected mimetype=${mimetype}`);

                // If value is NULL or undefined
                if (!value) {
                    console.warn(`[IMAGE-FETCH] Field ${field} is empty/null`);
                    return res.status(404).json({ error: 'No image data' });
                }

                // If value is a Buffer-like object (binary image data)
                if (Buffer.isBuffer(value)) {
                    console.log(`[IMAGE-FETCH] ✅ Sending buffer, size=${value.length}, mimetype=${mimetype}`);
                    res.setHeader('Content-Type', mimetype);
                    res.setHeader('Content-Length', value.length);
                    res.setHeader('Cache-Control', 'public, max-age=3600');
                    return res.send(value);
                }

                // Handle serialized Buffer object
                if (value && typeof value === 'object' && value.type === 'Buffer' && Array.isArray(value.data)) {
                    try {
                        const buf = Buffer.from(value.data);
                        console.log(`[IMAGE-FETCH] ✅ Sending serialized buffer, size=${buf.length}, mimetype=${mimetype}`);
                        res.setHeader('Content-Type', mimetype);
                        res.setHeader('Content-Length', buf.length);
                        res.setHeader('Cache-Control', 'public, max-age=3600');
                        return res.send(buf);
                    } catch (e) {
                        console.error('[IMAGE-FETCH] Error processing serialized buffer:', e.message);
                        return res.status(500).json({ error: 'Invalid buffer data' });
                    }
                }

                // If it's a string (legacy filesystem path)
                if (typeof value === 'string' && value.length > 0 && value.startsWith('/images/')) {
                    console.log(`[IMAGE-FETCH] Fallback: serving from filesystem: ${value}`);
                    const filePath = path.join(__dirname, value);
                    return res.sendFile(filePath, (sendErr) => {
                        if (sendErr) {
                            console.error('[IMAGE-FETCH] File not found:', value);
                            return res.status(404).json({ error: 'File not found' });
                        }
                    });
                }

                console.warn(`[IMAGE-FETCH] Unexpected data type: ${typeof value}`);
                return res.status(404).json({ error: 'Image not found' });
            } catch (innerErr) {
                console.error('[IMAGE-FETCH] Inner error:', innerErr.message);
                return res.status(500).json({ error: 'Internal error' });
            }
        });
    } catch (outerErr) {
        console.error('[IMAGE-FETCH] Outer error:', outerErr.message);
        return res.status(500).json({ error: 'Internal error' });
    }
});

// Update about page data (admin/superadmin)
app.put("/api/about", authenticateToken, requireAnyRole(["admin", "superadmin"]), upload.any(), (req, res) => {
    pool.query("SELECT id FROM about LIMIT 1", (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!results || results.length === 0) {
            // If no row exists, create one
            const insertData = { ...req.body };
            const fields = Object.keys(insertData);
            const values = Object.values(insertData);
            const placeholders = fields.map(() => '?').join(', ');
            pool.query(`INSERT INTO about (${fields.join(', ')}) VALUES (${placeholders})`, values, (insertErr, insertResult) => {
                if (insertErr) {
                    return res.status(500).json({ error: insertErr.message });
                }
                res.json({ success: true, message: "About data created successfully" });
            });
        } else {
            // Update existing row
            const aboutId = results[0].id;
            let updateData = {};
            
            // Handle all fields from request body
            Object.keys(req.body).forEach(key => {
                if (req.body[key] !== undefined && req.body[key] !== null) {
                    updateData[key] = req.body[key];
                }
            });
            
            // Handle file uploads (for image columns)
            if (req.files && req.files.length > 0) {
                console.log(`[UPLOAD] Processing ${req.files.length} file(s)`);
                req.files.forEach(file => {
                    if (file.fieldname && file.buffer) {
                        console.log(`[UPLOAD] File: fieldname=${file.fieldname}, originalname=${file.originalname}, mimetype=${file.mimetype}, size=${file.buffer.length}`);
                        // Store image binary data directly in database BLOB column
                        updateData[file.fieldname] = file.buffer;
                        // Also store mimetype if a mimetype column exists
                        if (updateData[`${file.fieldname}_mimetype`] === undefined) {
                            updateData[`${file.fieldname}_mimetype`] = file.mimetype || 'image/jpeg';
                        }
                    }
                });
            }
            
            const fields = Object.keys(updateData);
            if (fields.length === 0) {
                return res.json({ success: true, message: "No changes to update" });
            }
            
            console.log(`[UPLOAD] Updating ${fields.length} fields:`, fields.filter(f => f.includes('approach') || f.includes('offer')));
            
            const values = fields.map(f => updateData[f]);
            const setClause = fields.map(f => `${f} = ?`).join(', ');
            const query = `UPDATE about SET ${setClause} WHERE id = ?`;
            values.push(aboutId);
            
            pool.query(query, values, (err, result) => {
                if (err) {
                    console.error('[UPLOAD] Update failed:', err);
                    return res.status(500).json({ error: err.message });
                }
                console.log('[UPLOAD] ✅ Update successful, rows affected:', result.affectedRows);
                res.json({ success: true, message: "About data updated successfully" });
            });
        }
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
        // Build photo_url for rows that have photo data or a path
        const mapped = results.map(r => {
            const hasBlob = r.photo_data && r.photo_data.length > 0;
            const hasPath = r.photo_url && r.photo_url !== '';
            // build output object without binary fields
            const out = { ...r };
            delete out.photo_data;
            delete out.photo_mimetype;
            delete out.photo_name;
            if (hasBlob) {
                out.photo_url = `/api/team/${r.id}/photo`;
            }
            // if hasPath and no blob, keep photo_url as-is
            return out;
        });
        res.json(mapped);
    });
});

// Get all projects (public)
app.get("/api/projects", (req, res) => {
    pool.query("SELECT * FROM projects", (err, results) => {
        if (err) return res.status(500).send(err);
        const mapped = results.map(r => {
            const hasBlob = r.image_data && r.image_data.length > 0;
            const out = { ...r };
            delete out.image_data;
            delete out.image_mimetype;
            delete out.image_name;
            if (hasBlob) {
                out.image_url = `/api/projects/${r.id}/image`;
            }
            return out;
        });
        res.json(mapped);
    });
});

// Get all articles (public)
app.get("/api/articles", (req, res) => {
    pool.query("SELECT * FROM articles", (err, results) => {
        if (err) return res.status(500).send(err);
        // map blob rows to article endpoint and remove binary fields
        const mapped = results.map(r => {
            const hasBlob = r.article && r.article.length > 0;
            const out = { ...r };
            delete out.article;
            delete out.article_mimetype;
            delete out.article_name;
            if (hasBlob) {
                out.article_url = `/api/articles/${r.id}/file`;
            }
            return out;
        });
        res.json(mapped);
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
// const analyticsKeyPath = path.join(__dirname, 'credentials/venturepoint-a96d5378194c.json');
// const analyticsKeyPath  = path.join(__dirname, 'credentials', 'venturepoint-a96d5378194c.json') // 
 const GA4_PROPERTY_ID = '505423261'; // <-- Replace with your actual property ID if needed


app.get('/api/admin/analytics', async (req, res) => {
    try {
        const credentials = JSON.parse(process.env.GA4_KEY_JSON);
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: 'https://www.googleapis.com/auth/analytics.readonly',
        });
        
        // const auth = new google.auth.GoogleAuth({
        //     keyFile: path.resolve(analyticsKeyPath),
        //     scopes: 'https://www.googleapis.com/auth/analytics.readonly',
        // });
        const analyticsData = google.analyticsdata({ version: 'v1beta', auth });

        const response = await analyticsData.properties.runReport({
            property: `properties/${process.env.GA4_PROPERTY_ID}`,
            requestBody: {
                dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
                metrics: [{ name: 'sessions' }],
                dimensions: [{ name: 'date' }],
            },
        });

        // Debug log
        console.log('GA4 API response:', response.data);
        //console.log('Using key file path:', analyticsKeyPath);
        if (response && response.data) {
            res.json({
                ...response.data,
                rows: response.data.rows || []
            });
        } else {
            res.json({ rows: [] });
        }
    } catch (error) {

        console.error('🔥 Google Analytics API Error 🔥');
        console.error('Message:', error.message);
        console.error('Code:', error.code);
        console.error('Stack:', error.stack);
        console.error('Error stack:', error.stack);

        if (error.response && error.response.data) {
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        }

        res.status(500).json({ error: 'Failed to fetch analytics data', details: error.message });


    //     // Enhanced error logging for debugging
    //     if (error && error.response && error.response.data) {
    //         console.error('Analytics API error response:', error.response.data);
    //     } else {
    //         console.error('Analytics API error:', error);
    //     }
    //    // res.status(500).json({ error: 'Failed to fetch analytics data' });

    //     console.error("Full analytics error:", error.response?.data || error.message || error);
    //     res.status(500).json({ error: error.response?.data || error.message || 'Unknown error' });

    }
});
//app.use('/api', analyticsRouter);

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
        const insertData = { name, role, bio };
        if (file) {
            // multer memoryStorage buffer exists at file.buffer
            insertData.photo_name = file.originalname || file.filename || null;
            insertData.photo_mimetype = file.mimetype || null;
            insertData.photo_data = file.buffer || null;
            // photo_url will be set after insert as endpoint
            insertData.photo_url = '';
        } else {
            insertData.photo_url = '';
        }
        const fields = Object.keys(insertData);
        const placeholders = fields.map(() => '?').join(', ');
        const query = `INSERT INTO team_members (${fields.join(', ')}) VALUES (${placeholders})`;
        pool.query(query, Object.values(insertData), (err, result) => {
            if (err) {
                console.error('Add member error:', err);
                return res.status(500).json({ success: false, message: 'Failed to add member', error: err.message });
            }
            const newId = result.insertId;
            if (file) {
                // update photo_url to the photo endpoint
                pool.query('UPDATE team_members SET photo_url = ? WHERE id = ?', [`/api/team/${newId}/photo`, newId], (uerr) => {
                    if (uerr) console.error('Failed to set photo_url after insert:', uerr);
                    // respond with member including photo_url endpoint
                    res.status(201).json({
                        success: true,
                        message: 'Member added successfully',
                        id: newId,
                        member: {
                            ...insertData,
                            photo_url: `/api/team/${newId}/photo`,
                            id: newId
                        }
                    });
                });
            } else {
                res.status(201).json({ 
                    success: true, 
                    message: 'Member added successfully', 
                    id: newId, 
                    member: { 
                        ...insertData, 
                        id: newId 
                    } 
                });
            }
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
            updateData.photo_name = file.originalname || file.filename || null;
            updateData.photo_mimetype = file.mimetype || null;
            updateData.photo_data = file.buffer || null;
            updateData.photo_url = `/api/team/${memberId}/photo`;
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

// Serve team member photo from DB blob or filesystem path
app.get('/api/team/:id/photo', (req, res) => {
    const memberId = req.params.id;
    pool.query('SELECT photo_name, photo_mimetype, photo_data, photo_url FROM team_members WHERE id = ?', [memberId], (err, results) => {
        if (err) {
            console.error('Error fetching member photo:', err);
            return res.status(500).json({ error: 'Failed to load photo' });
        }
        if (!results || results.length === 0) return res.status(404).json({ error: 'Member not found' });
        const r = results[0];
        const hasBlob = r.photo_data && r.photo_data.length > 0;
        console.log(`[PHOTO] request for member ${memberId} - hasBlob=${!!hasBlob} mimetype=${r.photo_mimetype} url=${r.photo_url}`);
        if (hasBlob) {
            const buf = Buffer.isBuffer(r.photo_data) ? r.photo_data : Buffer.from(r.photo_data);
            console.log(`[PHOTO] sending buffer for member ${memberId}, length=${buf.length}`);
            res.setHeader('Content-Type', r.photo_mimetype || 'image/jpeg');
            res.setHeader('Content-Length', buf.length);
            return res.send(buf);
        }
        // Fallback to filesystem path if exists
        if (r.photo_url && r.photo_url.startsWith('/images/')) {
            const filePath = path.join(__dirname, r.photo_url);
            return res.sendFile(filePath, (sendErr) => {
                if (sendErr) {
                    console.error('Failed to send file fallback:', sendErr);
                    res.status(500).end();
                }
            });
        }
        return res.status(404).json({ error: 'Photo not found' });
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
            insertData.image_name = file.originalname || file.filename || null;
            insertData.image_mimetype = file.mimetype || null;
            insertData.image_data = file.buffer || null;
            insertData.image_url = '';
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
            const newId = result.insertId;
            if (file) {
                pool.query('UPDATE projects SET image_url = ? WHERE id = ?', [`/api/projects/${newId}/image`, newId], (uerr) => {
                    if (uerr) console.error('Failed to set image_url after insert:', uerr);
                    return res.status(201).json({
                        success: true,
                        message: 'Project added successfully',
                        id: newId,
                        project: {
                            ...insertData,
                            image_url: `/api/projects/${newId}/image`,
                            id: newId
                        }
                    });
                });
            } else {
                res.status(201).json({ 
                    success: true, 
                    message: 'Project added successfully', 
                    id: newId, 
                    project: { 
                        ...insertData, 
                        id: newId 
                    } 
                });
            }
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
            updateData.image_name = file.originalname || file.filename || null;
            updateData.image_mimetype = file.mimetype || null;
            updateData.image_data = file.buffer || null;
            updateData.image_url = `/api/projects/${projectId}/image`;
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

// Serve project image from DB blob or filesystem path
app.get('/api/projects/:id/image', (req, res) => {
    const projectId = req.params.id;
    pool.query('SELECT image_name, image_mimetype, image_data, image_url FROM projects WHERE id = ?', [projectId], (err, results) => {
        if (err) {
            console.error('Error fetching project image:', err);
            return res.status(500).json({ error: 'Failed to load image' });
        }
        if (!results || results.length === 0) return res.status(404).json({ error: 'Project not found' });
        const r = results[0];
        const hasBlob = r.image_data && r.image_data.length > 0;
        console.log(`[PROJECT IMAGE] request for project ${projectId} - hasBlob=${!!hasBlob} mimetype=${r.image_mimetype} url=${r.image_url}`);
        if (hasBlob) {
            const buf = Buffer.isBuffer(r.image_data) ? r.image_data : Buffer.from(r.image_data);
            res.setHeader('Content-Type', r.image_mimetype || 'image/jpeg');
            res.setHeader('Content-Length', buf.length);
            return res.send(buf);
        }
        if (r.image_url && r.image_url.startsWith('/images/')) {
            const filePath = path.join(__dirname, r.image_url);
            return res.sendFile(filePath, (sendErr) => {
                if (sendErr) {
                    console.error('Failed to send file fallback:', sendErr);
                    res.status(500).end();
                }
            });
        }
        return res.status(404).json({ error: 'Image not found' });
    });
});

// ARTICLES CRUD
app.get("/api/articles/:id", (req, res) => {
    pool.query("SELECT * FROM articles WHERE id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).json({ error: "Not found" });
        const r = results[0];
        const out = { ...r };
        // Remove binary fields and provide a file endpoint if blob exists
        delete out.article;
        delete out.article_mimetype;
        delete out.article_name;
        if (r.article && r.article.length > 0) {
            out.article_url = `/api/articles/${r.id}/file`;
        }
        res.json(out);
    });
});

app.post("/api/articles", authenticateToken, upload.single('article_pdf'), (req, res) => {
    try {
        const { title, content, author_name, created_at } = req.body;
        const insertData = {
            title,
            content,
            author_name,
            created_at
        };

        if (req.file) {
            insertData.article = req.file.buffer || null;
            insertData.article_mimetype = req.file.mimetype || null;
            insertData.article_name = req.file.originalname || req.file.filename || `article_${Date.now()}`;
            // article_url will be set after insert to point to file endpoint
        } else {
            insertData.article_url = '';
        }

        pool.query("INSERT INTO articles SET ?", insertData, (err, result) => {
            if (err) {
                console.error('Create article DB error:', err);
                return res.status(500).json({ success: false, message: 'Failed to create article', error: err.message });
            }
            const newId = result.insertId;
            if (req.file) {
                pool.query('UPDATE articles SET article_url = ? WHERE id = ?', [`/api/articles/${newId}/file`, newId], (uerr) => {
                    if (uerr) console.error('Failed to set article_url after insert:', uerr);
                    return res.status(201).json({ success: true, id: newId });
                });
            } else {
                return res.status(201).json({ success: true, id: newId });
            }
        });
    } catch (error) {
        console.error('Create article error:', error);
        res.status(500).json({ success: false, message: 'Failed to create article', error: error.message });
    }
});

app.put("/api/articles/:id", authenticateToken, upload.single('article_pdf'), (req, res) => {
    const { title, content, author_name, created_at } = req.body;
    const updateFields = {
        title,
        content,
        author_name,
        created_at
    };
    try {
        if (req.file) {
            // Store uploaded file buffer and metadata so downloads work correctly
            updateFields.article = req.file.buffer; // file buffer -> longblob
            updateFields.article_mimetype = req.file.mimetype || null;
            updateFields.article_name = req.file.originalname || req.file.filename || `article_${Date.now()}`;
            // Ensure article_url points to the file endpoint for this article
            updateFields.article_url = `/api/articles/${req.params.id}/file`;
        }

        // Debug logging for update operation
        try {
            console.log(`[EDIT ARTICLE] id=${req.params.id} user=${req.user?.username || req.user?.id || 'unknown'} filePresent=${!!req.file}`);
            if (req.file) {
                console.log(`[EDIT ARTICLE] uploaded file: originalname=${req.file.originalname} mimetype=${req.file.mimetype} size=${req.file.size}`);
            }
            // Log updateFields keys and whether article is a buffer
            const fieldSummary = Object.keys(updateFields).reduce((acc, k) => {
                if (k === 'article' && updateFields.article) {
                    acc[k] = Buffer.isBuffer(updateFields.article) ? `Buffer(${updateFields.article.length})` : typeof updateFields.article;
                } else {
                    acc[k] = updateFields[k] === undefined ? 'undefined' : (updateFields[k] === '' ? "''" : String(updateFields[k]).slice(0, 60));
                }
                return acc;
            }, {});
            console.log('[EDIT ARTICLE] updateFields summary:', fieldSummary);
        } catch (logErr) {
            console.error('Failed to log edit-article debug info:', logErr);
        }

        pool.query("UPDATE articles SET ? WHERE id = ?", [updateFields, req.params.id], (err, result) => {
            if (err) {
                console.error('DB error updating article id=' + req.params.id + ':', err);
                // Do not dump binary data into logs
                return res.status(500).json({ success: false, message: 'Database error while updating article', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
            }
            res.json({ success: true });
        });
    } catch (err) {
        console.error('Unexpected error in PUT /api/articles/:id', err);
        return res.status(500).json({ success: false, message: 'Unexpected server error', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
    }
});

app.delete("/api/articles/:id", authenticateToken, requireRole("superadmin"), (req, res) => {
    pool.query("DELETE FROM articles WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

// Serve article file (PDF or other) from DB blob or filesystem path
app.get('/api/articles/:id/file', (req, res) => {
    const articleId = req.params.id;
    pool.query('SELECT article, article_mimetype, article_name, article_url FROM articles WHERE id = ?', [articleId], (err, results) => {
        if (err) {
            console.error('Error fetching article file:', err);
            return res.status(500).json({ error: 'Failed to load article file' });
        }
        if (!results || results.length === 0) return res.status(404).json({ error: 'Article not found' });
        const r = results[0];
        const hasBlob = r.article && r.article.length > 0;
        console.log(`[ARTICLE FILE] request for article ${articleId} - hasBlob=${!!hasBlob} mimetype=${r.article_mimetype} url=${r.article_url}`);
        if (hasBlob) {
            const buf = Buffer.isBuffer(r.article) ? r.article : Buffer.from(r.article);
            // Debug logging for content served
            try {
                console.log(`[ARTICLE FILE] serving buffer: isBuffer=${Buffer.isBuffer(r.article)} length=${buf.length}`);
            } catch (logErr) {
                console.error('Error logging article buffer info:', logErr);
            }
            // Set headers for download with original filename if available
            res.setHeader('Content-Type', r.article_mimetype || 'application/pdf');
            if (r.article_name) res.setHeader('Content-Disposition', `attachment; filename="${r.article_name}"`);
            res.setHeader('Content-Length', buf.length);
            return res.send(buf);
        }
        // Fallback: if article_url points to a filesystem path
        if (r.article_url && r.article_url.startsWith('/images/')) {
            const filePath = path.join(__dirname, r.article_url);
            return res.sendFile(filePath, (sendErr) => {
                if (sendErr) {
                    console.error('Failed to send article file fallback:', sendErr);
                    res.status(500).end();
                }
            });
        }
        return res.status(404).json({ error: 'Article file not found' });
    });
});

// Debug endpoint: return metadata and a small head preview of the stored blob
app.get('/api/articles/:id/file-info', (req, res) => {
    const articleId = req.params.id;
    pool.query('SELECT article, article_mimetype, article_name FROM articles WHERE id = ?', [articleId], (err, results) => {
        if (err) {
            console.error('Error fetching article file info:', err);
            return res.status(500).json({ error: 'Failed to load article file info' });
        }
        if (!results || results.length === 0) return res.status(404).json({ error: 'Article not found' });
        const r = results[0];
        const hasBlob = r.article && r.article.length > 0;
        if (!hasBlob) return res.json({ hasBlob: false });
        const buf = Buffer.isBuffer(r.article) ? r.article : Buffer.from(r.article);
        // Prepare small previews
        const head = buf.slice(0, 64);
        const headHex = head.toString('hex');
        const headBase64 = head.toString('base64');
        return res.json({
            hasBlob: true,
            article_name: r.article_name || null,
            article_mimetype: r.article_mimetype || null,
            length: buf.length,
            head_hex: headHex,
            head_base64: headBase64
        });
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
            } else if (req.body && (req.body.remove_image === '1' || req.body.remove_image === 'true' || req.body.remove_image === 'yes')) {
                // Client requested removal of current image
                updateData.image_url = '';
                // If your schema stores blobs, clear them too
                updateData.image_data = null;
                updateData.image_mimetype = '';
                updateData.image_name = '';
            } else {
                // Keep existing image_url (remove any leading slash for consistency)
                let oldUrl = results[0]?.image_url || '';
                if (oldUrl && oldUrl.startsWith('/')) oldUrl = oldUrl.substring(1);
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
