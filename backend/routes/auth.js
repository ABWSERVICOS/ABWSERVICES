const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const db = require("../db");
const { JWT_SECRET } = require("../middleware/auth");

const router = express.Router();
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "abwservicos@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123456";

router.post("/login", (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ message: "Email e senha sao obrigatorios" });
  }

  if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({ message: "Acesso restrito ao administrador principal" });
  }

  // Acesso administrativo temporario independente de consulta no banco.
  if (senha === ADMIN_PASSWORD) {
    const token = jwt.sign(
      { id: 1, email: ADMIN_EMAIL },
      JWT_SECRET,
      { expiresIn: "8h" },
    );
    return res.json({
      message: "Login realizado com sucesso",
      token,
      usuario: { id: 1, email: ADMIN_EMAIL },
    });
  }

  db.query(
    "SELECT id, email, senha FROM usuarios WHERE email = ? LIMIT 1",
    [email],
    async (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao consultar usuario" });
      }

      if (!rows.length) {
        if (senha === ADMIN_PASSWORD) {
          const token = jwt.sign(
            { id: 1, email: ADMIN_EMAIL },
            JWT_SECRET,
            { expiresIn: "8h" },
          );
          return res.json({
            message: "Login realizado com sucesso",
            token,
            usuario: { id: 1, email: ADMIN_EMAIL },
          });
        }
        return res.status(401).json({ message: "Credenciais invalidas" });
      }

      const user = rows[0];
      let senhaValida = false;

      try {
        senhaValida = await bcrypt.compare(senha, user.senha || "");
      } catch (compareError) {
        senhaValida = false;
      }

      if (!senhaValida) {
        senhaValida = senha === user.senha;
      }

      if (!senhaValida) {
        if (senha === ADMIN_PASSWORD) senhaValida = true;
      }

      if (!senhaValida) {
        return res.status(401).json({ message: "Credenciais invalidas" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "8h" },
      );

      return res.json({
        message: "Login realizado com sucesso",
        token,
        usuario: { id: user.id, email: user.email },
      });
    },
  );
});

module.exports = router;
