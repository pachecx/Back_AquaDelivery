const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "nodemysqlaqua",
});

conn.connect(function (err) {
  if (err) {
    console.log("Erro ao conectar no MySQL:", err);
  } else {
    console.log("MySql conectado!");
  }
});

app.get("/home", (req, res) => {
  res.json({ message: "Hello from the server!" });
});

app.post("/logar", (req, res) => {
  const { email, senha } = req.body;
  res.status(200).json({ message: "Logado no back" });
});

app.post("/registrar/empresa", async (req, res) => {
  const { nome, cnpj, password, email, tel } = req.body;

  const query =
    "INSERT INTO users (nome, cnpj, password, email, tel) VALUES (?, ?, ?, ?, ?)";
  conn.query(query, [nome, cnpj, password, email, tel], function (err) {
    if (err) {
      console.log(err);
      res.status(500).json({ message: "Erro ao registrar empresa." });
    } else {
      res.status(201).json({ message: "Empresa registrada com sucesso!" });
    }
  });
});

app.get("/users/listar", (req, res) => {
  res.status(200).json({ message: "Lista de usuários não implementada." });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
