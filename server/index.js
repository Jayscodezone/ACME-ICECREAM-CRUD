// Imports here for express and pg
const express = require("express");
const app = express();
const pg = require("pg");
const path = require("path");

const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_ice_cream_db"
);

// static routes here ( you only needs these for deployment )
app.use(express.json());
app.use(express.static(path.join(__dirname, "../client/dist")));

// app routes here
app.get("/api/flavors", async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM flavors;");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// create your init function
const init = async () => {
  try {
    await client.connect();
    const SQL = `
DROP TABLE IF EXISTS flavors;
CREATE TABLE flavors(
id SERIAL PRIMARY KEY,
name VARCHAR(255) NOT NULL,
is_favorite BOOLEAN DEFAULT FALSE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO flavors(name, is_favorite) VALUES('Banana-Split', false);
INSERT INTO flavors(name, is_favorite) VALUES('Cookies & Cream', true);
INSERT INTO flavors(name, is_favorite) VALUES('Butter-Pecan routes', false);
`;
    await client.query(SQL);
    console.log("database seeded");

    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`listening on port ${port}`));
  } catch (error) {
    console.error("Database connection :", error);
  }
};

//init function invocation
init();
