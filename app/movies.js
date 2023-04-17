const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12345',
  database: 'central_node_database'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database: ', err);
    return;
  }
  console.log('Connected to database');
});

// Create a movie
const createMovie = (movie, callback) => {
  connection.query('INSERT INTO movies_test_2 SET ?', movie, (error, result) => {
    if (error) {
      console.error('Error creating movie: ', error);
      callback(error, null);
      return;
    }
    console.log('Movie created with id: ', result.insertId);
    callback(null, result.insertId);
  });
};

// Read a movie
const getMovie = (name, callback) => {
  connection.query('SELECT * FROM movies_test_2 WHERE name = ?', name, (error, result) => {
    if (error) {
      console.error('Error retrieving movie: ', error);
      callback(error, null);
      return;
    }
    if (result.length === 0) {
      console.log('Movie not found');
      callback(null, null);
      return;
    }
    console.log('Movie found: ', result[0]);
    callback(null, result[0]);
  });
};

// Update a movie
const updateMovie = (id, movie, callback) => {
  connection.query('UPDATE movies_test_2 SET ? WHERE id = ?', [movie, id], (error, result) => {
    if (error) {
      console.error('Error updating movie: ', error);
      callback(error, null);
      return;
    }
    console.log('Movie updated with id: ', id);
    callback(null, result.affectedRows);
  });
};

// Delete a movie
const deleteMovie = (id, callback) => {
  connection.query('DELETE FROM movies_test_2 WHERE id = ?', id, (error, result) => {
    if (error) {
      console.error('Error deleting movie: ', error);
      callback(error, null);
      return;
    }
    console.log('Movie deleted with id: ', id);
    callback(null, result.affectedRows);
  });
};


// Search for a movie
const searchMovie = (searchQuery, callback) => {
  const query = `%${searchQuery}%`; // add wildcards to match partial strings

  connection.query('SELECT * FROM movies_test_2 WHERE name LIKE ? OR year LIKE ? OR director LIKE ? OR genre_1 LIKE ? OR genre_2 LIKE ?', [query, query, query, query, query], (error, results) => {
    if (error) {
      console.error('Error searching for movies: ', error);
      callback(error, null);
      return;
    }

    console.log('Movies found: ', results);
    callback(null, results);
  });
};


module.exports = { createMovie, getMovie, updateMovie, deleteMovie, searchMovie };
