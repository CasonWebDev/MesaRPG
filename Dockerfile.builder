# Imagem base Node
FROM node:20

# Instala dependências extras se precisar (ex: bash, curl, etc)
RUN apt-get update && apt-get install -y \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Define workdir
WORKDIR /workspace

# Copia tudo para dentro da imagem
COPY . .

# Instala dependências
RUN npm install --legacy-peer-deps

# Gera client do Prisma
RUN npx prisma generate
