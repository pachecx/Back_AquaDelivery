const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get("/home", (req, res) => {
  res.json({ message: "Hello from the server!" });
});

app.post("/logar", (req, res) => {
  const { email, senha } = req.body;

  res.status(200).json({ message: "Logado no back" });
});

app.post("/registrar", (req, res) => {
  const { nome, cnpj, email, tel, password } = req.body;

  console.log(nome, cnpj, email, tel, password);

  res.status(200).json({message: "cadastro no back"});
});

app.listen(port, () => {
  console.log("App rodando!!");
});
