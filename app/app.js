const express = require('express');
const multer = require('multer');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

// PostgreSQL connection setup
const client = new Client({
    host: 'postgres-service',  // K8s Service DNS name
    user: 'postgres',
    password: 'password',
    database: 'images'
});

client.connect().then(() => {
    console.log('Connected to Postgres');
}).catch(err => {
    console.error('Failed to connect to Postgres:', err);
    process.exit(1);
});

// Serve homepage - just dark blue background and title at the top
app.get('/', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>K8s-App Demo</title>
            <style>
                body {
                    background-color: #001f3f;  /* Dark blue */
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    height: 100vh;
                    color: white;
                    font-family: Arial, sans-serif;
                }
                h1 {
                    margin-top: 50px;
                }
            </style>
        </head>
        <body>
            <h1>John Durán's K8s-App demo</h1>
        </body>
        </html>
    `);
});

// Upload image endpoint
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const name = req.body.name;
        const image = fs.readFileSync(req.file.path);

        await client.query('INSERT INTO images (name, image) VALUES ($1, $2)', [name, image]);

        res.send('Image stored successfully.');
    } catch (err) {
        console.error('Error storing image:', err);
        res.status(500).send('Failed to store image.');
    }
});

// Retrieve image endpoint
app.get('/image', async (req, res) => {
    const name = req.query.name;

    try {
        const result = await client.query('SELECT image FROM images WHERE name = $1', [name]);

        if (result.rows.length > 0) {
            res.writeHead(200, { 'Content-Type': 'image/jpeg' });
            res.end(result.rows[0].image);
        } else {
            res.status(404).send('Image not found');
        }
    } catch (err) {
        console.error('Error retrieving image:', err);
        res.status(500).send('Failed to retrieve image.');
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`App running on port ${PORT}`);
});
