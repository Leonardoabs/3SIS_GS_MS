FROM python:3.10.11-slim
WORKDIR /app
RUN mkdir diplomas && chmod -R 777 diplomas
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .