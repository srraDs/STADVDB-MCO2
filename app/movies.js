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

// Read a movie
const getMovie = (id, callback) => {
  connection.query('SELECT * FROM movies WHERE id = ?', id, (error, result) => {
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
  connection.query('UPDATE movies SET ? WHERE id = ?', [movie, id], (error, result) => {
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
  connection.query('DELETE FROM movies WHERE id = ?', id, (error, result) => {
    if (error) {
      console.error('Error deleting movie: ', error);
      callback(error, null);
      return;
    }
    console.log('Movie deleted with id: ', id);
    callback(null, result.affectedRows);
  });
};

module.exports = { createMovie, getMovie, updateMovie, deleteMovie };
