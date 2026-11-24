const fs = require("fs");
const path = require("path");
const pool = require("./db");

async function setup() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(schema);
  console.log("Table is ready.");

  const count = await pool.query("SELECT COUNT(*) FROM records");
  if (Number(count.rows[0].count) === 0) {
    const seed = fs.readFileSync(path.join(__dirname, "seed.sql"), "utf8");
    await pool.query(seed);
    console.log("Starting records added.");
  } else {
    console.log("Records already exist, seed skipped.");
  }

  await pool.end();
}

setup().catch((error) => {
  console.error("Setup failed:", error.message);
  process.exit(1);
});