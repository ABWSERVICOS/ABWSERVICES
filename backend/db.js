const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "M@cieira22",
  database: process.env.DB_NAME || "servicos",
});

connection.connect((err) => {
  if (err) {
    console.error("Erro ao conectar no MySQL:", err.message);
  } else {
    console.log("Conectado ao MySQL");
  }
});

module.exports = connection;
