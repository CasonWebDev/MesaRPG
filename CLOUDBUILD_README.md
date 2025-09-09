# MesaRPG - Cloud Build Deployment

## Pré-requisitos

1. **Projeto GCP configurado** com:
   - Cloud Build API habilitada
   - Cloud Run API habilitada
   - Cloud SQL API habilitada
   - Secret Manager API habilitada
   - Container Registry habilitado

2. **Instância Cloud SQL** criada:
   - Nome: `mesarpg-db-instance`
   - Região: `us-central1`
   - Banco: `mesarpg`
   - Usuário: `mesarpg_user`

3. **Segredos no Secret Manager**:
   - `DATABASE_URL`: String de conexão PostgreSQL completa
   - `NEXTAUTH_SECRET`: Chave secreta para NextAuth

## Como fazer o deploy

### 1. Configurar segredos

```bash
# Criar segredo para DATABASE_URL
echo -n "postgresql://mesarpg_user:SUA_SENHA_AQUI@localhost/mesarpg?host=/cloudsql/SEU_PROJETO:us-central1:mesarpg-db-instance" | \
gcloud secrets versions add DATABASE_URL --data-file=-

# Criar segredo para NEXTAUTH_SECRET
echo -n "SUA_CHAVE_SECRETA_AQUI" | \
gcloud secrets versions add NEXTAUTH_SECRET --data-file=-
```

### 2. Executar o Cloud Build

```bash
gcloud builds submit --config cloudbuild.yaml
```

### 3. Verificar o deploy

```bash
# Verificar status do Cloud Run
gcloud run services describe mesarpg --region=us-central1

# Ver logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=mesarpg" --limit=50
```

## Arquivos de configuração

- `cloudbuild.yaml`: Configuração do Cloud Build
- `Dockerfile`: Imagem da aplicação
- `scripts/migrate.sh`: Script de migração do banco
- `.env.production`: Variáveis de ambiente para produção

## Troubleshooting

### Problemas comuns:

1. **Erro de conexão com Cloud SQL**:
   - Verifique se a instância está rodando
   - Confirme as permissões do service account
   - Valide a string de conexão no Secret Manager

2. **Erro nas migrações**:
   - Verifique os logs do Cloud Build
   - Teste a conexão manualmente com o Cloud SQL Proxy

3. **Erro no build da aplicação**:
   - Verifique se todas as dependências estão corretas
   - Confirme se o Next.js está configurado corretamente

### Logs úteis:

```bash
# Logs do Cloud Build
gcloud builds log --stream

# Logs do Cloud Run
gcloud run services logs read mesarpg --region=us-central1
```
