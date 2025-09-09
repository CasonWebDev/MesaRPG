# Multi-stage build for optimization
FROM node:18-alpine AS base

# Install dependencies needed for native modules
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Dependencies stage
FROM base AS deps

# Copy package files
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies (optimized for Cloud Build)
RUN npm ci --legacy-peer-deps --frozen-lockfile --prefer-offline --no-audit --no-fund

# Generate Prisma client
RUN npx prisma generate

# Builder stage
FROM base AS builder

# Accept build arguments
ARG NEXTAUTH_SECRET
ARG STRIPE_SECRET_KEY
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG STRIPE_WEBHOOK_SECRET
ARG STRIPE_MONTHLY_PLAN_PRICE_ID
ARG STRIPE_ANNUAL_PLAN_PRICE_ID
ARG STRIPE_LIFETIME_PLAN_PRICE_ID
ARG ALTCHA_HMAC_KEY
ARG NEXTAUTH_URL

# Set environment variables for build time
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET
ENV STRIPE_MONTHLY_PLAN_PRICE_ID=$STRIPE_MONTHLY_PLAN_PRICE_ID
ENV STRIPE_ANNUAL_PLAN_PRICE_ID=$STRIPE_ANNUAL_PLAN_PRICE_ID
ENV STRIPE_LIFETIME_PLAN_PRICE_ID=$STRIPE_LIFETIME_PLAN_PRICE_ID
ENV ALTCHA_HMAC_KEY=$ALTCHA_HMAC_KEY
ENV NEXTAUTH_URL=$NEXTAUTH_URL

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.next/cache ./.next/cache

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the public folder
COPY --from=builder /app/public ./public

# Create .next directory and set permissions
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy the built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]