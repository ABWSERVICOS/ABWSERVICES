const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "troque-esta-chave-em-producao";

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [, token] = header.split(" ");

  if (!token) {
    return res.status(401).json({ message: "Token nao enviado" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalido" });
  }
}

module.exports = { authMiddleware, JWT_SECRET };
