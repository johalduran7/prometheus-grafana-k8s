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

app.get('/', async (req, res) => {
    let people = [];
    try {
        const result = await client.query('SELECT * FROM people ORDER BY id DESC');
        people = result.rows;
    } catch (err) {
        console.error('Error retrieving data:', err);
    }

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
                    justify-content: flex-start;
                    height: 100vh;
                    margin: 0;
                    padding: 20px;
                    box-sizing: border-box;
                }
                form {
                    background-color: #003366;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
                    margin-bottom: 20px;
                    width: 100%;
                    max-width: 400px;
                }
                input, button {
                    margin: 5px 0;
                    padding: 10px;
                    width: calc(100% - 20px);
                    box-sizing: border-box;
                }
                button {
                    background-color: #007bff;
                    border: none;
                    color: white;
                    cursor: pointer;
                }
                table {
                    width: 100%;
                    max-width: 600px;
                    border-collapse: collapse;
                    margin-top: 10px;
                }
                th, td {
                    padding: 10px;
                    border: 1px solid #ccc;
                    text-align: left;
                    background-color: #004080;
                }
                th {
                    background-color: #0056b3;
                }
                .success {
                    background-color: #28a745;
                    padding: 10px;
                    border-radius: 5px;
                    color: white;
                    margin-bottom: 10px;
                }
            </style>
        </head>
        <body>
            <h1>🚀 John Durán's K8s-App Demo</h1>
            
            ${req.query.success ? `<div class="success">✅ Information stored successfully!</div>` : ''}

            <form action="/submit" method="POST">
                <input type="text" name="name" placeholder="Name" required />
                <input type="text" name="phone" placeholder="Phone" required />
                <input type="email" name="email" placeholder="Email" required />
                <button type="submit">Submit</button>
            </form>

            <h2>📋 Stored People:</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                    </tr>
                </thead>
                <tbody>
                    ${people.map(p => `
                        <tr>
                            <td>${p.id}</td>
                            <td>${p.name}</td>
                            <td>${p.phone}</td>
                            <td>${p.email}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
    `);
});

app.post('/submit', async (req, res) => {
    const { name, phone, email } = req.body;

    try {
        await client.query(
            'INSERT INTO people (name, phone, email) VALUES ($1, $2, $3)',
            [name, phone, email]
        );
        res.redirect('/?success=1');
    } catch (err) {
        console.error('Error storing data:', err);
        res.status(500).send('❌ Failed to store information.');
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 App running on port ${PORT}`));
