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
  centralNodeConnection.query('SELECT * FROM movies_test_2', (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).send('Error retrieving movies from database');
    }

    res.render('results', { movies: results });
  });
});

// Route for simulating transactions
app.post('/transactions', (req, res) => {
  // Route for simulating transactions in Case #1
app.post('/transactions/case1', (req, res) => {
  // Start a transaction block for Node 1
  centralNodeConnection.beginTransaction((err) => {
    if (err) { 
      console.error(err);
      return res.status(500).send('Error starting transaction');
    }
    
    // Query the same data item from Node 1 and Node 2
    centralNodeConnection.query('SELECT * FROM movies WHERE year = 1970', (error, results1) => {
      if (error) {
        console.error(error);
        return centralNodeConnection.rollback(() => {
          res.status(500).send('Error querying data from Node 1');
        });
      }
      
      node2Connection.query('SELECT * FROM movies WHERE year = 1970', (error, results2) => {
        if (error) {
          console.error(error);
          return centralNodeConnection.rollback(() => {
            res.status(500).send('Error querying data from Node 2');
          });
        }
        
        // Merge the results and send back to the client
        const mergedResults = [...results1, ...results2];
        res.json(mergedResults);
        
        // Commit the transaction block for Node 1
        centralNodeConnection.commit((error) => {
          if (error) {
            console.error(error);
            return centralNodeConnection.rollback(() => {
              res.status(500).send('Error committing transaction');
            });
          }
          
          console.log('Transaction committed successfully');
        });
      });
    });
  });
});

});

// Route for setting isolation level
app.post('/isolation-level', (req, res) => {
app.post('/transactions/case1', (req, res) => {
  // Start a transaction block for Node 1 with read committed isolation level
  centralNodeConnection.beginTransaction((err) => {
    if (err) { 
      console.error(err);
      return res.status(500).send('Error starting transaction');
    }
    
    // Set read committed isolation level for Node 1
    centralNodeConnection.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED', (error) => {
      if (error) {
        console.error(error);
        return centralNodeConnection.rollback(() => {
          res.status(500).send('Error setting isolation level');
        });
      }
      
      // Query the same data item from Node 1 and Node 2
      centralNodeConnection.query('SELECT * FROM movies WHERE year = 1970', (error, results1) => {
        if (error) {
          console.error(error);
          return centralNodeConnection.rollback(() => {
            res.status(500).send('Error querying data from Node 1');
          });
        }
        
        node2Connection.query('SELECT * FROM movies WHERE year = 1970', (error, results2) => {
          if (error) {
            console.error(error);
            return centralNodeConnection.rollback(() => {
              res.status(500).send('Error querying data from Node 2');
            });
          }
          
          // Merge the results and send back to the client
          const mergedResults = [...results1, ...results2];
          res.json(mergedResults);
          
          // Commit the transaction block for Node 1
          centralNodeConnection.commit((error) => {
            if (error) {
              console.error(error);
              return centralNodeConnection.rollback(() => {
                res.status(500).send('Error committing transaction');
              });
            }
            
            console.log('Transaction committed successfully');
          });
        });
      });
    });
  });
});

});

// Start the server
const port = 3000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
