// Imports here for express and pg
const express = require("express");
const pg = require("pg");
const path = require("path");
require("dotenv").config();
const app = express();
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_ice_cream_db"
);
const port = process.env.PORT || 3000;
//Database Connection
require("dotenv").config();
// testing log environment
//console.log("Database Config:", {
// user: process.env.DB_USER,
//  host: process.env.DB_HOST,
////  database: process.env.DB_NAME,
//password: process.env.DB_PASSWORD ? "****" : "NOT SET",
//  port: process.env.DB_PORT,
//});

//const pool = new Pool({
// user: process.env.DB_USER,
// host: process.env.DB_HOST,
// database: process.env.DB_NAME,
//  password: process.env.DB_PASSWORD,
//  port: process.env.DB_PORT,
//});
//// parse the body into JS Object
app.use(express.json());

//Logging the request as they come in
app.use(require("morgan")("dev"));
// static routes here ( you only needs these for deployment )
app.use(express.static(path.join(__dirname, "..", "client", "dist")));
// create your init function
const init = async () => {
  await client.connect();
  console.log("Connected to Database");
  let SQL = `
DROP TABLE IF EXISTS flavors;
CREATE TABLE flavors(
id SERIAL PRIMARY KEY,
name VARCHAR(255) NOT NULL,
is_favorite BOOLEAN DEFAULT FALSE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;
  await client.query(SQL);
  console.log("tables created");

  SQL = `
INSERT INTO flavors(name, is_favorite) VALUES('Banana Split', false);
INSERT INTO flavors(name, is_favorite) VALUES('Cookies and Cream', true);
INSERT INTO flavors(name, is_favorite) VALUES('Butter Pecan', false);
INSERT INTO flavors(name, is_favorite) VALUES('Vanilla', true);
INSERT INTO flavors(name, is_favorite) VALUES('Pistachio', false);
INSERT INTO flavors(name, is_favorite) VALUES('Mint Chocolate Chip', true);
`;
  await client.query(SQL);
  console.log("Database seeded");

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`listening on port ${port}`));
};

// Create Flavors
app.get("/api/flavors", async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM flavors");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Route for single flavors by ID
app.get("/api/flavors/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await client.query("SELECT * FROM flavors WHERE id = $1", [
      id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).send("Flavor not found");
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Create a new flavor
app.post("/api/flavors", async (req, res) => {
  const { name, is_favorite } = req.body;
  try {
    const result = await client.query(
      "INSERT INTO flavors (name, is_favorite) VALUES ($1, $2) RETURNING *",
      [name, is_favorite]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});
// Route to update a flavor by ID
app.put("/api/flavors/:id", async (req, res) => {
  const { id } = req.params;
  const { name, is_favorite } = req.body;
  try {
    const result = await client.query(
      "UPDATE flavors SET name = $1, is_favorite = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
      [name, is_favorite, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).send("Flavor not found");
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});
// Route to delete a flavor by ID
app.delete("/api/flavors/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await client.query("DELETE FROM flavors WHERE id = $1", [id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

//init function invocation
init();
