const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const secretKey = "seuSegredoSuperSeguro";

const app = express();
const port = 3001;

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

//TOKEN
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res
      .status(401)
      .json({ message: "Acesso negado: token não encontrado." });

  jwt.verify(token, secretKey, (err, user) => {
    if (err)
      return res.status(403).json({ message: "Token inválido ou expirado." });

    req.user = user; // Adiciona os dados do usuário no request
    next(); // Chama a próxima função da rota
  });
}

app.get("/home", (req, res) => {
  res.json({ message: "Hello from the server!" });
});

//LOGIN
app.post("/logar", (req, res) => {
  const { email, senha } = req.body;

  // console.log("Senha enviada", email, senha);

  const query = "SELECT * FROM users WHERE email = ?";
  conn.query(query, [email], async (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Erro interno no servidor." });
    }

    if (results.length > 0) {
      const user = results[0];
      const isMatch = await bcrypt.compare(senha, user.password);

      console.log("<User>: ", user);
      console.log("isMatch: ", isMatch);

      if (isMatch) {
        // Gera o token JWT com informações do usuário
        const token = jwt.sign(
          { id: user.idusuarios, email: user.email, nome: user.nome, cnpj: user.cnpj },
          secretKey,
          { expiresIn: "1h" } // O token expira em 1 hora
        );

        console.log("Token gerado:", token);

        res.status(200).json({
          message: "Login realizado com sucesso!",
          token: token,
          id: user.idusuarios,
          email: user.email,
          cnpj: user.cnpj,
          tel: user.tel,
          nome: user.nome,
        });
      } else {
        res.status(401).json({ message: "Email ou senha incorretos." });
      }
    } else {
      res.status(401).json({ message: "Email ou senha incorretos." });
    }
  });
});

//CADASTRO
app.post("/registrar/empresa", async (req, res) => {
  const { nome, cnpj, password, email, tel } = req.body;

  // Hash da senha antes de salvar no banco
  const hashedPassword = await bcrypt.hash(password, 10);

  const query =
    "INSERT INTO users (nome, cnpj, password, email, tel) VALUES (?, ?, ?, ?, ?)";
  conn.query(query, [nome, cnpj, hashedPassword, email, tel], function (err) {
    if (err) {
      console.log(err);
      res.status(500).json({ message: "Erro ao registrar empresa." });
    } else {
      res.status(201).json({ message: "Empresa registrada com sucesso!" });
    }
  });
});

//CADASTRO DO PRODUTO
app.post("/cadastrar/produto", (req, res) => {
  const { nomeProduto, volumePeso, valor, tipo, cnpj } = req.body;

  const query =
    "INSERT INTO produtos (nomeProduto, volumePeso, valor, tipo, cnpj) VALUES (?, ?, ?, ?, ?)";
  conn.query(
    query,
    [nomeProduto, volumePeso, valor, tipo, cnpj],
    function (err) {
      if (err) {
        console.log(err);
        res.status(500).json({ message: "Error ao cadastrar produto." });
      } else {
        res.status(200).json({ message: "Produto cadastrado com sucesso!" });
      }
    }
  );
});

//LISTAR PRODUTOS
app.get("/produtos/listar", (req, res) => {
  const query = ` SELECT * FROM produtos`;
  conn.query(query, (err, result) => {
    if (err) {
      console.log("Error ao buscar os produtos");
    }
    if (result === 0) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }

    const produto = result;
    res.status(200).json(produto);
  });
});

app.get("/produtos/listar/:id", (req, res) => {
  const produtoId = req.params.id;

  const query = `SELECT * FROM produtos WHERE idprodutos = ?`;
  conn.query(query, [produtoId], (err, result) => {
    if (err) {
      console.error("Error ao localizar Produto", err);
      return res.status(500);
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Produto não encontrado." });
    }

    const produto = result[0];

    res.status(200).json(produto);
  });
});

//Editar Produto
app.put("/produtos/editar/:id", (req, res) => {
  const produtoId = req.params.id;
  const { nomeProduto, volumePeso, valor, tipo, cnpj } = req.body;

  if (!nomeProduto || !volumePeso || !valor || !tipo || !cnpj) {
    return res
      .status(400)
      .json({ message: "Todos os campos são obrigatórios" });
  }

  const query = `UPDATE produtos SET nomeProduto = ?, valor = ?, volumePeso = ?, tipo = ?, cnpj = ? WHERE idprodutos = ?`;
  conn.query(
    query,
    [nomeProduto, volumePeso, valor, tipo, cnpj, produtoId], //Precisa seguir a ordem da const QUERY
    (err, result) => {
      if (err) {
        console.error("Erro ao editar o produto", err);
        return res.status(500).json({ message: "Erro interno servidor." });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }

      res.status(200).json({ message: "Produto atualizado com sucesso!" });
    }
  );
});

// Deletar produto
app.delete("/deletar/produto/:id", (req, res) => {
  const produtoId = req.params.id;

  const query = `DELETE FROM produtos WHERE idprodutos = ?`;

  conn.query(query, [produtoId], (err, result) => {
    if (err) {
      console.error("Erro ao deletar produto", err);
      return res.status(500).json({ message: "Erro interno no servidor" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }

    //Enviando resposta de sucesso
    res.status(200).json({ message: "Produto deletado com sucesso" });
  });
});

// app.get("/produtos/listar/:cnpj", (req, res) => {
//   const produtoId = req.params.id;

//   const query = `SELECT * FROM produtos WHERE cnpj = ?`;
//   conn.query(query, [produtoId], (err, results) => {
//     if (err) {
//       console.log("error na busca");
//     }
//     if (results === 0) {
//       return res.status(404).json({ message: "Produto não encontrado!" });
//     }

//     const produto = results[0];

//     res.status(200).json(produto);
//   });
// });

// app.get("/produtos/listar/:cnpj", (req, res) => {});

//LISTAR EMPRESAS
app.get("/users/listar", (req, res) => {
  const query = `SELECT idusuarios, nome, email, cnpj, tel FROM users `;

  conn.query(query, (err, result) => {
    if (err) {
      console.error("Error ao listar empresas", err);
      return res.status(500).json({ message: "Erro ao buscar empresas" });
    }
    res.status(200).json({ empresas: result });
  });
});

// //LISTAR EMPRESA POR ID
 app.get("/users/listar/:id", (req, res) => {
   const empresaId = req.params.id;
   const query = `SELECT * FROM users WHERE idusuarios = ? `;

   conn.query(query, [empresaId], (err, result) => {
     if (err) {
       console.error("Error ao listar empresas", err);
       return res.status(500).json({ message: "Erro ao buscar empresa" });
     }
     res.status(200).json({ empresas: result });
   });
 });

//LISTAR PERFIL DA EMPRESA
app.get("/empresa/:id", authenticateToken, (req, res) => {
  const empresaId = req.params.id;

  const query = `SELECT * FROM users WHERE idusuarios = ?`;
  conn.query(query, [empresaId], (err, results) => {
    if (err) {
      console.log("Erro ao buscar empresa:", err);
      return res.status(500).json({ message: "Erro ao buscar empresa." });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Empresa não encontrada." });
    }

    const empresa = results[0];

    // Remove a chave password
    delete empresa.password;

    res.status(200).json(empresa);
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
