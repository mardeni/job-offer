require('dotenv').config();
const { google } = require('googleapis');

const maskEmail = (value) => {
  if (!value || typeof value !== 'string') {
    return 'N/A';
  }

  const parts = value.split('@');
  if (parts.length !== 2) {
    return `${value[0] || ''}***`;
  }

  const [user, domain] = parts;
  const safeUser = user.length <= 2
    ? `${user[0] || ''}*`
    : `${user[0]}***${user[user.length - 1]}`;

  return `${safeUser}@${domain}`;
};

const encodeHeader = (value) => {
  if (!value) {
    return '';
  }

  if (/^[\x00-\x7F]*$/.test(value)) {
    return value;
  }

  const encoded = Buffer.from(value, 'utf-8').toString('base64');
  return `=?UTF-8?B?${encoded}?=`;
};

const formatFromAddress = (name, email) => {
  if (!name) {
    return email;
  }

  return `${encodeHeader(name)} <${email}>`;
};

const chunkString = (value, size = 76) => {
  const chunks = value.match(new RegExp(`.{1,${size}}`, 'g'));
  return chunks ? chunks.join('\r\n') : value;
};

const base64UrlEncode = (value) => {
  return Buffer.from(value, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

const buildRawEmail = ({ fromName, fromEmail, toList, subject, html, attachments }) => {
  const boundary = `mixed_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const headers = [
    `From: ${formatFromAddress(fromName, fromEmail)}`,
    `To: ${toList.join(', ')}`,
    `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`
  ];

  const htmlBase64 = chunkString(Buffer.from(html, 'utf-8').toString('base64'));
  const bodyLines = [
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    htmlBase64,
    ''
  ];

  attachments.forEach((attachment) => {
    const content = typeof attachment.content === 'string'
      ? attachment.content
      : attachment.content.toString('utf-8');
    const contentBase64 = chunkString(Buffer.from(content, 'utf-8').toString('base64'));

    bodyLines.push(
      `--${boundary}`,
      `Content-Type: ${attachment.contentType || 'application/octet-stream'}; name="${attachment.filename}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${attachment.filename}"`,
      '',
      contentBase64,
      ''
    );
  });

  bodyLines.push(`--${boundary}--`, '');

  const rawMessage = `${headers.join('\r\n')}\r\n\r\n${bodyLines.join('\r\n')}`;
  return base64UrlEncode(rawMessage);
};

const getGmailClient = () => {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  const redirectUri = process.env.GMAIL_REDIRECT_URI || 'https://developers.google.com/oauthplayground';

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Configurações do Gmail API não definidas');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return google.gmail({ version: 'v1', auth: oauth2Client });
};

// Formatar dados da inscrição para o e-mail
const formatInscricaoEmail = (inscricao) => {
  const hasLocation = (
    inscricao.latitude !== undefined &&
    inscricao.latitude !== null &&
    String(inscricao.latitude).trim() !== '' &&
    inscricao.longitude !== undefined &&
    inscricao.longitude !== null &&
    String(inscricao.longitude).trim() !== ''
  );
  const isLocationPending = inscricao.localizacaoPendente === true;

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
    .notice { background: #fee2e2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0; }
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
        <strong>🔑 Código da Vaga:</strong> ${inscricao.codigoRecrutador || 'N/A'}<br>
        <strong>📅 Data/Hora:</strong> ${inscricao.dataInscricao ? new Date(inscricao.dataInscricao).toLocaleString('pt-BR', { timeZone: 'America/Maceio' }) : 'N/A'}
      </div>

      ${isLocationPending ? `
      <div class="notice">
        <strong>⚠️ Pré-inscrição:</strong> localização não informada. O envio final depende da permissão de geolocalização.
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">👤 Dados Pessoais</div>
        <div class="field"><span class="field-label">Nome Completo:</span> <span class="field-value">${inscricao.nomeCompleto || 'N/A'}</span></div>
        <div class="field"><span class="field-label">CPF:</span> <span class="field-value">${inscricao.cpf || 'N/A'}</span></div>
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
        ${hasLocation ? `
        <div class="field">
          <span class="field-label">Ver no Google Maps:</span>
          <a href="https://www.google.com/maps?q=${inscricao.latitude},${inscricao.longitude}" target="_blank">
            Abrir localização
          </a>
        </div>
        ` : `
        <div class="field">
          <span class="field-label">Ver no Google Maps:</span>
          <span class="field-value">N/A</span>
        </div>
        `}
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
    const gmailUser = process.env.GMAIL_USER || process.env.EMAIL_FROM;
    const fromEmail = process.env.EMAIL_FROM || gmailUser;
    const fromName = process.env.EMAIL_FROM_NAME || 'Sistema de Inscrição';

    if (!gmailUser || !fromEmail) {
      console.log('⚠️ Configurações do Gmail API não definidas. E-mail não enviado.');
      return { success: false, message: 'Configurações do Gmail API não definidas' };
    }

    const gmail = getGmailClient();

    const recipients = process.env.EMAIL_RECIPIENTS || 'mardeniferreira@gmail.com';
    const recipientsList = recipients.split(',').map(email => email.trim());
    const maskedRecipients = recipientsList.map(maskEmail).join(', ');
    const baseSubject = process.env.EMAIL_SUBJECT || 'Nova Inscrição';
    const subject = `${baseSubject}${inscricao.localizacaoPendente ? ' (localização pendente)' : ''} - ${inscricao.nomeCompleto}`;

    console.log('📧 Tentando enviar e-mail via Gmail API');
    console.log('👤 Usuário Gmail:', maskEmail(gmailUser));
    console.log('📨 Remetente:', `${fromName} <${maskEmail(fromEmail)}>`);
    console.log('📩 Destinatários:', maskedRecipients);
    console.log('🧩 Assunto:', subject);
    console.log('🆔 Código da vaga:', inscricao.codigoRecrutador || 'N/A');

    const raw = buildRawEmail({
      fromName,
      fromEmail,
      toList: recipientsList,
      subject,
      html: formatInscricaoEmail(inscricao),
      attachments: [
        {
          filename: `inscricao_${inscricao.codigoRecrutador}_${inscricao.nomeCompleto.replace(/\s+/g, '_')}.json`,
          content: JSON.stringify(inscricao, null, 2),
          contentType: 'application/json'
        }
      ]
    });

    const startTime = Date.now();
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: raw
      }
    });
    const elapsedMs = Date.now() - startTime;

    console.log('✅ E-mail enviado com sucesso via Gmail API!');
    console.log('📧 Destinatários:', maskedRecipients);
    console.log('📋 Message ID:', response.data.id || 'N/A');
    console.log('🧵 Thread ID:', response.data.threadId || 'N/A');
    console.log(`⏱️ Tempo de envio: ${elapsedMs}ms`);

    return { success: true, messageId: response.data.id, threadId: response.data.threadId };
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail via Gmail API:', {
      message: error.message,
      code: error.code,
      status: error?.response?.status,
      data: error?.response?.data,
      errno: error.errno,
      stack: error.stack
    });
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendInscricaoEmail
};
