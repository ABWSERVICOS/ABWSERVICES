const express = require("express");
const db = require("../db");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

const HORARIOS_PADRAO = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

db.query(`
  CREATE TABLE IF NOT EXISTS agenda_agendamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    contato VARCHAR(120) NOT NULL,
    servico VARCHAR(150) NOT NULL,
    data DATE NOT NULL,
    hora VARCHAR(5) NOT NULL,
    observacoes TEXT,
    status VARCHAR(30) DEFAULT 'pendente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

db.query(`
  CREATE TABLE IF NOT EXISTS agenda_bloqueios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data DATE NOT NULL,
    hora VARCHAR(5) NOT NULL,
    motivo VARCHAR(180),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

function validarDataHora(data, hora) {
  const dataValida = /^\d{4}-\d{2}-\d{2}$/.test(data || "");
  const horaValida = /^\d{2}:\d{2}$/.test(hora || "");
  return dataValida && horaValida;
}

function slotDisponivel(data, hora, callback) {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM agenda_bloqueios WHERE data = ? AND hora = ?) AS bloqueado,
      (
        SELECT COUNT(*)
        FROM agenda_agendamentos
        WHERE data = ? AND hora = ? AND status IN ('pendente', 'confirmado')
      ) AS ocupado
  `;
  db.query(sql, [data, hora, data, hora], (err, rows) => {
    if (err) return callback(err);
    const row = rows[0] || { bloqueado: 0, ocupado: 0 };
    return callback(null, row.bloqueado === 0 && row.ocupado === 0);
  });
}

router.get("/disponibilidade", (req, res) => {
  const { data } = req.query;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data || "")) {
    return res.status(400).json({ message: "Data invalida. Use YYYY-MM-DD" });
  }

  db.query(
    `
      SELECT hora, 'bloqueado' AS origem FROM agenda_bloqueios WHERE data = ?
      UNION ALL
      SELECT hora, 'agendado' AS origem FROM agenda_agendamentos
      WHERE data = ? AND status IN ('pendente', 'confirmado')
    `,
    [data, data],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Erro ao carregar disponibilidade" });
      const indisponiveis = new Set(rows.map((r) => r.hora));
      const horarios = HORARIOS_PADRAO.map((hora) => ({
        hora,
        disponivel: !indisponiveis.has(hora),
      }));
      return res.json({ data, horarios });
    },
  );
});

router.post("/agendar", (req, res) => {
  const { nome, contato, servico, data, hora, observacoes } = req.body;
  if (!nome || !contato || !servico || !validarDataHora(data, hora)) {
    return res.status(400).json({ message: "Preencha nome, contato, servico, data e horario validos" });
  }

  slotDisponivel(data, hora, (checkErr, livre) => {
    if (checkErr) return res.status(500).json({ message: "Erro ao validar disponibilidade" });
    if (!livre) {
      return res.status(409).json({ message: "Este horario nao esta disponivel" });
    }

    db.query(
      `
      INSERT INTO agenda_agendamentos (nome, contato, servico, data, hora, observacoes, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pendente')
      `,
      [nome, contato, servico, data, hora, observacoes || ""],
      (err) => {
        if (err) return res.status(500).json({ message: "Erro ao salvar agendamento" });
        return res.json({ message: "Horario reservado com sucesso" });
      },
    );
  });
});

router.get("/admin/agendamentos", authMiddleware, (req, res) => {
  const { status } = req.query;
  let sql = "SELECT * FROM agenda_agendamentos";
  const params = [];

  if (status) {
    sql += " WHERE status = ?";
    params.push(status);
  }

  sql += " ORDER BY data ASC, hora ASC";

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: "Erro ao carregar agendamentos" });
    return res.json(rows);
  });
});

router.patch("/admin/agendamentos/:id/status", authMiddleware, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const permitidos = ["pendente", "confirmado", "realizado", "cancelado"];
  if (!permitidos.includes(status)) {
    return res.status(400).json({ message: "Status invalido" });
  }

  db.query(
    "UPDATE agenda_agendamentos SET status = ? WHERE id = ?",
    [status, id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Erro ao atualizar agendamento" });
      if (!result.affectedRows) return res.status(404).json({ message: "Agendamento nao encontrado" });
      return res.json({ message: "Status atualizado" });
    },
  );
});

router.get("/admin/bloqueios", authMiddleware, (req, res) => {
  db.query("SELECT * FROM agenda_bloqueios ORDER BY data ASC, hora ASC", (err, rows) => {
    if (err) return res.status(500).json({ message: "Erro ao carregar bloqueios" });
    return res.json(rows);
  });
});

router.post("/admin/bloqueios", authMiddleware, (req, res) => {
  const { data, hora, motivo } = req.body;
  if (!validarDataHora(data, hora)) {
    return res.status(400).json({ message: "Data/hora invalidas" });
  }

  db.query(
    "INSERT INTO agenda_bloqueios (data, hora, motivo) VALUES (?, ?, ?)",
    [data, hora, motivo || "Indisponivel"],
    (err) => {
      if (err) return res.status(500).json({ message: "Erro ao bloquear horario" });
      return res.json({ message: "Horario bloqueado" });
    },
  );
});

router.delete("/admin/bloqueios/:id", authMiddleware, (req, res) => {
  db.query("DELETE FROM agenda_bloqueios WHERE id = ?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ message: "Erro ao remover bloqueio" });
    if (!result.affectedRows) return res.status(404).json({ message: "Bloqueio nao encontrado" });
    return res.json({ message: "Bloqueio removido" });
  });
});

module.exports = router;
