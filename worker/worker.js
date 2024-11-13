const amqp = require("amqplib");
const fs = require("fs-extra");
const path = require("path");
const pdfkit = require("pdfkit");
const ejs = require("ejs");
const pdf = require("html-pdf-node");
const cheerio = require("cheerio");
const { default: axios } = require("axios");

const templatePath = path.join(__dirname, "template.html");

// Receber as mensagens da fila e processar elas
const consumeMessage = async (channel, message) => {

  const data = JSON.parse(message.content.toString());
  console.log(`Dados recebidos: ${JSON.stringify(data)}`);

  const htmlContent = await ejs.renderFile(templatePath, data);

  const $ = cheerio.load(htmlContent);

  $("#nome").text(data.nome);
  $("#nacionalidade").text(data.nacionalidade);
  $("#estado").text(data.estado);
  $("#data_nascimento").text(data.data_nascimento);
  $("#rg").text(data.rg);
  $("#curso").text(data.curso);
  $("#carga_horaria").text(data.carga_horaria);
  $("#cargo").text(data.cargo);

  const modifiedHtmlContent = $.html();

  const pdfDir = path.join(__dirname, "pdf_files");
  const pdfName = nomePdf(data.nome, data.curso);
  const pdfPath = path.join(pdfDir, pdfName);
  fs.ensureDirSync(pdfDir);

  try {
    const options = { format: "A4", landscape: true };

    // Gera o PDF a partir do HTML modificado
    const pdfBuffer = await pdf.generatePdf({ content: modifiedHtmlContent }, options);

    // Salva o PDF gerado no sistema de arquivos
    fs.writeFileSync(pdfPath, pdfBuffer);

    try {
      // Requisição PUT para atualizar o caminho do certificado no BD
      await axios.put(`http://api:3000/certificado-path/${data.id}`, {
        caminho_certificado: pdfPath,
      });
      console.log("Caminho do BD atualizado");
    } catch (err) {
      console.error("Erro ao atualizar o BD", err);
    }

    // Exibe uma mensagem de sucesso com o nome do aluno
    console.log(`Certificado para ${data.nome} gerado!`);
  } catch (err) {
    console.error("Erro ao processar o certificado:", err);
  }

  channel.ack(message);
};

// Gerar o nome do Arquivo
const nomePdf = (name, curso) => {
  const nome_recortado = name.split(" ");
  const primeiroNome = nome_recortado[0];
  const ultimoNome = nome_recortado[nome_recortado.length - 1]; 
  return `${primeiroNome}_${ultimoNome}_${curso}.pdf`;
};

const workerFunction = async () => {
  const maxRetries = 6;
  let retries = 0;

  while (retries < maxRetries) {
    try {

      // Conexão ao servidor RabbitMQ
      const connection = await amqp.connect("amqp://guest:guest@rabbitmq:5672");
      const channel = await connection.createChannel();

      // Se não existe DIPLOMA. ele cria
      await channel.assertQueue("diploma", { durable: true });

      // Começa a consumir mensagens de diPloma
      channel.consume("diploma", (message) => {
        consumeMessage(channel, message);
      });

      console.log("Worker iniciando...");
      break;
    } catch (err) {
      retries += 1;
      console.error(
        `(${retries}/${maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

workerFunction();
