const express = require('express');
const { Client } = require('pg');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const client = new Client({
    host: process.env.PGHOST || 'localhost',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'password',
    database: process.env.PGDATABASE || 'people',
    port: process.env.PGPORT || 5432,
});


client.connect()
    .then(async () => {
        console.log('Connected to Postgres');

        // Create table if it doesn't exist
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS people (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                phone VARCHAR(20),
                email VARCHAR(100)
            )
        `;
        await client.query(createTableQuery);
        console.log('Ensured table "people" exists');

    })
    .catch(err => {
        console.error('Failed to connect to Postgres:', err);
        process.exit(1);
    });

// Serve homepage - dark blue with a basic form
app.get('/', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>K8s-App Demo</title>
            <style>
                body {
                    background-color: #001f3f;
                    color: white;
                    font-family: Arial, sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                }
                form {
                    background-color: #003366;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
                }
                input {
                    margin: 5px 0;
                    padding: 8px;
                    width: 100%;
                }
                button {
                    margin-top: 10px;
                    padding: 10px 15px;
                    background-color: #007bff;
                    border: none;
                    color: white;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <h1>John Durán's K8s-App Demo</h1>
            <form action="/submit" method="POST">
                <input type="text" name="name" placeholder="Name" required />
                <input type="text" name="phone" placeholder="Phone" required />
                <input type="email" name="email" placeholder="Email" required />
                <button type="submit">Submit</button>
            </form>
        </body>
        </html>
    `);
});

// Handle form submission
app.post('/submit', async (req, res) => {
    const { name, phone, email } = req.body;

    try {
        await client.query(
            'INSERT INTO people (name, phone, email) VALUES ($1, $2, $3)',
            [name, phone, email]
        );
        res.send('Information stored successfully.');
    } catch (err) {
        console.error('Error storing data:', err);
        res.status(500).send('Failed to store information.');
    }
});

// Endpoint to retrieve all people (for testing)
app.get('/people', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM people');
        res.json(result.rows);
    } catch (err) {
        console.error('Error retrieving data:', err);
        res.status(500).send('Failed to retrieve data.');
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`App running on port ${PORT}`));
