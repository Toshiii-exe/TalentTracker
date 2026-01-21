const express = require('express');
const router = express.Router();
const db = require('../db');
const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// Verify email configuration on startup
// Verify email configuration on startup (Commented out to prevent errors if not configured)
/*
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ EMAIL SERVER ERROR:", error.message);
        console.log("Check if EMAIL_USER and EMAIL_PASS are correct in your .env file.");
    } else {
        console.log("✅ Email server is ready to send notifications.");
    }
});
*/

// Get all events
router.get('/', async (req, res) => {
    try {
        const [events] = await db.query('SELECT * FROM events ORDER BY event_date DESC');
        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching events' });
    }
});

// Get single event
router.get('/:id', async (req, res) => {
    try {
        const [events] = await db.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
        if (events.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json(events[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching event' });
    }
});

// Create event (Admin only)
router.post('/', async (req, res) => {
    const {
        title, description, event_date, event_time, venue, city, category,
        eligibility, rules, requirements, registration_deadline, max_participants,
        contact_email, contact_phone, image_url, created_by
    } = req.body;

    try {
        const [result] = await db.query(
            `INSERT INTO events (title, description, event_date, event_time, venue, city, category,
             eligibility, rules, requirements, registration_deadline, max_participants,
             contact_email, contact_phone, image_url, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description, event_date, event_time, venue, city, category,
                eligibility, rules, requirements, registration_deadline, max_participants,
                contact_email, contact_phone, image_url, created_by]
        );

        const eventId = result.insertId;

        // --- NOTIFICATION LOGIC ---
        // 1. Find athletes in the same category AND getting their specific events
        // We join specific registered events to see if they match the new event title
        const [athletesWithEvents] = await db.query(
            `SELECT a.user_id, a.full_name, ae.event_name 
                 FROM athletes a 
                 JOIN athlete_events ae ON a.user_id = ae.athlete_id
                 WHERE a.category = ?`,
            [category]
        );

        // 2. Filter: Only notify if the athlete's registered event (e.g. "200m") 
        // is found in the new Event's Title or Description.
        const notifiedUserIds = new Set();

        // Normalize event text for comparison (lowercase)
        const newEventText = (title + ' ' + (description || '')).toLowerCase();

        for (const record of athletesWithEvents) {
            if (!record.event_name) continue;

            // Normalize athlete's event name (e.g. "200m", "Long Jump")
            const athleteEvent = record.event_name.toLowerCase().trim();

            // Check if the specific event name exists in the posted event title/description
            // Example: Athlete has "200m". Posted Event is "Annual 200m Sprint". -> MATCH.
            if (athleteEvent.length > 0 && newEventText.includes(athleteEvent)) {
                notifiedUserIds.add(record.user_id);
            }
        }

        if (notifiedUserIds.size > 0) {
            const notificationValues = Array.from(notifiedUserIds).map(uid => [
                uid,
                `New Event Alert: A new event matching your sport (${title}) has been posted for ${category}!`,
                'event',
                eventId
            ]);

            await db.query(
                'INSERT INTO notifications (user_id, message, type, related_id) VALUES ?',
                [notificationValues]
            );
        }

        // --- END NOTIFICATION LOGIC ---

        // Respond immediately so the UI doesn't hang
        res.json({ message: 'Event created successfully', eventId: eventId });
    } catch (error) {
        console.error("CREATE EVENT ERROR:", error);
        res.status(500).json({ error: 'Error creating event: ' + error.message });
    }
});

// Update event (Admin only)
router.put('/:id', async (req, res) => {
    const {
        title, description, event_date, event_time, venue, city, category,
        eligibility, rules, requirements, registration_deadline, max_participants,
        contact_email, contact_phone, image_url, status
    } = req.body;

    try {
        await db.query(
            `UPDATE events SET title = ?, description = ?, event_date = ?, event_time = ?,
             venue = ?, city = ?, category = ?, eligibility = ?, rules = ?, requirements = ?,
             registration_deadline = ?, max_participants = ?, contact_email = ?, contact_phone = ?,
             image_url = ?, status = ? WHERE id = ?`,
            [title, description, event_date, event_time, venue, city, category,
                eligibility, rules, requirements, registration_deadline, max_participants,
                contact_email, contact_phone, image_url, status, req.params.id]
        );

        res.json({ message: 'Event updated successfully' });
    } catch (error) {
        console.error("UPDATE EVENT ERROR:", error);
        res.status(500).json({ error: 'Error updating event: ' + error.message });
    }
});

// Delete event (Admin only)
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM events WHERE id = ?', [req.params.id]);
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting event' });
    }
});

// Register for event (Athletes only)
router.post('/:id/register', async (req, res) => {
    const { athlete_id } = req.body;

    try {
        await db.query(
            'INSERT INTO event_registrations (event_id, athlete_id) VALUES (?, ?)',
            [req.params.id, athlete_id]
        );

        res.json({ message: 'Successfully registered for event' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Already registered for this event' });
        }
        console.error("REGISTER EVENT ERROR:", error);
        res.status(500).json({ error: 'Error registering for event: ' + error.message });
    }
});

// Get athlete's registered events
router.get('/athlete/:athleteId/registrations', async (req, res) => {
    try {
        const [registrations] = await db.query(
            `SELECT e.*, er.registered_at, er.status as registration_status
             FROM event_registrations er
             JOIN events e ON er.event_id = e.id
             WHERE er.athlete_id = ?
             ORDER BY e.event_date DESC`,
            [req.params.athleteId]
        );
        res.json(registrations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching registrations' });
    }
});

module.exports = router;
