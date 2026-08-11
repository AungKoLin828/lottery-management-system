require("dotenv").config();

const { Client } = require("pg");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  try {
    await client.connect();

    const result = await client.query(
      "SELECT current_database(), current_user, current_schema()",
    );

    console.log("DATABASE CONNECTION SUCCESS");
    console.log(result.rows);

    await client.end();
  } catch (error) {
    console.error("DATABASE CONNECTION FAILED");
    console.error(error);
  }
}

test();
