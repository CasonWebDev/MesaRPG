# Use Node.js 18
FROM node:18-slim

# Install OpenSSL and other dependencies
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Copy prisma schema before installing dependencies
COPY prisma ./prisma

# Install dependencies with legacy peer deps
RUN npm install --legacy-peer-deps --only=production

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]