const amqp = require("amqplib");
const fs = require("fs-extra");
const path = require("path");
const pdfkit = require("pdfkit");
const ejs = require("ejs");
const pdf = require("html-pdf-node");
const cheerio = require("cheerio");
const { default: axios } = require("axios");

const templatePath = path.join(__dirname, "template.html");

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
  fs.ensureDirSync(pdfDir);
  const pdfName = nomePdf(data.nome, data.curso);
  const pdfPath = path.join(pdfDir, pdfName);

  try {
    const options = { format: "A4", landscape: true };
    const pdfBuffer = await pdf.generatePdf(
      { content: modifiedHtmlContent },
      options
    );

    fs.writeFileSync(pdfPath, pdfBuffer);

    try {
      await axios.put(`http://api:3000/certificado-path/${data.id}`, {
        caminho_certificado: pdfPath,
      });
      console.log(
        "Caminho do certificado atualizado com sucesso no banco de dados"
      );
    } catch (err) {
      console.error(
        "Erro ao atualizar o caminho do certificado no banco de dados:",
        err
      );
    }
    console.log(
      `Certificado para ${data.nome} gerado com sucesso em ${pdfPath}!`
    );
  } catch (err) {
    console.error("Erro ao processar o certificado:", err);
  }

  channel.ack(message);
};

const nomePdf = (name, curso) => {
  const words = name.split(" ");
  const primeiroNome = words[0];
  const ultimoname = words[words.length - 1];
  return `${primeiroNome}_${ultimoname}_${curso}.pdf`;
};

const workerInit = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const connection = await amqp.connect("amqp://guest:guest@rabbitmq:5672");
      const channel = await connection.createChannel();

      await channel.assertQueue("certificados", { durable: true });

      channel.consume("certificados", (message) => {
        consumeMessage(channel, message);
      });

      console.log("Worker iniciado. Aguardando mensagens...");
      break;
    } catch (err) {
      retries += 1;
      console.error(
        `Erro de conexão com o RabbitMQ. Retentando em 5 segundos... (${retries}/${maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

workerInit();
