# 📧 Configuração de E-mail para Notificações

## Visão Geral

O sistema agora envia automaticamente todas as inscrições por e-mail para os destinatários configurados.

---

## 📝 Configurar E-mails

### 1. Editar o arquivo `.env` na pasta `backend`:

```bash
cd backend
notepad .env
```

### 2. Configurar destinatários:

```env
# Adicione múltiplos e-mails separados por vírgula
EMAIL_RECIPIENTS=mardeniferreira@gmail.com,outro@email.com,terceiro@email.com
```

---

## 🔧 Configuração SMTP

### Opção 1: Gmail (Recomendado para teste)

1. **Ative a verificação em 2 etapas** na sua conta Google
2. **Gere uma senha de app**: https://myaccount.google.com/apppasswords
3. Configure no `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app-gerada
EMAIL_FROM=seu-email@gmail.com
```

### Opção 2: Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@outlook.com
SMTP_PASS=sua-senha
EMAIL_FROM=seu-email@outlook.com
```

### Opção 3: Servidor SMTP Personalizado

```env
SMTP_HOST=mail.seudominio.com.br
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@seudominio.com.br
SMTP_PASS=sua-senha
EMAIL_FROM=noreply@seudominio.com.br
EMAIL_FROM_NAME=Câmara Municipal de Pilar
```

---

## 📬 O que é enviado por e-mail?

Cada inscrição enviada inclui:

✅ **E-mail HTML formatado** com todos os dados
✅ **Anexo JSON** com os dados estruturados
✅ **Link do Google Maps** com a localização do candidato
✅ **Protocolo e código do recrutador**

### Informações incluídas:

- 👤 Dados pessoais completos
- 📞 Contato (e-mail e telefone)
- 🏠 Endereço completo
- 🎓 Escolaridade
- ♿ Deficiência (se aplicável)
- 📍 Coordenadas GPS (latitude/longitude)
- 🔑 Código do recrutador usado
- 📋 Protocolo de inscrição
- 📅 Data e hora da inscrição

---

## 🧪 Testar Envio de E-mail

### 1. Configure o `.env` com suas credenciais
### 2. Instale as dependências:

```bash
cd backend
npm install
```

### 3. Inicie o servidor:

```bash
npm start
```

### 4. Faça uma inscrição de teste pelo frontend

### 5. Verifique o console do backend:

```
📧 Enviando e-mail com dados da inscrição...
✅ E-mail enviado com sucesso!
📧 Destinatários: mardeniferreira@gmail.com
📋 Message ID: <abc123@gmail.com>
```

---

## 🐳 Configurar E-mail no Docker

### Edite o `docker-compose.yml`:

```yaml
backend:
  environment:
    - NODE_ENV=production
    - PORT=5000
    - SMTP_HOST=smtp.gmail.com
    - SMTP_PORT=587
    - SMTP_SECURE=false
    - SMTP_USER=seu-email@gmail.com
    - SMTP_PASS=sua-senha-de-app
    - EMAIL_FROM=seu-email@gmail.com
    - EMAIL_RECIPIENTS=mardeniferreira@gmail.com,outro@email.com
```

Ou use arquivo `.env`:

```bash
docker-compose --env-file backend/.env up
```

---

## ⚠️ Troubleshooting

### E-mail não está sendo enviado?

1. **Verifique as credenciais SMTP** no `.env`
2. **Para Gmail**: Use senha de app, não a senha normal
3. **Verifique o console** para ver mensagens de erro
4. **Teste a conexão SMTP**:

```bash
# Dentro da pasta backend
node -e "require('./src/emailService').sendInscricaoEmail({nomeCompleto:'Teste',email:'teste@test.com',cpf:'000.000.000-00',rg:'0000000',dataNascimento:'2000-01-01',telefone:'(00)00000-0000',endereco:'Rua Teste',cidade:'Pilar',estado:'AL',cep:'00000-000',escolaridade:'ensino-medio-completo',latitude:'-9.5978',longitude:'-35.9575',codigoRecrutador:'TEST01',dataInscricao:new Date().toISOString()})"
```

### Gmail bloqueia o envio?

- Ative a **verificação em 2 etapas**
- Use **senha de app** em vez da senha normal
- Verifique se "Acesso a apps menos seguros" está permitido (se não usar 2FA)

### Outlook/Hotmail bloqueia?

- Verifique se a conta não está bloqueada
- Tente fazer login via navegador primeiro
- Pode ser necessário liberar "aplicativos e dispositivos"

---

## 📊 Logs e Monitoramento

Os logs de envio aparecem no console do backend:

```
✅ E-mail enviado com sucesso!
📧 Destinatários: mardeniferreira@gmail.com, outro@email.com
📋 Message ID: <1234567890.abc@gmail.com>
```

Se houver erro:

```
⚠️ E-mail não foi enviado: Invalid login: 535-5.7.8 Username and Password not accepted
```

---

## 🔐 Segurança

⚠️ **NUNCA commite o arquivo `.env` no Git!**

O arquivo `.gitignore` já está configurado para ignorar `.env`.

Use `.env.example` como referência para outros desenvolvedores.

---

## 💡 Dicas

1. **Múltiplos destinatários**: Separe por vírgula no `EMAIL_RECIPIENTS`
2. **Teste primeiro** com um e-mail pessoal antes de usar em produção
3. **Gmail**: Limite de 500 e-mails por dia (conta gratuita)
4. **Produção**: Use serviços profissionais (SendGrid, AWS SES, etc.)
5. **Anexo JSON**: Útil para importar dados em planilhas ou sistemas

---

## 📨 Exemplo de E-mail Recebido

Os destinatários receberão um e-mail HTML formatado com:

- **Cabeçalho** com logo e título
- **Seções organizadas** por tipo de informação
- **Destaque** para protocolo e código
- **Link direto** para Google Maps
- **Anexo JSON** com todos os dados estruturados

---

Para mais informações, consulte o arquivo `backend/src/emailService.js`.
