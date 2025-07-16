const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// In-memory storage (use a database for production)
let transferData = {};

// Export endpoint - receives data from Game A
app.post('/export', (req, res) => {
    try {
        const { userId, data, gameId } = req.body;
        
        // Validate required fields
        if (!userId || !data) {
            return res.status(400).json({ error: 'userId and data are required' });
        }
        
        // Store the data with timestamp
        transferData[userId] = {
            data: data,
            timestamp: Date.now(),
            gameId: gameId || 'unknown'
        };
        
        console.log(`Data exported for user ${userId}`);
        res.json({ success: true, message: 'Data exported successfully' });
        
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Import endpoint - sends data to Game B
app.get('/import/:userId', (req, res) => {
    try {
        const userId = req.params.userId;
        
        if (!transferData[userId]) {
            return res.status(404).json({ error: 'No data found for this user' });
        }
        
        const userData = transferData[userId];
        
        // Optional: Check if data is too old (24 hours)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        if (Date.now() - userData.timestamp > maxAge) {
            delete transferData[userId];
            return res.status(410).json({ error: 'Data has expired' });
        }
        
        console.log(`Data imported for user ${userId}`);
        res.json({
            success: true,
            data: userData.data,
            timestamp: userData.timestamp
        });
        
        // Optional: Remove data after successful import
        // delete transferData[userId];
        
    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// List all pending transfers (admin endpoint)
app.get('/admin/pending', (req, res) => {
    const pending = Object.keys(transferData).map(userId => ({
        userId,
        timestamp: transferData[userId].timestamp,
        gameId: transferData[userId].gameId
    }));
    
    res.json({ pending });
});

// Clear expired data (admin endpoint)
app.post('/admin/cleanup', (req, res) => {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();
    let cleaned = 0;
    
    for (const userId in transferData) {
        if (now - transferData[userId].timestamp > maxAge) {
            delete transferData[userId];
            cleaned++;
        }
    }
    
    res.json({ message: `Cleaned ${cleaned} expired entries` });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: Date.now() });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'Roblox Datastore Transfer Server',
        endpoints: {
            export: 'POST /export',
            import: 'GET /import/:userId',
            health: 'GET /health',
            pending: 'GET /admin/pending',
            cleanup: 'POST /admin/cleanup'
        }
    });
});

app.listen(port, () => {
    console.log(`Roblox datastore transfer server running on port ${port}`);
    console.log(`Export endpoint: POST /export`);
    console.log(`Import endpoint: GET /import/:userId`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Server shutting down...');
    process.exit(0);
});
