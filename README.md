# MesaRPG 🎲

![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![Version](https://img.shields.io/badge/Version-v1.2-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

**MesaRPG** é uma plataforma Virtual Tabletop (VTT) moderna e completa, construída com Next.js 15. Oferece uma experiência de RPG online imersiva para mestres e jogadores, com recursos em tempo real, sistema de personagens dinâmico, grid tático funcional e uma interface intuitiva.

<!-- Adicione um screenshot ou GIF da aplicação aqui para um grande impacto visual -->
<!-- ![MesaRPG Screenshot](./docs/screenshot.png) -->

---

## Índice

- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
  - [Pré-requisitos](#pré-requisitos)
  - [Instalação](#instalação)
- [📜 Scripts Disponíveis](#-scripts-disponíveis)
- [🤝 Contribuindo](#-contribuindo)
- [📄 Licença](#-licença)

---

## ✨ Features

- **🎲 Interface de Jogo Completa**: Sidebar unificada, chat em tempo real com comandos de dados (`/r`), grid tático funcional e visualização de jogadores conectados.
- **👥 Sistema de Personagens Avançado**: CRUD completo para PCs, NPCs e Criaturas, com fichas baseadas em templates dinâmicos.
- **🗺️ Mapas e Tokens**: Upload de mapas personalizados, ativação em tempo real e sistema de tokens com movimento livre e sincronizado.
- **📄 Handouts (Notas)**: Criação e compartilhamento de documentos e imagens entre o mestre e os jogadores, com controle de acesso e notificações.
- **⚙️ Gerenciamento de Campanha**: Sistema de convites com links únicos, editor de templates de fichas e configurações gerais da campanha.
- **🎨 Temas**: Suporte a temas claro e escuro com persistência no `localStorage`.
- **💳 Sistema de Planos**: Modelo de assinatura com múltiplos níveis (Gratuito, Mensal, Anual, etc.) e regras de negócio para limitação de recursos.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **UI**: TailwindCSS, shadcn/ui, Sonner (notificações)
- **Backend**: Next.js API Routes, Node.js (Custom Server)
- **Banco de Dados**: PostgreSQL + Prisma ORM
- **Autenticação**: NextAuth.js
- **Comunicação em Tempo Real**: Socket.IO
- **Segurança**: ALTCHA (proteção anti-bot)

---

## 🚀 Getting Started

Siga estas instruções para obter uma cópia do projeto e executá-la em sua máquina local para desenvolvimento e testes.

### Pré-requisitos

- [Node.js](https://nodejs.org/) (v18 ou superior)
- [Docker](https://www.docker.com/) e Docker Compose
- [Git](https://git-scm.com/)

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/CasonWebDev/MesaRPG.git
    cd MesaRPG
    ```

2.  **Instale as dependências:**
    ```bash
    npm install --legacy-peer-deps
    ```

3.  **Configure as Variáveis de Ambiente:**
    Crie um arquivo chamado `.env` na raiz do projeto e adicione o seguinte conteúdo. Este arquivo é necessário para o banco de dados e a autenticação.

    ```env
    # URL do Banco de Dados (Docker)
    DATABASE_URL="postgresql://test:test@localhost:5433/mesarpg_test"

    # Configuração do NextAuth
    NEXTAUTH_URL="http://localhost:3000"
    NEXTAUTH_SECRET="gere-uma-secret-segura-aqui" # Ex: use `openssl rand -base64 32`

    # Chave para o ALTCHA
    ALTCHA_HMAC_KEY="gere-uma-outra-secret-segura-aqui"
    ```

4.  **Inicie o Banco de Dados:**
    Execute o contêiner do PostgreSQL com Docker Compose.
    ```bash
    docker-compose -f docker-compose.test.yml up -d
    ```

5.  **Aplique as Migrações do Banco de Dados:**
    Este comando irá criar as tabelas necessárias no banco de dados.
    ```bash
    npx prisma migrate dev
    ```

6.  **Execute o Servidor de Desenvolvimento:**
    ```bash
    npm run dev
    ```

    A aplicação estará disponível em [http://localhost:3000](http://localhost:3000).

---

## 📜 Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento.
- `npm run build`: Compila a aplicação para produção.
- `npm run start`: Inicia o servidor de produção.
- `npm run lint`: Executa o linter para verificar a qualidade do código.
- `npm run test`: Executa os testes unitários e de integração.

---

## 🤝 Contribuindo

Contribuições são o que tornam a comunidade de código aberto um lugar incrível para aprender, inspirar e criar. Qualquer contribuição que você fizer será **muito apreciada**.

1.  Faça um **Fork** do projeto.
2.  Crie sua **Feature Branch** (`git checkout -b feature/AmazingFeature`).
3.  Faça o **Commit** de suas alterações (`git commit -m 'feat: Add some AmazingFeature'`).
4.  Faça o **Push** para a Branch (`git push origin feature/AmazingFeature`).
5.  Abra um **Pull Request**.

Para mais detalhes, consulte o arquivo `CONTRIBUTING.md` (se existir) e o template de Pull Request.

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.
