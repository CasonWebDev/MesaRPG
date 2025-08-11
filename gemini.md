## Contexto do Projeto MesaRPG

### Arquitetura e Configuração
- O projeto utiliza um `server.js` customizado. As variáveis de ambiente de `.env` são carregadas globalmente através do script `dev` no `package.json` (`node -r dotenv/config server.js`).
- A UI é construída com Next.js (App Router), TypeScript, TailwindCSS e shadcn/ui. As notificações são gerenciadas pela biblioteca `Sonner`.
- O banco de dados é PostgreSQL, gerenciado com Prisma.

### Lógica de Negócio: Sistema de Planos e Assinaturas
- A lógica de negócio crítica relacionada à expiração de planos e ao estado das campanhas (arquivada/ativa) é centralizada no backend, no arquivo `lib/auth.ts`, e executada durante o processo de login do usuário.
- **Plano Gratuito**: Limite de 1 campanha ativa.
- **Planos Pagos (Mensal/Anual/Vitalício)**: Campanhas ilimitadas. Ao fazer login com um plano pago, todas as campanhas do usuário que estavam arquivadas são automaticamente reativadas (`isArchived: false`, `expiresAt: null`).
- **Plano de Créditos**: Permite criar ou reativar campanhas gastando créditos. Cada ativação dura 30 dias, após os quais a campanha é arquivada.
- **Downgrade de Plano**: Quando um plano pago expira, o sistema verifica se o usuário possui créditos. Se sim, o plano muda para `CREDITS`. Caso contrário, muda para `FREE`. Ao mudar para `FREE`, todas as campanhas, exceto a mais recente, são arquivadas.

### Fluxo de Trabalho de Desenvolvimento
- O fluxo de trabalho preferencial é agrupar todos os commits relacionados a uma feature ou correção em um único commit final, utilizando `git reset --soft`.
