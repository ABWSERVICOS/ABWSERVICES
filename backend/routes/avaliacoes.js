const express = require("express");
const db = require("../db");

const router = express.Router();

db.query(`
  CREATE TABLE IF NOT EXISTS avaliacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    nota INT NOT NULL,
    comentario TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

router.get("/", (req, res) => {
  db.query(
    "SELECT id, nome, nota, comentario, created_at FROM avaliacoes ORDER BY id DESC LIMIT 50",
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao carregar avaliacoes" });
      }
      return res.json(rows);
    },
  );
});

router.post("/", (req, res) => {
  const { nome, nota, comentario } = req.body;
  const notaInt = Number(nota);

  if (!nome || !comentario || !Number.isInteger(notaInt) || notaInt < 1 || notaInt > 5) {
    return res.status(400).json({ message: "Preencha nome, nota de 1 a 5 e comentario" });
  }

  db.query(
    "INSERT INTO avaliacoes (nome, nota, comentario) VALUES (?, ?, ?)",
    [String(nome).trim(), notaInt, String(comentario).trim()],
    (err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao salvar avaliacao" });
      }
      return res.json({ message: "Avaliacao enviada com sucesso" });
    },
  );
});

module.exports = router;
