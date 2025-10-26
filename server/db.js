/* eslint-disable no-unused-vars */
import mysql from "mysql2";

// 1️⃣ Create connection
const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "aanirudh_02",
  database: "CITDatabase"
});

// 2️⃣ Connect to DB
con.connect(err => {
  if (err) {
    console.error("DB connection failed:", err);
    return;
  }
  console.log("✅ Connected to MySQL DB");

  // 3️⃣ Drop table if exists (optional, clean setup)
  const dropTableSQL = "DROP TABLE IF EXISTS student";
  con.query(dropTableSQL, (err, result) => {
    if (err) throw err;
    console.log("✅ Old table dropped (if existed)");

    // 4️⃣ Create table
    const createTableSQL = `
      CREATE TABLE student (
        id INT PRIMARY KEY,
        name VARCHAR(50),
        city VARCHAR(50)
      )
    `;
    con.query(createTableSQL, (err, result) => {
      if (err) throw err;
      console.log("✅ Table 'student' created");

      // 5️⃣ Insert sample records
      const insertSQL = `
        INSERT INTO student (id, name, city) VALUES
        (111, 'Ram', 'Coimbatore'),
        (112, 'Shyam', 'Chennai'),
        (113, 'Maya', 'Bangalore')
      `;
      con.query(insertSQL, (err, result) => {
        if (err) throw err;
        console.log("✅ Records inserted");

        // 6️⃣ Read all records
        con.query("SELECT * FROM student", (err, rows) => {
          if (err) throw err;
          console.log("📄 Current records in student table:");
          console.table(rows);

          // 7️⃣ Close connection
          con.end();
        });
      });
    });
  });
});
