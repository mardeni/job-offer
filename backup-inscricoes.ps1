# Script de Backup - Inscrições Câmara Municipal de Pilar/AL
# Execute este script periodicamente para fazer backup dos dados

$BackupDir = ".\backups"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupName = "inscricoes_backup_$Timestamp"

# Criar diretório de backup se não existir
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
    Write-Host "✅ Diretório de backup criado: $BackupDir" -ForegroundColor Green
}

# Verificar se container está rodando
$ContainerRunning = docker ps --filter "name=backend" --format "{{.Names}}"

if ($ContainerRunning) {
    Write-Host "📦 Fazendo backup dos dados..." -ForegroundColor Cyan
    
    # Copiar dados do container
    docker cp ${ContainerRunning}:/app/data "$BackupDir\$BackupName"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backup realizado com sucesso!" -ForegroundColor Green
        Write-Host "📁 Localização: $BackupDir\$BackupName" -ForegroundColor Yellow
        
        # Contar arquivos
        $FileCount = (Get-ChildItem "$BackupDir\$BackupName" -Filter "inscricao_*.json").Count
        Write-Host "📊 Total de inscrições: $FileCount" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Erro ao fazer backup!" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️ Container backend não está rodando!" -ForegroundColor Yellow
    Write-Host "Execute: docker-compose up -d" -ForegroundColor Yellow
}

Write-Host "`n💡 Dica: Configure este script no Agendador de Tarefas do Windows para backups automáticos!" -ForegroundColor Cyan
