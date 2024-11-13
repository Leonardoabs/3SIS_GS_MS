const express = require("express");
const bodyParser = require("body-parser");
const { Client } = require("pg");
const amqp = require("amqplib");
const app = express();

app.use(bodyParser.json());

const client = new Client({
  user: "postgres",
  password: "postgres",
  host: "postgres",
  port: 5432,
  database: "gerador_certificado",
});

const clientInit = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await client.connect();
      console.log("Banco conectado.");
      break;
    } catch (err) {
      retries += 1;
      console.error(
        `Erro de conexão com o Banco de dados. Retentando em 5 segundos... (${retries}/${maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

clientInit();

const sentToQueue = async (message) => {
  try {
    const connection = await amqp.connect("amqp://guest:guest@rabbitmq:5672");
    const channel = await connection.createChannel();

    const queue = "certificados";

    await channel.assertQueue(queue, { durable: true });

    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });

    console.log("Mensagem enviada com sucesso", message);

    await channel.close();
    await connection.close();
  } catch (error) {
    console.error("Erro ao enviar mensagem para fila", error);
  }
};

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

  if (!req.body) {
    return res.status(400).send("Corpo da requisição vazio");
  }

  const query =
    "INSERT INTO certificados (nome, nacionalidade, estado, data_nascimento, rg, data_termino, curso, carga_horaria, cargo, caminho_arquivo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)";

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

    sentToQueue(req.body);

    res.status(201).send("Certificado criado com sucesso");
  } catch (err) {
    console.log("deu ruim", err);
  }
});

app.put("/diploma-path/:nome", async (req, res) => {
  const { nome } = req.params;
  const { caminho_arquivo } = req.body;

  if (!caminho_arquivo) {
    return res.status(400).send("Campo Obrigatório");
  }

  const query =
    "UPDATE certificados SET caminho_arquivo = $1 WHERE nome = $2";

  try {
    const result = await client.query(query, [caminho_arquivo, nome]);

    if (result.rowCount === 0) {
      return res.status(404).send("Certificado não encontrado");
    }

    res.status(200).send("caminho_certificado atualizado com sucesso");
  } catch (err) {
    console.log("Erro ao atualizar caminho_certificado", err);
    res.status(500).send("Erro interno no servidor");
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

