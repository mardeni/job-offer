#!/bin/bash
# Script de Backup - Inscrições Câmara Municipal de Pilar/AL
# Execute este script periodicamente para fazer backup dos dados

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="inscricoes_backup_$TIMESTAMP"

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

# Verificar se container está rodando
CONTAINER_NAME=$(docker ps --filter "name=backend" --format "{{.Names}}" | head -n 1)

if [ ! -z "$CONTAINER_NAME" ]; then
    echo "📦 Fazendo backup dos dados..."
    
    # Copiar dados do container
    docker cp "$CONTAINER_NAME:/app/data" "$BACKUP_DIR/$BACKUP_NAME"
    
    if [ $? -eq 0 ]; then
        echo "✅ Backup realizado com sucesso!"
        echo "📁 Localização: $BACKUP_DIR/$BACKUP_NAME"
        
        # Contar arquivos
        FILE_COUNT=$(find "$BACKUP_DIR/$BACKUP_NAME" -name "inscricao_*.json" | wc -l)
        echo "📊 Total de inscrições: $FILE_COUNT"
    else
        echo "❌ Erro ao fazer backup!"
        exit 1
    fi
else
    echo "⚠️ Container backend não está rodando!"
    echo "Execute: docker-compose up -d"
    exit 1
fi

echo ""
echo "💡 Dica: Configure este script no cron para backups automáticos!"
echo "   Exemplo: 0 2 * * * /caminho/para/backup-inscricoes.sh"
