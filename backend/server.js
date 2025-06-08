const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

app.use(cors({
  origin: '*', // ou especifique seu frontend: ex: 'https://seu-site.com'
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));


const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do CORS para aceitar só o domínio correto
const corsOptions = {
  origin: 'https://sistemas-entregas-pro.vercel.app',  // ajuste para o seu domínio frontend
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Registro ---
app.post('/api/registrar', (req, res) => {
  const { nomeEstabelecimento, endereco, email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ erro: 'Email e senha são obrigatórios' });

  fs.readFile('usuarios.json', 'utf8', (err, data) => {
    let usuarios = [];
    if (!err && data) {
      usuarios = JSON.parse(data);
    }

    if (usuarios.find(u => u.email === email)) {
      return res.status(400).json({ erro: 'Email já cadastrado' });
    }

    const novoUsuario = {
      id: Date.now().toString(),
      nomeEstabelecimento,
      endereco,
      email,
      senha,
    };

    usuarios.push(novoUsuario);

    fs.writeFile('usuarios.json', JSON.stringify(usuarios, null, 2), err => {
      if (err) return res.status(500).json({ erro: 'Erro ao salvar usuário' });
      res.json({ sucesso: true });
    });
  });
});

// --- Login ---
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ erro: 'Email e senha são obrigatórios' });

  fs.readFile('usuarios.json', 'utf8', (err, data) => {
    if (err) return res.status(500).json({ erro: 'Erro ao ler usuários' });

    let usuarios;
    try {
      usuarios = JSON.parse(data);
    } catch {
      return res.status(500).json({ erro: 'Erro ao processar dados de usuários' });
    }

    const usuario = usuarios.find(u => u.email === email && u.senha === senha);
    if (!usuario) return res.status(401).json({ erro: 'Email ou senha incorretos' });

    res.json({
      id: usuario.id,
      email: usuario.email,
      nome: usuario.nomeEstabelecimento,
      nomeEstabelecimento: usuario.nomeEstabelecimento,
      endereco: usuario.endereco,
    });
  });
});

// --- Obter solicitações do usuário ---
app.get('/api/solicitacoes/:usuario_id', (req, res) => {
  const usuario_id = req.params.usuario_id;

  fs.readFile('solicitacoes.json', 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') return res.json([]);
      return res.status(500).json({ erro: 'Erro ao ler solicitações' });
    }

    let solicitacoes;
    try {
      solicitacoes = JSON.parse(data);
    } catch {
      return res.status(500).json({ erro: 'Erro ao processar dados de solicitações' });
    }

    const solicitacoesUsuario = solicitacoes.filter(s => s.usuario_id === usuario_id);

    res.json(solicitacoesUsuario);
  });
});

// --- Criar nova solicitação ---
app.post('/api/solicitacoes', (req, res) => {
  const {
    usuario_id,
    nomeEstabelecimento,
    enderecoA,
    numPedido,
    nomedocliente,
    enderecoB,
    observacao,
    temRetorno,
    status = 'aberto',
    data_criacao = new Date().toISOString(),
    taxa = 0,
  } = req.body;

  if (!usuario_id) return res.status(400).json({ erro: 'Usuário inválido' });

  fs.readFile('solicitacoes.json', 'utf8', (err, data) => {
    let solicitacoes = [];
    if (!err && data) {
      try {
        solicitacoes = JSON.parse(data);
      } catch {}
    }

    const novoId = solicitacoes.length > 0 ? solicitacoes[solicitacoes.length - 1].id + 1 : 1;

    const novaSolicitacao = {
      id: novoId,
      usuario_id,
      nomeEstabelecimento,
      enderecoA,
      numPedido,
      nomedocliente,
      enderecoB,
      observacao,
      temRetorno,
      status,
      data_criacao,
      taxa: parseFloat(taxa) || 0,
    };

    solicitacoes.push(novaSolicitacao);

    fs.writeFile('solicitacoes.json', JSON.stringify(solicitacoes, null, 2), err => {
      if (err) return res.status(500).json({ erro: 'Erro ao salvar solicitação' });
      res.json(novaSolicitacao);
    });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
