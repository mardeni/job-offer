import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';

const API_URL = '__REACT_APP_API_URL__';
const parseBooleanEnv = (value, defaultValue = true) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const normalizedValue = String(value).trim().toLowerCase();
  return ['true', '1', 'yes', 'y', 'on'].includes(normalizedValue);
};

const REQUIRE_MOBILE = parseBooleanEnv('__REACT_APP_REQUIRE_MOBILE__', true);

const getSubmitErrorMessage = (err) => {
  if (err?.response?.data?.message) {
    return err.response.data.message;
  }

  if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
  }

  if (err?.response?.status >= 500) {
    return 'Erro no servidor. Tente novamente em alguns instantes.';
  }

  return 'Erro ao enviar inscrição. Tente novamente.';
};

function App() {
  const [codigo, setCodigo] = useState('');
  const [isValidCode, setIsValidCode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [protocolo, setProtocolo] = useState('');
  const [locationConsent, setLocationConsent] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nomeCompleto: '',
    cpf: '',
    dataNascimento: '',
    email: '',
    telefone: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: 'AL',
    nomeMae: '',
    estadoCivil: '',
    deficiencia: '',
    latitude: '',
    longitude: ''
  });

  // Verificar se é dispositivo móvel
  useEffect(() => {
    if (!REQUIRE_MOBILE) {
      setIsMobile(true);
      setError('');
      return;
    }

    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
      
      if (!mobile) {
        setError('Este formulário só pode ser acessado por dispositivos móveis (celular ou tablet).');
        setLoading(false);
      }
    };

    checkMobile();
  }, []);

  // Extrair código do recrutador da URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codigoParam = urlParams.get('codigo-recrutador');

    if (codigoParam && isMobile) {
      setCodigo(codigoParam);
      validateCode(codigoParam);
    } else if (isMobile) {
      setError('Código do recrutador não fornecido. Verifique o link recebido.');
      setLoading(false);
    }
  }, [isMobile]);

  const validateCode = async (codigoToValidate) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/validate-codigo-recrutador/${codigoToValidate}`);
      
      if (response.data.valid) {
        setIsValidCode(true);
        setError('');
      }
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Código do recrutador inválido ou já utilizado.');
      setIsValidCode(false);
      setLoading(false);
    }
  };

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não é suportada pelo seu navegador.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          let message = 'Erro ao obter localização.';
          if (error.code === error.PERMISSION_DENIED) {
            message = 'Você negou o acesso à localização. Para permitir novamente, clique no cadeado na barra do navegador, habilite a localização e recarregue a página.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            message = 'Não foi possível obter sua localização. Verifique se o GPS está ativado.';
          } else if (error.code === error.TIMEOUT) {
            message = 'A solicitação de localização expirou. Tente novamente.';
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!locationConsent) {
      setError('Você precisa autorizar o uso da localização para continuar.');
      return;
    }

    setSubmitting(true);
    setError('');

    let location;
    try {
      location = await getLocation();
    } catch (locErr) {
      setError(locErr?.message || 'Não foi possível obter sua localização. Verifique as permissões do navegador.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setSubmitting(false);
      return;
    }

    try {
      const dataToSubmit = {
        ...formData,
        latitude: location.latitude,
        longitude: location.longitude
      };

      const response = await axios.post(`${API_URL}/api/submit`, {
        codigo: codigo,
        formData: dataToSubmit
      });

      if (response.data.success) {
        const sent = response.data.emailSent !== false;
        if (!sent) {
          const message = response.data.emailError
            ? `Falha ao enviar e-mail: ${response.data.emailError}`
            : 'Falha ao enviar e-mail. Tente novamente mais tarde.';
          setError(message);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        setSuccess(true);
        setProtocolo(response.data.protocolo);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setError(getSubmitErrorMessage(err));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  if (REQUIRE_MOBILE && !isMobile) {
    return (
      <div className="app">
        <div className="container">
          <div className="header">
            <h1>📱 Acesso Restrito</h1>
          </div>
          <div className="content">
            <div className="device-warning">
              <h2>⚠️ Dispositivo Não Permitido</h2>
              <p>Este formulário só pode ser acessado através de dispositivos móveis (celular ou tablet).</p>
              <p style={{ marginTop: '15px', fontSize: '14px' }}>
                Por favor, acesse o link enviado através do seu smartphone.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app">
        <div className="container">
          <div className="content">
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Validando código do recrutador...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isValidCode) {
    return (
      <div className="app">
        <div className="container">
          <div className="header">
            <h1>❌ Acesso Negado</h1>
          </div>
          <div className="content">
            <div className="error-message">
              {error || 'Código do recrutador inválido ou já utilizado.'}
            </div>
            <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '20px' }}>
              Entre em contato com o recrutador para obter um novo código de acesso.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="app">
        <div className="container">
          <div className="header">
            <h1>✅ Inscrição Realizada!</h1>
            <div className="subtitle">Câmara Municipal de Pilar - AL</div>
          </div>
          <div className="content">
            <div className="success-message">
              <h3>🎉 Sua inscrição foi enviada com sucesso!</h3>
              <p>Sua candidatura para o cargo de Assistente Legislativo foi registrada.</p>
              <p>Guarde o número de protocolo abaixo para acompanhamento:</p>
              <div className="protocolo">
                Protocolo: {protocolo}
              </div>
              <p style={{ marginTop: '20px', fontSize: '14px' }}>
                Em breve você receberá mais informações sobre o processo seletivo.
              </p>
              <p style={{ marginTop: '10px', fontSize: '13px', opacity: 0.8 }}>
                Para mais informações, visite:{' '}
                <a href="https://www.pilar.al.leg.br/" target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#047857', textDecoration: 'underline' }}>
                  www.pilar.al.leg.br
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <div className="header-main">
            <img className="title-logo" src="/logo.webp" alt="Logo da Câmara Municipal de Pilar" />
            <div className="header-text">
              <h1>📋 Inscrição para Vaga</h1>
              <div className="subtitle">Câmara Municipal de Pilar - Alagoas</div>
              <div className="site-link">
                Site oficial: <a href="https://www.pilar.al.leg.br/" target="_blank" rel="noopener noreferrer">
                  www.pilar.al.leg.br
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="content">
          <div className="job-details">
            <h2>Detalhes da Vaga</h2>
            <img className="job-details-logo" src="/logo.webp" alt="Logo da Prefeitura de Pilar" />
            <div className="detail-item">
              <strong>Cargo:</strong>
              <span>Assistente</span>
            </div>
            <div className="detail-item">
              <strong>Remuneração:</strong>
              <span className="salary">R$ 3.100,00</span>
            </div>
            <div className="detail-item">
              <strong>Regime:</strong>
              <span>CLT + Benefícios</span>
            </div>
            <div className="detail-item">
              <strong>Carga horária:</strong>
              <span>6 horas</span>
            </div>
            <div className="detail-item">
              <strong>Local:</strong>
              <span>Câmara Municipal de Pilar - AL</span>
            </div>
            <div className="detail-item" style={{ display: 'block' }}>
              <strong>Atribuições:</strong>
              <ul style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: '1.8' }}>
                <li>Executar atividades administrativas de apoio aos vereadores.</li>
                <li>Atender ao público interno e externo, prestando informações e orientações.</li>
                <li>Operar sistemas para inserção e atualização de dados.</li>
                <li>Executar outras atividades correlatas determinadas pela chefia imediata.</li>
              </ul>
            </div>
          </div>

          <div className="location-notice">
            <h3>📍 Informação sobre Localização</h3>
            <p>
              <strong>Por que coletamos sua localização?</strong>
            </p>
            <p>
              Solicitamos sua localização geográfica para verificar se você é residente 
              da cidade de Pilar/AL e para calcular o itinerário e valor do vale-transporte 
              que será fornecido caso você seja contratado(a).
            </p>
            <p style={{ fontSize: '13px', marginTop: '10px', opacity: 0.9 }}>
              Sua localização será coletada no momento do envio do formulário e 
              será utilizada exclusivamente para os fins descritos acima.
            </p>

            <div className="consent-check">
              <input
                type="checkbox"
                id="locationConsent"
                checked={locationConsent}
                onChange={(e) => setLocationConsent(e.target.checked)}
              />
              <label htmlFor="locationConsent">
                Autorizo o uso da minha localização para os fins descritos acima 
                e estou ciente de que preciso ativar a geolocalização no meu dispositivo.
              </label>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <h2 style={{ marginBottom: '20px', color: '#1e40af' }}>Dados Pessoais</h2>

            <div className="form-group">
              <label>
                Nome Completo <span className="required">*</span>
              </label>
              <input
                type="text"
                name="nomeCompleto"
                value={formData.nomeCompleto}
                onChange={handleInputChange}
                required
                placeholder="Digite seu nome completo"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  CPF <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  required
                  placeholder="000.000.000-00"
                  maxLength="14"
                />
              </div>

              <div className="form-group">
                <label>
                  Data de Nascimento <span className="required">*</span>
                </label>
                <input
                  type="date"
                  name="dataNascimento"
                  value={formData.dataNascimento}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Nome da Mãe <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="nomeMae"
                  value={formData.nomeMae}
                  onChange={handleInputChange}
                  required
                  placeholder="Nome completo da mãe"
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                Estado Civil <span className="required">*</span>
              </label>
              <select
                name="estadoCivil"
                value={formData.estadoCivil}
                onChange={handleInputChange}
                required
              >
                <option value="">Selecione</option>
                <option value="solteiro">Solteiro(a)</option>
                <option value="casado">Casado(a)</option>
                <option value="divorciado">Divorciado(a)</option>
                <option value="viuvo">Viúvo(a)</option>
                <option value="uniao-estavel">União Estável</option>
              </select>
            </div>

            <h2 style={{ marginTop: '30px', marginBottom: '20px', color: '#1e40af' }}>Contato</h2>

            <div className="form-row">
              <div className="form-group">
                <label>
                  E-mail <span className="required">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="seuemail@exemplo.com"
                />
              </div>

              <div className="form-group">
                <label>
                  Telefone/Celular <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleInputChange}
                  required
                  placeholder="(82) 99999-9999"
                />
              </div>
            </div>

            <h2 style={{ marginTop: '30px', marginBottom: '20px', color: '#1e40af' }}>Endereço</h2>

            <div className="form-group">
              <label>
                Logradouro (Rua/Avenida) <span className="required">*</span>
              </label>
              <input
                type="text"
                name="endereco"
                value={formData.endereco}
                onChange={handleInputChange}
                required
                placeholder="Rua, Avenida, etc."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Número <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="numero"
                  value={formData.numero}
                  onChange={handleInputChange}
                  required
                  placeholder="Nº"
                />
              </div>

              <div className="form-group">
                <label>Complemento</label>
                <input
                  type="text"
                  name="complemento"
                  value={formData.complemento}
                  onChange={handleInputChange}
                  placeholder="Apto, Bloco, etc. (opcional)"
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                Bairro <span className="required">*</span>
              </label>
              <input
                type="text"
                name="bairro"
                value={formData.bairro}
                onChange={handleInputChange}
                required
                placeholder="Nome do bairro"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Cidade <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleInputChange}
                  required
                  placeholder="Pilar"
                />
              </div>

              <div className="form-group">
                <label>
                  Estado <span className="required">*</span>
                </label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  required
                >
                  <option value="AL">Alagoas</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!locationConsent || submitting}
            >
              {submitting ? '⏳ Enviando inscrição...' : '✉️ Enviar Inscrição'}
            </button>

            {!locationConsent && (
              <p style={{ textAlign: 'center', color: '#dc2626', marginTop: '15px', fontSize: '14px' }}>
                ⚠️ Você precisa autorizar o uso da localização para enviar a inscrição
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
