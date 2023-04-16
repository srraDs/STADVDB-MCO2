const express = require('express');
const mysql = require('mysql2');
const app = express();
app.set('view engine', 'ejs');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

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
  centralNodeConnection.query('SELECT id,name, year FROM movies_test_2 LIMIT 5', (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).send('Error retrieving movies from database');
    }
    res.render('results', { movies: results });
  } );
});
app.get('/movies', (req, res) => {
  centralNodeConnection.query('SELECT id, name, year FROM movies_test_2 LIMIT 5', (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).send('Error retrieving movies from database');
    }
    res.render('results', { movies: results });
  });
});

// Route for displaying the add movie form
app.get('/movies/add', (req, res) => {
  res.render('add');
});

// Route for adding a movie
// GET request to display add movie form
app.get('/movies/add', (req, res) => {
  res.render('add');
});

// POST request to create a new movie
app.post('/movies/add', (req, res) => {
const movie = {
  name: req.body.title,
  year: req.body.year
};

centralNodeConnection.query('INSERT INTO movies_test_2 SET ?', movie, (error, result) => {
  if (error) {
    console.error('Error creating movie: ', error);
    res.render('error', { message: 'Error creating movie' });
    return;
  }
  console.log('Movie created with id: ', result.insertId);
  res.redirect('/movies');
});

});

// Function to create a new movie
const createMovie = (movie, callback) => {
  connection.query('INSERT INTO movies SET ?', movie, (error, result) => {
    if (error) {
      console.error('Error creating movie: ', error);
      callback(error, null);
      return;
    }
    console.log('Movie created with id: ', result.insertId);
    callback(null, result.insertId);
  });
};


// Route for displaying the edit movie form
app.get('/movies/edit/:id', (req, res) => {
  const id = req.params.id;
  centralNodeConnection.query('SELECT id, name, year FROM movies_test_2 WHERE id = ?', [id], (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).send('Error retrieving movie from database');
    }
    if (results.length === 0) {
      return res.status(404).send('Movie not found');
    }
    const movie = results[0];
    res.render('edit', { movie });
  });
});

// Route for updating a movie
app.post('/movies/edit/:id', (req, res) => {
  const id = req.params.id;
  const { title, year } = req.body;
  centralNodeConnection.query('UPDATE movies_test_2 SET name = ?, year = ? WHERE id = ?', [title, year, id], (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).send('Error updating movie in database');
    }
    res.redirect('/movies');
  });
});

// Route for deleting a movie from the central node
app.post('/movies/delete/:id', (req, res) => {
  const id = req.params.id;
  centralNodeConnection.query('DELETE FROM movies_test_2 WHERE id = ?', id, (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).send('Error deleting movie from database');
    }
    console.log(`Movie with id ${id} deleted from database`);
    res.redirect('/movies');
  });
});

// Route for searching movies by name or year
app.post('/movies/search', (req, res) => {
  const searchQuery = req.body.search;
  const query = `%${searchQuery}%`; // add wildcards to match partial strings

  // search for movies in the database that match the search query
  connection.query('SELECT * FROM movies WHERE title LIKE ? OR year LIKE ?', [query, query], (error, results) => {
    if (error) {
      console.error('Error searching for movies: ', error);
      res.render('results', { movies: [], errorMessage: 'Error searching for movies' });
      return;
    }

    const movies = results.map((row) => ({
      id: row.id,
      title: row.title,
      year: row.year
    }));

    res.render('results', { movies: movies });
  });
});



// Start the server
const port = 3000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
