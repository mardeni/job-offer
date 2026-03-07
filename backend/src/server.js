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
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(bodyParser.json());

// Diretório para armazenar inscrições
const DATA_DIR = path.join(__dirname, '../data');
fs.ensureDirSync(DATA_DIR);

// Arquivo para rastrear códigos usados
const USED_CODES_FILE = path.join(DATA_DIR, 'used_codes.json');

// Carregar códigos já usados (contador por código)
let usedCodes = {};
if (fs.existsSync(USED_CODES_FILE)) {
  const storedCodes = fs.readJsonSync(USED_CODES_FILE);
  if (Array.isArray(storedCodes)) {
    usedCodes = storedCodes.reduce((acc, code) => {
      const normalized = String(code).toUpperCase();
      acc[normalized] = (acc[normalized] || 0) + 1;
      return acc;
    }, {});
  } else if (storedCodes && typeof storedCodes === 'object') {
    usedCodes = storedCodes;
  }
}

const getCodeCount = (code) => usedCodes[code] || 0;
const MAX_USES_PER_CODE = 5;
const isLimitReached = (code) => getCodeCount(code) >= MAX_USES_PER_CODE;

// Endpoint de health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Sistema de Inscrição em Vagas de Emprego' });
});

// Endpoint para validar código da vaga
app.get('/api/validate-codigo-vaga/:codigo', (req, res) => {
  const { codigo } = req.params;
  
  if (!codigo) {
    return res.status(400).json({ valid: false, message: 'Código da vaga não fornecido' });
  }

  const codigoUpper = codigo.toUpperCase();
  const isValidCode = VALID_CODES.includes(codigoUpper);
  if (!isValidCode) {
    return res.status(403).json({ valid: false, message: 'Código da vaga inválido' });
  }
  
  if (isLimitReached(codigoUpper)) {
    return res.status(403).json({ valid: false, message: 'Inscrições suspensas.' });
  }
  
  res.json({ valid: true, message: 'Código da vaga válido' });
});

// Endpoint para submeter inscrição
app.post('/api/submit', async (req, res) => {
  try {
    const { codigo, formData } = req.body;

    // Validar código da vaga
    if (!codigo || !VALID_CODES.includes(codigo.toUpperCase())) {
      return res.status(403).json({ success: false, message: 'Código da vaga inválido' });
    }

    const codigoUpper = codigo.toUpperCase();
    
    // Verificar limite de inscrições por código
    if (isLimitReached(codigoUpper)) {
      return res.status(403).json({ success: false, message: 'Inscrições suspensas.' });
    }

    // Validar dados obrigatórios
    const requiredFields = [
      'nomeCompleto',
      'cpf',
      'dataNascimento',
      'email',
      'telefone',
      'endereco',
      'cidade',
      'estado',
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

    // Incrementar contador de inscrições do código
    usedCodes[codigoUpper] = getCodeCount(codigoUpper) + 1;
    await fs.writeJson(USED_CODES_FILE, usedCodes, { spaces: 2 });

    // Enviar e-mail com os dados da inscrição
    console.log('📧 Enviando e-mail com dados da inscrição...');
    const emailResult = await sendInscricaoEmail(inscricao);

    if (emailResult.success) {
      console.log('✅ E-mail enviado com sucesso!');
    } else {
      console.log('⚠️ E-mail não foi enviado:', emailResult.message || emailResult.error);
    }

    const emailSent = emailResult.success === true;
    const emailError = emailSent
      ? null
      : (emailResult.message || emailResult.error || 'Falha ao enviar e-mail');

    res.json({
      success: true,
      message: emailSent
        ? 'Inscrição realizada com sucesso!'
        : 'Inscrição registrada, mas o e-mail não foi enviado.',
      protocolo: timestamp,
      emailSent: emailSent,
      emailError: emailError
    });

  } catch (error) {
    console.error('Erro ao processar inscrição:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar inscrição. Tente novamente.'
    });
  }
});

// Endpoint para notificar inscrição sem localização
app.post('/api/submit-draft', async (req, res) => {
  try {
    const { codigo, formData } = req.body;

    if (!codigo || !VALID_CODES.includes(codigo.toUpperCase())) {
      return res.status(403).json({ success: false, message: 'Código da vaga inválido' });
    }

    const codigoUpper = codigo.toUpperCase();

    if (isLimitReached(codigoUpper)) {
      return res.status(403).json({ success: false, message: 'Inscrições suspensas.' });
    }

    if (!formData || typeof formData !== 'object') {
      return res.status(400).json({ success: false, message: 'Dados do formulário inválidos' });
    }

    const requiredFields = [
      'nomeCompleto',
      'cpf',
      'dataNascimento',
      'email',
      'telefone',
      'endereco',
      'cidade',
      'estado'
    ];

    const missingFields = requiredFields.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Campos obrigatórios faltando: ${missingFields.join(', ')}`
      });
    }

    const inscricao = {
      codigoRecrutador: codigoUpper,
      dataInscricao: new Date().toISOString(),
      ...formData,
      localizacaoPendente: true
    };

    console.log('📧 Enviando e-mail de pré-inscrição (localização pendente)...');
    const emailResult = await sendInscricaoEmail(inscricao);

    if (!emailResult.success) {
      console.log('⚠️ E-mail de pré-inscrição não foi enviado:', emailResult.message || emailResult.error);
      return res.status(502).json({ success: false, message: 'Falha ao enviar e-mail.' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar pré-inscrição:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar pré-inscrição. Tente novamente.'
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
