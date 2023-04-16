const express = require('express');
const mysql = require('mysql2');
const app = express();
app.set('view engine', 'ejs');

// Database connection settings for Node 1 (Central Node)
const centralNodeConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12345',
  database: 'central_node_database',
});

// Database connection settings for Node 2
const node2Connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12345',
  database: 'node2_database',
});

// Database connection settings for Node 3
const node3Connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12345',
  database: 'node3_database',
});


// Route for getting all movies from the central node
app.get('/movies', (req, res) => {
  centralNodeConnection.query('SELECT name, year FROM movies_test_2 LIMIT 5', (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).send('Error retrieving movies from database');
    }
    res.render('results', { movies: results });
  } );
});

// Route for updating a movie
app.put('/movies/93', (req, res) => {
  const movieId = 93;
  centralNodeConnection.query(
    'UPDATE movies_test_2 SET name = "courier" WHERE id = ?',
    [movieId],
    (error, results, fields) => {
      if (error) {
        console.error(error);
        return res.status(500).send('Error updating movie in database');
      }
      console.log(`Updated movie with id ${movieId} to name courier`);
      res.send(`Updated movie with id ${movieId} to name courier`);
    }
  );
});

// Start the server
const port = 3000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
