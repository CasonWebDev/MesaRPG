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

# Install ALL dependencies (including dev dependencies for build)
RUN npm install --legacy-peer-deps

# Generate Prisma client
RUN npx prisma generate

# Copy configuration files
COPY next.config.mjs ./
COPY tailwind.config.js ./
COPY postcss.config.mjs ./
COPY tsconfig.json ./
COPY components.json ./

# Copy source code and components
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY hooks ./hooks
COPY types ./types
COPY public ./public

# Build the application
RUN npm run build

# Clean up dev dependencies after build
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]