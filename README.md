3SIS GS MicroServices - Gerador de Certificado
Projeto: Gerador de Certificados em um ambiente de microserviços.
Desenvolvedores:

Leonardo Alves - RM93868
Vinicius Panessa - RM94501


Descrição
Este projeto é um serviço para gerar certificados de conclusão de cursos, implementado como parte de um sistema baseado em microserviços. O gerador de certificados oferece uma API que permite o envio de dados para criação de certificados, com a possibilidade de gerar e armazenar arquivos de certificado.

Tecnologias Utilizadas
Node.js (para backend)
Express.js (para criação da API REST)
PostgreSQL (banco de dados)
Docker (para containerização)
Docker Compose (para orquestração de containers)


Como Rodar o Projeto
Para rodar o projeto, você precisa ter o Docker e o Docker Compose instalados em sua máquina. O Docker irá facilitar a criação de ambientes isolados, enquanto o Docker Compose ajudará na orquestração de múltiplos containers (como o banco de dados e o serviço da API).


Execute o comando abaixo para iniciar os containers do projeto:

docker-compose up
Isso irá:

Subir as imagens para o DOCKER.
Subir o container do banco de dados (PostgreSQL).
Subir o container da API (Node.js + Express).
O serviço estará disponível em http://localhost:3000.

Acessar a API

A API estará rodando em http://localhost:3000. Você pode interagir com ela usando ferramentas como curl, Postman, ou até mesmo navegadores para chamadas GET simples.

Endpoints da API
1. Criar Certificado (POST)


curl -X POST http://localhost:3000/diploma \
     -H "Content-Type: application/json" \
     -d '{
           "nome": "João da Silva",
           "nacionalidade": "Brasileiro",
           "estado": "São Paulo",
           "data_nascimento": "1990-05-15",
           "rg": "123456789",
           "curso": "Engenharia de Software",
           "carga_horaria": "3000",
           "cargo": "Desenvolvedor"
         }'
