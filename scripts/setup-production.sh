#!/bin/bash

# Setup script para deploy em produção
echo "🚀 Iniciando setup de produção do MesaRPG..."

# Verificar se as variáveis de ambiente estão definidas
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Erro: DATABASE_URL não está definida"
    exit 1
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "❌ Erro: NEXTAUTH_SECRET não está definida"
    exit 1
fi

if [ -z "$NEXTAUTH_URL" ]; then
    echo "❌ Erro: NEXTAUTH_URL não está definida"
    exit 1
fi

echo "✅ Variáveis de ambiente verificadas"

# Instalar dependências
echo "📦 Instalando dependências..."
npm install --legacy-peer-deps

# Gerar cliente Prisma
echo "🗄️ Gerando cliente Prisma..."
npx prisma generate

# Executar migrações
echo "🔄 Executando migrações do banco de dados..."
npx prisma migrate deploy

# Build da aplicação
echo "🏗️ Fazendo build da aplicação..."
npm run build

# Verificar se o build foi bem-sucedido
if [ $? -eq 0 ]; then
    echo "✅ Setup de produção concluído com sucesso!"
    echo "🎯 Execute 'npm start' para iniciar a aplicação"
else
    echo "❌ Erro durante o build da aplicação"
    exit 1
fi