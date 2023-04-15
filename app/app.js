const express = require('express');
const mysql = require('mysql');

const app = express();

// Database connection settings for Node 1 (Central Node)
const centralNodeConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'central_node_database',
});

// Database connection settings for Node 2
const node2Connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'node2_database',
});

// Database connection settings for Node 3
const node3Connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'node3_database',
});

// Define the routes for the web application

// Route for getting all movies from the central node
app.get('/movies', (req, res) => {
  centralNodeConnection.query('SELECT * FROM movies', (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).send('Error retrieving movies from database');
    }

    res.json(results);
  });
});

// Route for simulating transactions
app.post('/transactions', (req, res) => {
  // TODO: Implement transaction logic here
});

// Route for setting isolation level
app.post('/isolation-level', (req, res) => {
  // TODO: Implement isolation level logic here
});

// Start the server
const port = 3000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
