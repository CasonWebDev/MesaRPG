# Configuração e Deploy

## Visão Geral

Este guia abrange a configuração completa do ambiente de desenvolvimento, produção e deploy do MesaRPG. O projeto utiliza Next.js 15, Prisma, Socket.IO e SQLite, com suporte a deployment em diversas plataformas.

## Requisitos do Sistema

### Desenvolvimento
- **Node.js**: 18.17.0 ou superior
- **npm**: 9.0.0 ou superior (ou yarn/pnpm)
- **Git**: Para controle de versão
- **Sistema Operacional**: Windows, macOS ou Linux

### Produção
- **Servidor**: VPS ou cloud provider (Vercel, Railway, etc.)
- **Memória**: Mínimo 1GB RAM recomendado
- **Storage**: 5GB para início, escalável conforme uso
- **Database**: SQLite (desenvolvimento) ou PostgreSQL (produção)

## Configuração do Ambiente de Desenvolvimento

### 1. Clone do Repositório
```bash
# Clone o repositório
git clone <repository-url>
cd mesarpg-shell-v1

# Verificar branch principal
git branch
git checkout main
```

### 2. Instalação de Dependências
```bash
# Instalar dependências com legacy peer deps
npm install --legacy-peer-deps

# Ou usando yarn
yarn install

# Ou usando pnpm
pnpm install
```

### 3. Configuração de Variáveis de Ambiente
```bash
# Copiar arquivo de exemplo
cp .env.example .env.local

# Editar variáveis necessárias
```

**Arquivo `.env.local`:**
```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key-here-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Socket.IO (opcional para desenvolvimento)
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"

# Upload de arquivos
MAX_FILE_SIZE=52428800  # 50MB em bytes
UPLOAD_DIR="./public/uploads"

# Environment
NODE_ENV="development"
```

### 4. Configuração do Banco de Dados
```bash
# Gerar cliente Prisma
npx prisma generate

# Executar migrações
npx prisma migrate dev

# (Opcional) Seed inicial
npx prisma db seed
```

### 5. Executar em Desenvolvimento
```bash
# Modo desenvolvimento com hot reload
npm run dev

# Ou especificar porta
npm run dev -- --port 3001
```

O projeto estará disponível em `http://localhost:3000`

## Estrutura de Configuração

### package.json
```json
{
  "name": "mesarpg",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset",
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next-auth": "^4.24.0",
    "prisma": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "socket.io": "^4.7.0",
    "socket.io-client": "^4.7.0",
    "bcryptjs": "^2.4.3",
    "sharp": "^0.32.0",
    "tailwindcss": "^3.3.0",
    "@tailwindcss/typography": "^0.5.0",
    "lucide-react": "^0.290.0",
    "sonner": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/bcryptjs": "^2.4.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^15.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Habilitar features experimentais se necessário
  },
  images: {
    domains: [
      'localhost',
      'your-domain.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      }
    ]
  },
  // Configuração para upload de arquivos
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
}
```

### prisma/schema.prisma
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// Modelos completos conforme documentação anterior
// Ver arquivo schema.prisma no projeto para versão completa
```

## Configuração de Produção

### 1. Variáveis de Ambiente de Produção
```env
# Database (PostgreSQL recomendado para produção)
DATABASE_URL="postgresql://user:password@localhost:5432/mesarpg"

# NextAuth.js
NEXTAUTH_SECRET="your-production-secret-key-64-chars-minimum"
NEXTAUTH_URL="https://your-domain.com"

# Socket.IO
NEXT_PUBLIC_SOCKET_URL="https://your-domain.com"

# Upload settings
MAX_FILE_SIZE=52428800
UPLOAD_DIR="/app/public/uploads"

# Environment
NODE_ENV="production"

# Database SSL (se necessário)
DATABASE_SSL="require"

# Logging
LOG_LEVEL="info"
```

### 2. Build de Produção
```bash
# Instalar dependências de produção
npm ci --only=production

# Gerar cliente Prisma
npx prisma generate

# Build da aplicação
npm run build

# Executar migrações
npx prisma migrate deploy

# Iniciar aplicação
npm start
```

### 3. Docker Configuration

**Dockerfile:**
```dockerfile
# Dockerfile
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Instalar dependências
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Builder
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gerar Prisma client
RUN npx prisma generate

# Build da aplicação
RUN npm run build

# Runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar Prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/mesarpg
      - NEXTAUTH_SECRET=your-secret-key
      - NEXTAUTH_URL=http://localhost:3000
    depends_on:
      - db
    volumes:
      - uploads:/app/public/uploads

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=mesarpg
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
  uploads:
```

## Deploy em Plataformas

### 1. Vercel (Recomendado)

**vercel.json:**
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "framework": "nextjs",
  "regions": ["cle1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "DATABASE_URL": "@database_url",
    "NEXTAUTH_SECRET": "@nextauth_secret",
    "NEXTAUTH_URL": "@nextauth_url"
  }
}
```

**Deploy steps:**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Configurar variáveis de ambiente
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL

# Deploy de produção
vercel --prod
```

### 2. Railway

**railway.json:**
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Deploy steps:**
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Inicializar projeto
railway init

# Adicionar variáveis de ambiente
railway variables set DATABASE_URL="postgresql://..."
railway variables set NEXTAUTH_SECRET="your-secret"

# Deploy
railway up
```

### 3. VPS Manual

**Setup script (setup.sh):**
```bash
#!/bin/bash

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Configurar PostgreSQL
sudo -u postgres createdb mesarpg
sudo -u postgres createuser --interactive

# Clone do projeto
git clone <repository-url> /var/www/mesarpg
cd /var/www/mesarpg

# Instalar dependências
npm ci --only=production

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com dados de produção

# Build da aplicação
npm run build

# Executar migrações
npx prisma migrate deploy

# Configurar PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [
    {
      name: 'mesarpg',
      script: 'npm',
      args: 'start',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
}
```

## Configuração de Database

### SQLite (Desenvolvimento)
```bash
# Configuração automática com Prisma
npx prisma migrate dev --name init
```

### PostgreSQL (Produção)
```sql
-- Criar database
CREATE DATABASE mesarpg;

-- Criar usuário
CREATE USER mesarpg_user WITH PASSWORD 'secure_password';

-- Dar permissões
GRANT ALL PRIVILEGES ON DATABASE mesarpg TO mesarpg_user;

-- Configurar conexão
-- DATABASE_URL="postgresql://mesarpg_user:secure_password@localhost:5432/mesarpg"
```

### MySQL (Alternativa)
```sql
-- Criar database
CREATE DATABASE mesarpg CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Criar usuário
CREATE USER 'mesarpg_user'@'localhost' IDENTIFIED BY 'secure_password';

-- Dar permissões
GRANT ALL PRIVILEGES ON mesarpg.* TO 'mesarpg_user'@'localhost';
FLUSH PRIVILEGES;

-- Configurar conexão
-- DATABASE_URL="mysql://mesarpg_user:secure_password@localhost:3306/mesarpg"
```

## WebSocket Configuration

### Custom Server (server.js)
```javascript
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const { initializeSocket } = require('./lib/socket-bridge')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT, 10) || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Inicializar Socket.IO
  const io = initializeSocket(server)

  server
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})
```

## Configuração de SSL

### Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Backup e Recuperação

### Script de Backup
```bash
#!/bin/bash

# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mesarpg"
DB_NAME="mesarpg"

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup do banco de dados
if [ "$NODE_ENV" = "production" ]; then
    # PostgreSQL
    pg_dump $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql
else
    # SQLite
    cp ./dev.db $BACKUP_DIR/db_backup_$DATE.db
fi

# Backup de uploads
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz ./public/uploads

# Remover backups antigos (manter 7 dias)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

### Automatizar Backup
```bash
# Adicionar ao crontab
crontab -e

# Backup diário às 2:00 AM
0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
```

## Monitoramento

### Health Check Endpoint
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    // Check disk space (optional)
    const stats = require('fs').statSync('.')
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime()
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 500 })
  }
}
```

### PM2 Monitoring
```bash
# Instalar PM2 Plus (opcional)
pm2 install pm2-server-monit

# Monitorar processos
pm2 monit

# Logs em tempo real
pm2 logs

# Restart automático em caso de falha
pm2 startup
pm2 save
```

## Performance Optimization

### Next.js Configuration
```javascript
// next.config.js optimization
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  
  // Otimização de bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false
      }
    }
    return config
  },
  
  // Otimização de imagens
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Headers de cache
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  }
}
```

## Troubleshooting

### Problemas Comuns

#### 1. Erro de Build
```bash
# Limpar cache
rm -rf .next
rm -rf node_modules
npm install --legacy-peer-deps
npm run build
```

#### 2. Erro de Database
```bash
# Reset database
npx prisma migrate reset
npx prisma migrate dev
```

#### 3. WebSocket não conecta
- Verificar firewall/proxy
- Confirmar porta 3000 disponível
- Verificar variável NEXT_PUBLIC_SOCKET_URL

#### 4. Upload não funciona
- Verificar permissões de pasta
- Confirmar MAX_FILE_SIZE
- Verificar proxy_max_body_size no Nginx

### Logs e Debug

```bash
# Logs detalhados
DEBUG=* npm run dev

# Logs específicos do Prisma
DEBUG="prisma:*" npm run dev

# Logs do Next.js
NEXT_DEBUG=1 npm run dev
```

## Segurança

### Checklist de Segurança
- [ ] HTTPS configurado
- [ ] Variáveis de ambiente seguras
- [ ] Database com autenticação
- [ ] Rate limiting implementado
- [ ] Headers de segurança configurados
- [ ] Validação de uploads
- [ ] Backup automático configurado
- [ ] Monitoring implementado

### Variáveis Críticas
```env
# Gerar secret seguro
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Database com SSL
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# Upload security
MAX_FILE_SIZE=52428800
ALLOWED_FILE_TYPES="image/jpeg,image/png,application/pdf"
```

Este guia cobre todos os aspectos necessários para configurar e deployar o MesaRPG em ambiente de produção. Para questões específicas, consulte a documentação das respectivas plataformas ou abra uma issue no repositório.