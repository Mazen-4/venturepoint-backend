const express = require('express');
const { google } = require('googleapis');
const path = require('path');
const router = express.Router();
const db = require('../server.js');

// Path to your service account key
const KEYFILEPATH = path.join(__dirname, '../credentials/venturepoint-042379c47b7f.json');
// Your GA4 property ID
const PROPERTY_ID = '505423261'; // <-- Replace with your actual property ID

router.get('/admin/analytics', async (req, res) => {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: KEYFILEPATH,
      scopes: 'https://www.googleapis.com/auth/analytics.readonly',
    });
    const analyticsData = google.analyticsdata({ version: 'v1beta', auth });

    // Example: Get sessions by date for last 7 days
      const response = await analyticsData.properties.runReport({
        property: `properties/${PROPERTY_ID}`,
        requestBody: {
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          metrics: [{ name: 'sessions' }],
          dimensions: [{ name: 'date' }],
        },
      });

      // Debug log
      console.log('GA4 API response:', response);
      // Always return a valid rows array for frontend chart
      if (response && response.data) {
        res.json({
          ...response.data,
          rows: response.data.rows || []
        });
      } else {
        res.json({ rows: [] });
      }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

module.exports = router;
