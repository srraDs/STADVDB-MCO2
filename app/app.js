const express = require('express');
const mysql = require('mysql2');
const app = express();
app.set('view engine', 'ejs');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
const movies = require('./movies');

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
  centralNodeConnection.query('SELECT id, name, year, director, genre_1, genre_2 FROM movies_test_2 LIMIT 20', (error, results) => {
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
app.post('/movies/add', (req, res) => {
  const movie = {
    id: null,
    name: req.body.title,
    director: req.body.director,
    year: req.body.year,
    genre_1: req.body.genre_1,
    genre_2: req.body.genre_2,
  };

  // call createMovie instead of inserting directly
  movies.createMovie(movie, (error, result) => {
    if (error) {
      console.error('Error creating movie: ', error);
      res.render('error', { message: 'Error creating movie' });
      return;
    }
    console.log('Movie created with id: ', result.insertId);
    res.redirect('/movies');
  });
});

// Route for displaying the edit movie form
app.get('/movies/edit/:id', (req, res) => {
  const id = req.params.id;
  centralNodeConnection.query('SELECT id, name, director, year, genre_1, genre_2 FROM movies_test_2 WHERE id = ?', [id], (error, results) => {
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
  const { title, director, year, genre_1, genre_2 } = req.body;

  centralNodeConnection.query('SELECT * FROM movies_test_2 WHERE id = ? FOR UPDATE', [id], (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).send('Error retrieving movie from database');
    }
    if (results.length === 0) {
      return res.status(404).send('Movie not found');
    }

    const movie = results[0];
    movie.name = title;
    movie.director = director;
    movie.year = year;
    movie.genre_1 = genre_1;
    movie.genre_2 = genre_2;

    // send the updated movie to Node 1
    centralNodeConnection.query('UPDATE movies_test_2 SET name = ?, director = ?, year = ?, genre_1 = ?, genre_2 = ? WHERE id = ?', [title, director, year, genre_1, genre_2, id], (error, results) => {
      if (error) {
        console.error(error);
        return res.status(500).send('Error updating movie in database');
      }
      console.log('Movie updated in Node 1:', movie);
    });

    if (movie.year < 1980) {
      // send the updated movie to Node 2
      node2Connection.query('UPDATE movies_test_2 SET name = ?, director = ?, year = ?, genre_1 = ?, genre_2 = ? WHERE id = ?', [title, director, year, genre_1, genre_2, id], (error, results) => {
        if (error) {
          console.error(error);
          return res.status(500).send('Error updating movie in database');
        }
        console.log('Movie updated in Node 2:', movie);
        res.redirect('/movies');
      });
    } else {
      // send the updated movie to Node 3
      node3Connection.query('UPDATE movies_test_2 SET name = ?, director = ?, year = ?, genre_1 = ?, genre_2 = ? WHERE id = ?', [title, director, year, genre_1, genre_2, id], (error, results) => {
        if (error) {
          console.error(error);
          return res.status(500).send('Error updating movie in database');
        }
        console.log('Movie updated in Node 3:', movie);
        res.redirect('/movies');
      });
    }
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

  // call searchMovie instead of querying directly
  movies.searchMovie(searchQuery, (error, results) => {
    if (error) {
      console.error('Error searching for movies: ', error);
      res.render('search_results', { movies: [], errorMessage: 'Error searching for movies' });
      return;
    }

    console.log('Movies found: ', results);
    res.render('search_results', { movies: results });
  });
});

// Start the server
const port = 3000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

