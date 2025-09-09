# Use Node.js 18
FROM node:18-slim

# Install OpenSSL and other dependencies
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Accept build arguments
ARG NEXTAUTH_SECRET
ARG STRIPE_SECRET_KEY
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG STRIPE_WEBHOOK_SECRET
ARG STRIPE_MONTHLY_PLAN_PRICE_ID
ARG STRIPE_ANNUAL_PLAN_PRICE_ID
ARG STRIPE_LIFETIME_PLAN_PRICE_ID

# Set environment variables for build time
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET
ENV STRIPE_MONTHLY_PLAN_PRICE_ID=$STRIPE_MONTHLY_PLAN_PRICE_ID
ENV STRIPE_ANNUAL_PLAN_PRICE_ID=$STRIPE_ANNUAL_PLAN_PRICE_ID
ENV STRIPE_LIFETIME_PLAN_PRICE_ID=$STRIPE_LIFETIME_PLAN_PRICE_ID

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