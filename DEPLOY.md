# 🚀 Guia de Deploy e Execução

## Sistema de Inscrição - Câmara Municipal de Pilar/AL

---

## 📋 Pré-requisitos

### Para executar com Docker (Recomendado):
- Docker Desktop instalado
- Docker Compose instalado

### Para executar sem Docker:
- Node.js 18+ instalado
- npm ou yarn instalado

---

## 🐳 Opção 1: Executar com Docker (Recomendado)

### 1. Build e Start dos Containers

Abra o terminal na pasta raiz do projeto (`job-offer`) e execute:

```bash
docker-compose up --build
```

Ou para executar em background:

```bash
docker-compose up -d --build
```

### 2. Acessar o Sistema

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/api/health

### 3. Parar os Containers

```bash
# Parar containers (mantém os dados)
docker-compose down

# Parar e REMOVER volumes (APAGA os dados)
docker-compose down -v
```

⚠️ **IMPORTANTE:** Use `docker-compose down -v` apenas se quiser **apagar todos os dados de inscrições**!

### 4. Ver Logs

```bash
# Todos os serviços
docker-compose logs -f

# Apenas frontend
docker-compose logs -f frontend

# Apenas backend
docker-compose logs -f backend
```

---

## 💻 Opção 2: Executar sem Docker

### 1. Instalar Dependências

#### Backend:
```bash
cd backend
npm install
```

#### Frontend:
```bash
cd frontend
npm install
```

### 2. Executar Backend

```bash
cd backend
npm start
```

O backend estará rodando em: http://localhost:5000

### 3. Executar Frontend (em outro terminal)

```bash
cd frontend
npm start
```

O frontend abrirá automaticamente em: http://localhost:3000

---

## 🌐 Deploy em Produção

### Deploy para Nuvem

Este sistema está pronto para deploy em qualquer plataforma que suporte Docker:

#### 1. **Heroku**

```bash
# Instalar Heroku CLI
# Login
heroku login

# Criar app
heroku create nome-do-app

# Build e push
heroku container:push web -a nome-do-app
heroku container:release web -a nome-do-app
```

#### 2. **AWS (EC2 com Docker)**

```bash
# Conectar na instância EC2
ssh -i sua-chave.pem ec2-user@seu-ip

# Instalar Docker
sudo yum update -y
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clonar projeto e executar
git clone seu-repositorio
cd job-offer
docker-compose up -d --build
```

#### 3. **Google Cloud Run**

```bash
# Build da imagem
gcloud builds submit --tag gcr.io/seu-projeto/job-offer

# Deploy
gcloud run deploy job-offer \
  --image gcr.io/seu-projeto/job-offer \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### 4. **Azure Container Instances**

```bash
# Login
az login

# Criar resource group
az group create --name job-offer-rg --location eastus

# Deploy
az container create \
  --resource-group job-offer-rg \
  --name job-offer-app \
  --image seu-registry/job-offer:latest \
  --dns-name-label job-offer-pilar \
  --ports 80
```

#### 5. **DigitalOcean App Platform**

1. Conecte seu repositório Git
2. Selecione "Docker" como tipo de build
3. Configure as portas: 3000 (frontend) e 5000 (backend)
4. Deploy automático

---

## 🔧 Configurações de Ambiente

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz se necessário:

```env
# Backend
NODE_ENV=production
PORT=5000

# Frontend
REACT_APP_API_URL=http://localhost:5000
## 📊 Acessar Dados das Inscrições

As inscrições são salvas em arquivos JSON e **persistem mesmo se o Docker for reiniciado**.

### 💾 Persistência de Dados

Os dados são armazenados em um **volume Docker nomeado** (`inscricoes-data`) que persiste independentemente do ciclo de vida dos containers..

---

## 📊 Acessar Dados das Inscrições

As inscrições são salvas em arquivos JSON na pasta `backend/data/`.

### Ver todas as inscrições via API:

### Acessar arquivos diretamente no volume Docker:

```bash
# Listar inscrições dentro do container
docker-compose exec backend ls -la /app/data

# Copiar todos os dados para sua máquina
docker cp job-offer-backend-1:/app/data ./inscricoes-backup

# Visualizar uma inscrição específica
docker-compose exec backend cat /app/data/inscricao_*.json
```

Cada inscrição é salva como: `inscricao_[timestamp]_[CODIGO].json`

### 🔒 Backup dos Dados

```bash
# Criar backup de todas as inscrições
docker cp job-offer-backend-1:/app/data ./backup-inscricoes-$(date +%Y%m%d)

# Restaurar backup (se necessário)
docker cp ./backup-inscricoes-20260306/. job-offer-backend-1:/app/data
```
ls -la
```

Cada inscrição é salva como: `inscricao_[timestamp]_[CODIGO].json`

---

## 🔐 Códigos de Acesso

Os 50 códigos válidos estão em:
- `backend/src/validCodes.js` (código fonte)
- `CODIGOS_VALIDOS.md` (documentação)

### Testar um código:

```bash
# Validar código do recrutador
curl http://localhost:5000/api/validate-codigo-recrutador/CM2024

# Resposta esperada:
{"valid":true,"message":"Código do recrutador válido"}
```

**Nota:** Após uma inscrição ser submetida, o código usado se torna inválido automaticamente.

---

## 📱 Testando Acesso Mobile

### Opção 1: Usando ngrok (para teste externo)

```bash
# Instalar ngrok: https://ngrok.com/

# Expor porta 3000
ngrok http 3000

# Use a URL gerada para acessar pelo celular
# Exemplo: https://abc123.ngrok.io/?codigo-recrutador=CM2024
```

### Opção 2: Mesma rede WiFi

1. Descubra seu IP local:
   - Windows: `ipconfig`
2. Acesse pelo celular:
   ```
### Containers Docker não iniciam:

```bash
# Limpar containers (MANTÉM os dados das inscrições)
docker-compose down
docker system prune -a
docker-compose up --build

# ⚠️ Se quiser apagar TUDO incluindo dados:
docker-compose down -v
docker system prune -a --volumes
docker-compose up --build
```🐛 Troubleshooting

### Porta já em uso:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Containers Docker não iniciam:

```bash
# Limpar tudo e recomeçar
docker-compose down -v
docker system prune -a
docker-compose up --build
```

### Frontend não conecta ao Backend:
- [ ] Configurar domínio personalizado
- [ ] Configurar SSL/HTTPS
- [ ] Configurar backup automático dos dados
- [ ] Testar persistência dos dados (reiniciar container e verificar)
---

## 📧 Suporte

Para dúvidas ou problemas:
- Verifique os logs: `docker-compose logs -f`
- Acesse: https://www.pilar.al.leg.br/

---

## ✅ Checklist Pré-Deploy

- [ ] Testar validação de código
- [ ] Testar acesso apenas mobile
- [ ] Testar geolocalização
- [ ] Testar submissão de formulário
- [ ] Verificar se inscrições são salvas
- [ ] Testar em diferentes dispositivos móveis
- [ ] Configurar domínio personalizado
- [ ] Configurar SSL/HTTPS
- [ ] Fazer backup da pasta `backend/data`
