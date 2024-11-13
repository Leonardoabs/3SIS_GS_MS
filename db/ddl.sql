CREATE TABLE IF NOT EXISTS certificates (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(300) NOT NULL,          
    nacionalidade VARCHAR(150) NOT NULL,  
    estado VARCHAR(150) NOT NULL,        
    data_nascimento DATE NOT NULL,
    rg VARCHAR(150) NOT NULL,              
    curso VARCHAR(400) NOT NULL,           
    carga_horaria INT NOT NULL,
    data_termino DATE NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    caminho_arquivo VARCHAR(500) NOT NULL
);

