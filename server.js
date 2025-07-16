const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({limit: '50mb'}));

// In-memory storage (resets on each deployment)
let dataStorage = {};

app.get('/', (req, res) => {
    res.json({
        message: 'Roblox DataStore Transfer Server Running',
        status: 'online',
        dataKeys: Object.keys(dataStorage).length
    });
});

app.post('/export', (req, res) => {
    console.log('Received export data');
    dataStorage = req.body;
    res.json({
        success: true, 
        message: 'Data exported successfully',
        keyCount: Object.keys(req.body).length
    });
});

app.get('/import', (req, res) => {
    console.log('Sending import data');
    res.json(dataStorage);
});

app.post('/clear', (req, res) => {
    dataStorage = {};
    res.json({success: true, message: 'Data cleared'});
});

// Export the Express app
module.exports = app;
