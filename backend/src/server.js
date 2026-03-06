const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');
const VALID_CODES = require('./validCodes');
const { sendInscricaoEmail } = require('./emailService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Diretório para armazenar inscrições
const DATA_DIR = path.join(__dirname, '../data');
fs.ensureDirSync(DATA_DIR);

// Arquivo para rastrear códigos usados
const USED_CODES_FILE = path.join(DATA_DIR, 'used_codes.json');

// Carregar códigos já usados
let usedCodes = [];
if (fs.existsSync(USED_CODES_FILE)) {
  usedCodes = fs.readJsonSync(USED_CODES_FILE);
}

// Endpoint de health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Sistema de Inscrição - Câmara Municipal de Pilar/AL' });
});

// Endpoint para validar código do recrutador
app.get('/api/validate-codigo-recrutador/:codigo', (req, res) => {
  const { codigo } = req.params;
  
  if (!codigo) {
    return res.status(400).json({ valid: false, message: 'Código do recrutador não fornecido' });
  }

  const codigoUpper = codigo.toUpperCase();
  const isValidCode = VALID_CODES.includes(codigoUpper);
  const isUsed = usedCodes.includes(codigoUpper);
  
  if (!isValidCode) {
    return res.status(403).json({ valid: false, message: 'Código do recrutador inválido' });
  }
  
  if (isUsed) {
    return res.status(403).json({ valid: false, message: 'Este código do recrutador já foi utilizado' });
  }
  
  res.json({ valid: true, message: 'Código do recrutador válido' });
});

// Endpoint para submeter inscrição
app.post('/api/submit', async (req, res) => {
  try {
    const { codigo, formData } = req.body;

    // Validar código do recrutador
    if (!codigo || !VALID_CODES.includes(codigo.toUpperCase())) {
      return res.status(403).json({ success: false, message: 'Código do recrutador inválido' });
    }

    const codigoUpper = codigo.toUpperCase();
    
    // Verificar se código já foi usado
    if (usedCodes.includes(codigoUpper)) {
      return res.status(403).json({ success: false, message: 'Este código do recrutador já foi utilizado' });
    }

    // Validar dados obrigatórios
    const requiredFields = [
      'nomeCompleto',
      'cpf',
      'rg',
      'dataNascimento',
      'email',
      'telefone',
      'endereco',
      'cidade',
      'estado',
      'cep',
      'latitude',
      'longitude'
    ];

    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Campos obrigatórios faltando: ${missingFields.join(', ')}`
      });
    }

    // Criar objeto de inscrição
    const inscricao = {
      codigoRecrutador: codigoUpper,
      dataInscricao: new Date().toISOString(),
      ...formData
    };

    // Salvar em arquivo JSON
    const timestamp = Date.now();
    const filename = `inscricao_${timestamp}_${codigoUpper}.json`;
    const filepath = path.join(DATA_DIR, filename);
    await fs.writeJson(filepath, inscricao, { spaces: 2 });

    // Marcar código como usado
    usedCodes.push(codigoUpper);
    await fs.writeJson(USED_CODES_FILE, usedCodes, { spaces: 2 });

    // Enviar e-mail com os dados da inscrição
    console.log('📧 Enviando e-mail com dados da inscrição...');
    const emailResult = await sendInscricaoEmail(inscricao);
    
    if (emailResult.success) {
      console.log('✅ E-mail enviado com sucesso!');
    } else {
      console.log('⚠️ E-mail não foi enviado:', emailResult.message || emailResult.error);
    }

    res.json({
      success: true,
      message: 'Inscrição realizada com sucesso!',
      protocolo: timestamp
    });

  } catch (error) {
    console.error('Erro ao processar inscrição:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar inscrição. Tente novamente.'
    });
  }
});

// Endpoint para listar inscrições (admin)
app.get('/api/inscricoes', async (req, res) => {
  try {
    const files = await fs.readdir(DATA_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    const inscricoes = [];
    for (const file of jsonFiles) {
      const data = await fs.readJson(path.join(DATA_DIR, file));
      inscricoes.push(data);
    }

    res.json({ total: inscricoes.length, inscricoes });
  } catch (error) {
    console.error('Erro ao listar inscrições:', error);
    res.status(500).json({ success: false, message: 'Erro ao listar inscrições' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`📍 Total de códigos válidos: ${VALID_CODES.length}`);
});
