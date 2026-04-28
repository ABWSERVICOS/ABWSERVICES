const express = require("express");
const router = express.Router();
const db = require("../db");
const { authMiddleware } = require("../middleware/auth");

// GET
router.get("/", authMiddleware, (req, res) => {
  const status = req.query.status;
  let sql = "SELECT * FROM pedidos";
  let params = [];

  if (status === "pendente" || status === "realizado") {
    sql += " WHERE status = ?";
    params.push(status);
  }

  sql += " ORDER BY id DESC";

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// POST
router.post("/", (req, res) => {
  const { nome, endereco, descricao } = req.body;

  if (!nome || !endereco || !descricao) {
    return res.status(400).json({ message: "Preencha nome, endereco e descricao" });
  }

  db.query(
    "INSERT INTO pedidos (nome, endereco, descricao) VALUES (?, ?, ?)",
    [nome, endereco, descricao],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ mensagem: "Pedido salvo!" });
    },
  );
});

router.patch("/:id/status", authMiddleware, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (status !== "pendente" && status !== "realizado") {
    return res.status(400).json({ message: "Status invalido" });
  }

  db.query(
    "UPDATE pedidos SET status = ? WHERE id = ?",
    [status, id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Erro ao atualizar pedido" });
      if (!result.affectedRows) {
        return res.status(404).json({ message: "Pedido nao encontrado" });
      }
      return res.json({ message: "Status atualizado com sucesso" });
    },
  );
});

module.exports = router;
