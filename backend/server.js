const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // pasta com login.html, registro.html etc.

const caminhoUsuarios = './usuarios.json';

// Rota de registro
app.post('/api/registrar', (req, res) => {
  const { nomeEstabelecimento, endereco, email, senha } = req.body;

  // Verifica se todos os campos foram enviados
  if (!nomeEstabelecimento || !endereco || !email || !senha) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
  }

  // Lê o arquivo de usuários
  fs.readFile(caminhoUsuarios, 'utf8', (err, data) => {
    let usuarios = [];

    if (!err && data) {
      usuarios = JSON.parse(data);
    }

    // Verifica se o email já está cadastrado
    const existente = usuarios.find(u => u.email === email);
    if (existente) {
      return res.status(400).json({ erro: 'Email já cadastrado' });
    }

    // Adiciona novo usuário
    const novoUsuario = { nomeEstabelecimento, endereco, email, senha };
    usuarios.push(novoUsuario);

    // Salva no arquivo
    fs.writeFile(caminhoUsuarios, JSON.stringify(usuarios, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ erro: 'Erro ao salvar o usuário' });
      }

      res.status(201).json({ mensagem: 'Usuário registrado com sucesso' });
    });
  });
});

// Rota de login
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;

  fs.readFile(caminhoUsuarios, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ erro: 'Erro ao ler usuários' });

    const usuarios = JSON.parse(data);
    const usuario = usuarios.find(u => u.email === email && u.senha === senha);

    if (usuario) {
      res.json({
        nomeEstabelecimento: usuario.nomeEstabelecimento,
        endereco: usuario.endereco,
        email: usuario.email
      });
    } else {
      res.status(401).json({ erro: 'Email ou senha inválidos' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
