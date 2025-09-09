FROM node:18-slim

RUN apt-get update && apt-get install -y \
    wget \
    git \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Install Cloud SQL Proxy
RUN wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O /usr/local/bin/cloud_sql_proxy \
    && chmod +x /usr/local/bin/cloud_sql_proxy

# Set working directory
WORKDIR /workspace

# Copy package.json and package-lock.json to install dependencies
COPY package.json package-lock.json ./

# Copy the rest of the application code
COPY . .

# Install npm dependencies
RUN npm install --production --legacy-peer-deps

# Expose a port if needed (not strictly necessary for a builder)
# EXPOSE 3000

# Default command (can be overridden in cloudbuild.yaml)
CMD ["node"]
