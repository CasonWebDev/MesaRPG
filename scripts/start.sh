#!/bin/bash

echo "🚀 Starting MesaRPG..."

echo "📋 Environment check:"
echo "DATABASE_URL: ${DATABASE_URL:0:50}..."
echo "NODE_ENV: $NODE_ENV"

echo "🗄️ Setting up database..."
npx prisma generate
echo "✅ Prisma client generated"

echo "🔄 Syncing database schema..."
npx prisma db push --force-reset --accept-data-loss --skip-generate
echo "✅ Database schema synced"

echo "🎮 Starting application..."
npm start