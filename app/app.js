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

// Route for adding a movie from the central node
app.post('/movies/add', (req, res) => {
  const movie = {
    id: null,
    name: req.body.title,
    director: req.body.director,
    year: req.body.year,
    genre_1: req.body.genre_1,
    genre_2: req.body.genre_2,
  };

  centralNodeConnection.beginTransaction((err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error starting transaction');
    }

    // Lock the movies table in the central database
    centralNodeConnection.query('LOCK TABLES movies_test_2 WRITE', (error) => {
      if (error) {
        console.error(error);
        return centralNodeConnection.rollback(() => {
          res.status(500).send('Error locking movies table');
        });
      }

      // Get the highest ID in the central database and increment it
      centralNodeConnection.query('SELECT MAX(id) AS max_id FROM movies_test_2', (error, results) => {
        if (error) {
          console.error(error);
          return centralNodeConnection.rollback(() => {
            res.status(500).send('Error getting highest ID');
          });
        }

        const newId = results[0].max_id ? results[0].max_id + 1 : 1;
        movie.id = newId;

        // Insert the movie into the central database
        centralNodeConnection.query('INSERT INTO movies_test_2 SET ?', movie, (error, results) => {
          if (error) {
            console.error(error);
            return centralNodeConnection.rollback(() => {
              res.status(500).send('Error adding movie to central database');
            });
          }

          console.log(`Movie with id ${newId} added to central node`);

          // Update node2 if the year of the movie is less than 1980
          if (movie.year < 1980) {
            node2Connection.query('INSERT INTO movies_test_2 SET ?', movie, (error, results) => {
              if (error) {
                console.error(error);
                return centralNodeConnection.rollback(() => {
                  res.status(500).send('Error adding movie to node2');
                });
              }

              console.log(`Movie with id ${newId} added to node2`);
            });
          }

          // Update node3 if the year of the movie is greater than or equal to 1980
          if (movie.year >= 1980) {
            node3Connection.query('INSERT INTO movies_test_2 SET ?', movie, (error, results) => {
              if (error) {
                console.error(error);
                return centralNodeConnection.rollback(() => {
                  res.status(500).send('Error adding movie to node3');
                });
              }

              console.log(`Movie with id ${newId} added to node3`);
            });
          }

          // Unlock the movies table in the central database
          centralNodeConnection.query('UNLOCK TABLES', (error) => {
            if (error) {
              console.error(error);
              return centralNodeConnection.rollback(() => {
                res.status(500).send('Error unlocking movies table');
              });
            }

            // Commit the transaction
            centralNodeConnection.commit((err) => {
              if (err) {
                console.error(err);
                return centralNodeConnection.rollback(() => {
                  res.status(500).send('Error committing transaction');
                });
              }

              res.redirect('/movies');
            });
          });
        });
      });
    });
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
  let year;

  // Start a transaction
  centralNodeConnection.beginTransaction((err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error starting transaction');
    }

    // Lock the movie record
    centralNodeConnection.query('SELECT * FROM movies_test_2 WHERE id = ? FOR UPDATE', id, (error, results) => {
      if (error) {
        console.error(error);
        return centralNodeConnection.rollback(() => {
          res.status(500).send('Error locking movie record');
        });
      }

      // Check the year of the movie
      year = results[0].year;

      // Delete the movie record from the central node
      centralNodeConnection.query('DELETE FROM movies_test_2 WHERE id = ?', id, (error, results) => {
        if (error) {
          console.error(error);
          return centralNodeConnection.rollback(() => {
            res.status(500).send('Error deleting movie from database');
          });
        }

        console.log(`Movie with id ${id} deleted from central node`);

        // Update node2 if the year of the movie is less than 1980
        if (year < 1980) {
          node2Connection.query('DELETE FROM movies_test_2 WHERE id = ?', id, (error, results) => {
            if (error) {
              console.error(error);
              return centralNodeConnection.rollback(() => {
                res.status(500).send('Error deleting movie from node2');
              });
            }

            console.log(`Movie with id ${id} deleted from node2`);
          });
        }

        // Update node3 if the year of the movie is greater than or equal to 1980
        if (year >= 1980) {
          node3Connection.query('DELETE FROM movies_test_2 WHERE id = ?', id, (error, results) => {
            if (error) {
              console.error(error);
              return centralNodeConnection.rollback(() => {
                res.status(500).send('Error deleting movie from node3');
              });
            }

            console.log(`Movie with id ${id} deleted from node3`);
          });
        }

        // Commit the transaction
        centralNodeConnection.commit((err) => {
          if (err) {
            console.error(err);
            return centralNodeConnection.rollback(() => {
              res.status(500).send('Error committing transaction');
            });
          }

          res.redirect('/movies');
        });
      });
    });
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

