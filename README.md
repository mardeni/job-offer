# Sistema de Inscrição - Câmara Municipal de Pilar/AL

Sistema web para recebimento de inscrições para o cargo de Assistente Legislativo da Câmara Municipal de Pilar - Alagoas.

## Vaga
- **Cargo**: Assistente Legislativo
- **Salário**: R$ 3.100,00 (CLT) + Benefícios
- **Requisitos**: Ensino Médio Completo
- **Atividades**: Administrativas

## Como executar

### Com Docker (Recomendado)
```bash
docker-compose up --build
```

O sistema estará disponível em: http://localhost:3000

### Sem Docker

#### Backend
```bash
cd backend
npm install
npm start
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

## Acesso ao Sistema

O sistema requer um código válido de 6 caracteres passado via URL:
```
http://localhost:3000/?codigo-recrutador=ABC123
```

**Importante:** Cada código só pode ser usado uma vez. Após a submissão do formulário, o código se torna inválido.

## Observações
- O sistema requer acesso móvel (celular/tablet)
- Geolocalização deve estar ativada
- A localização é coletada para verificar residência em Pilar/AL e cálculo de vale-transporte
- **Notificações por e-mail**: Todas as inscrições são enviadas automaticamente para os e-mails configurados
- Veja `EMAIL_CONFIG.md` para configurar notificações por e-mail
