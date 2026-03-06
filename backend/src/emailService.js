require('dotenv').config();
const nodemailer = require('nodemailer');

// Configurar transporte de e-mail
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Formatar dados da inscrição para o e-mail
const formatInscricaoEmail = (inscricao) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .section-title { color: #1e40af; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
    .field { margin-bottom: 12px; }
    .field-label { font-weight: 600; color: #4b5563; display: inline-block; min-width: 180px; }
    .field-value { color: #1f2937; }
    .highlight { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
    .location { background: #dbeafe; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Nova Inscrição Recebida</h1>
      <p>Cargo: Assistente Legislativo</p>
      <p>Câmara Municipal de Pilar - AL</p>
    </div>
    
    <div class="content">
      <div class="highlight">
        <strong>📋 Protocolo:</strong> ${inscricao.dataInscricao ? new Date(inscricao.dataInscricao).getTime() : 'N/A'}<br>
        <strong>🔑 Código do Recrutador:</strong> ${inscricao.codigoRecrutador || 'N/A'}<br>
        <strong>📅 Data/Hora:</strong> ${inscricao.dataInscricao ? new Date(inscricao.dataInscricao).toLocaleString('pt-BR', { timeZone: 'America/Maceio' }) : 'N/A'}
      </div>

      <div class="section">
        <div class="section-title">👤 Dados Pessoais</div>
        <div class="field"><span class="field-label">Nome Completo:</span> <span class="field-value">${inscricao.nomeCompleto || 'N/A'}</span></div>
        <div class="field"><span class="field-label">CPF:</span> <span class="field-value">${inscricao.cpf || 'N/A'}</span></div>
        <div class="field"><span class="field-label">RG:</span> <span class="field-value">${inscricao.rg || 'N/A'}</span></div>
        <div class="field"><span class="field-label">Órgão Emissor:</span> <span class="field-value">${inscricao.orgaoEmissor || 'N/A'}</span></div>
        <div class="field"><span class="field-label">Data de Nascimento:</span> <span class="field-value">${inscricao.dataNascimento ? new Date(inscricao.dataNascimento).toLocaleDateString('pt-BR') : 'N/A'}</span></div>
        <div class="field"><span class="field-label">Estado Civil:</span> <span class="field-value">${inscricao.estadoCivil || 'N/A'}</span></div>
        <div class="field"><span class="field-label">Nome da Mãe:</span> <span class="field-value">${inscricao.nomeMae || 'N/A'}</span></div>
      </div>

      <div class="section">
        <div class="section-title">📞 Contato</div>
        <div class="field"><span class="field-label">E-mail:</span> <span class="field-value">${inscricao.email || 'N/A'}</span></div>
        <div class="field"><span class="field-label">Telefone:</span> <span class="field-value">${inscricao.telefone || 'N/A'}</span></div>
      </div>

      <div class="section">
        <div class="section-title">🏠 Endereço</div>
        <div class="field"><span class="field-label">Logradouro:</span> <span class="field-value">${inscricao.endereco || 'N/A'}</span></div>
        <div class="field"><span class="field-label">Número:</span> <span class="field-value">${inscricao.numero || 'N/A'}</span></div>
        <div class="field"><span class="field-label">Complemento:</span> <span class="field-value">${inscricao.complemento || 'N/A'}</span></div>
        <div class="field"><span class="field-label">Bairro:</span> <span class="field-value">${inscricao.bairro || 'N/A'}</span></div>
        <div class="field"><span class="field-label">Cidade:</span> <span class="field-value">${inscricao.cidade || 'N/A'}</span></div>
        <div class="field"><span class="field-label">Estado:</span> <span class="field-value">${inscricao.estado || 'N/A'}</span></div>
        <div class="field"><span class="field-label">CEP:</span> <span class="field-value">${inscricao.cep || 'N/A'}</span></div>
      </div>

      ${inscricao.deficiencia ? `
      <div class="section">
        <div class="section-title">♿ Pessoa com Deficiência</div>
        <div class="field"><span class="field-label">Tipo:</span> <span class="field-value">${inscricao.deficiencia}</span></div>
      </div>
      ` : ''}

      <div class="location">
        <div class="section-title">📍 Geolocalização</div>
        <div class="field"><span class="field-label">Latitude:</span> <span class="field-value">${inscricao.latitude || 'N/A'}</span></div>
        <div class="field"><span class="field-label">Longitude:</span> <span class="field-value">${inscricao.longitude || 'N/A'}</span></div>
        <div class="field">
          <span class="field-label">Ver no Google Maps:</span> 
          <a href="https://www.google.com/maps?q=${inscricao.latitude},${inscricao.longitude}" target="_blank">
            Abrir localização
          </a>
        </div>
      </div>

      <div class="footer">
        <p>Sistema de Inscrição - Câmara Municipal de Pilar/AL</p>
        <p>www.pilar.al.leg.br</p>
        <p>Este é um e-mail automático. Não responda.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

// Enviar e-mail com os dados da inscrição
const sendInscricaoEmail = async (inscricao) => {
  try {
    // Verificar se as configurações de e-mail estão definidas
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('⚠️ Configurações de e-mail não definidas. E-mail não enviado.');
      return { success: false, message: 'Configurações de e-mail não definidas' };
    }

    const transporter = createTransporter();
    
    // Obter lista de destinatários
    const recipients = process.env.EMAIL_RECIPIENTS || 'mardeniferreira@gmail.com';
    const recipientsList = recipients.split(',').map(email => email.trim());

    // Configurar e-mail
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Sistema de Inscrição'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: recipientsList,
      subject: `${process.env.EMAIL_SUBJECT || 'Nova Inscrição'} - ${inscricao.nomeCompleto}`,
      html: formatInscricaoEmail(inscricao),
      attachments: [
        {
          filename: `inscricao_${inscricao.codigoRecrutador}_${inscricao.nomeCompleto.replace(/\s+/g, '_')}.json`,
          content: JSON.stringify(inscricao, null, 2),
          contentType: 'application/json'
        }
      ]
    };

    // Enviar e-mail
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ E-mail enviado com sucesso!');
    console.log('📧 Destinatários:', recipientsList.join(', '));
    console.log('📋 Message ID:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendInscricaoEmail
};
