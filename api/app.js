const express = require("express");
const bodyParser = require("body-parser");
const { Client } = require("pg");
const amqp = require("amqplib");
const redis = require('redis');
const app = express();

// Criação do cliente Redis
const clientRedis = redis.createClient({
  url: 'redis://redis:6379'
});

clientRedis.on('error', (err) => {
  console.error('Erro na conexão com Redis:', err);
});

// Processamento do jSON
app.use(bodyParser.json());

// Configuração PostgreSQL
const client = new Client({
  user: "postgres",
  password: "postgres",
  host: "postgres",
  port: 5432,
  database: "gerador_certificado",
});

// Conexão PostgreSQL
const initConnection = async () => {
  const maxRetries = 6;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await client.connect();
      console.log("Banco conectado.");
      break;
    } catch (err) {
      retries += 1;
      console.error(
        `(${err}) `
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

initConnection();

// Enviar mensagens para a fila RabbitMQ
const envioMsg = async (message) => {
  try {
    const connection = await amqp.connect("amqp://guest:guest@rabbitmq:5672");
    const channel = await connection.createChannel();

    const queue = "diploma";

    await channel.assertQueue(queue, { durable: true });

    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });

    console.log("Mensagem enviada para a fila: ", message);

    await channel.close();
    await connection.close();
  } catch (error) {
    console.error("Erro ao enviar mensagem para a fila:", error);
  }
};

// Rota para criar um novo diploma
app.post("/diploma", async (req, res) => {
  const {
    nome,
    nacionalidade,
    estado,
    data_nascimento,
    rg,
    data_termino,
    curso,
    carga_horaria,
    cargo,
    caminho_arquivo
  } = req.body;

  // Verificação se os dados foram fornecidos
  if (!nome || !nacionalidade || !estado || !data_nascimento || !rg || !data_termino || !curso || !carga_horaria || !cargo || !caminho_arquivo) {
    return res.status(400).send("Campos não preenchidos...");
  }

  const query = `
    INSERT INTO certificates (nome, nacionalidade, estado, data_nascimento, rg, data_termino, curso, carga_horaria, cargo, caminho_arquivo)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  `;

  try {
    await client.query(query, [
      nome,
      nacionalidade,
      estado,
      data_nascimento,
      rg,
      data_termino,
      curso,
      carga_horaria,
      cargo,
      caminho_arquivo,
    ]);

    envioMsg(req.body);

    res.status(201).send("Diploma criado!");
  } catch (err) {
    console.log("Erro ao criar diploma:", err);
    res.status(500).send("Erro interno ao criar diploma");
  }
});

// Atualizar o caminho do arquivo Diploma
app.put("/diploma-path/:nome", async (req, res) => {
  const { nome } = req.params;
  const { caminho_arquivo } = req.body;

  // Verifica se o caminho do arquivo foi fornecido
  if (!caminho_arquivo) {
    return res.status(400).send("Campo obrigatório 'caminho_arquivo' não fornecido");
  }

  const query = `
    UPDATE certificates 
    SET caminho_arquivo = $1 
    WHERE nome = $2
  `;

  try {
    const result = await client.query(query, [caminho_arquivo, nome]);

    if (result.rowCount === 0) {
      return res.status(404).send("Diploma não encontrado");
    }

    res.status(200).send("Caminho do arquivo atualizado");
  } catch (err) {
    console.log("Erro ao atualizar caminho de arquivo:", err);
    res.status(500).send("Erro interno ao atualizar caminho de arquivo");
  }
});

// Rota para ver o caminho do arquivo do diploma (Cache rEDIS)
app.get("/diploma/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).send("ID do diploma não fornecido");
  }

  try {
    const redisKey = `certificado:${id}`;
    const redisData = await clientRedis.get(redisKey);

    if (redisData) {
      console.log("Diploma encontrado no cache Redis");
      return res.status(200).json(JSON.parse(redisData));
    }

    // Se not enconttrou, busca no BD
    const query = "SELECT caminho_arquivo FROM certificates WHERE id = $1";
    const result = await client.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).send("Diploma não encontrado para o ID especificado");
    }

    const caminhoArquivo = result.rows[0].caminho_arquivo;

    await clientRedis.setEx(redisKey, 3600, JSON.stringify(caminhoArquivo));

    res.status(200).json(caminhoArquivo);
  } catch (err) {
    console.error("Erro ao buscar diploma:", err);
    res.status(500).send("Erro interno do servidor");
  }
});

// Inicia o servidor na porta 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
