FROM node:20.12.2

RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libasound2 \
    libxshmfence1 \
    libxrandr2 \
    libxcomposite1 \
    libxdamage1 \
    libxrender1 \
    libx11-xcb1 \
    libxss1 \
    libcups2 \
    libxfixes3 \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /worker

COPY package*.json ./

RUN npm install

COPY . .

CMD ["node", "worker.js"]
