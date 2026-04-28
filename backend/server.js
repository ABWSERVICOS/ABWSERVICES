const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const avaliacoesRoutes = require("./routes/avaliacoes");
const pedidosRoutes = require("./routes/pedidos");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

app.use("/auth", authRoutes);
app.use("/avaliacoes", avaliacoesRoutes);
app.use("/pedidos", pedidosRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
