import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function ConsentModal() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedVideo, setAgreedVideo] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Verificar se usuário já deu consentimento
    const checkConsent = async () => {
      try {
        const response = await api.get('/privacy/me/data');
        const userData = response.data.user;
        
        // Se não tiver consentimento registrado, mostrar modal
        if (!userData.privacy_consent_at || !userData.video_consent_at) {
          setShow(true);
        }
      } catch (error) {
        console.error('Erro ao verificar consentimento:', error);
        // Em caso de erro, mostrar modal por segurança
        setShow(true);
      }
    };

    if (user) {
      checkConsent();
    }
  }, [user]);

  const handleAccept = async () => {
    if (!agreedPrivacy || !agreedVideo) {
      alert('Por favor, aceite ambos os termos para continuar.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/privacy/consent', {
        privacy_consent: true,
        video_consent: true,
        consented_at: new Date().toISOString()
      });
      
      setShow(false);
    } catch (error) {
      alert('Erro ao salvar consentimento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 text-white p-6">
          <h2 className="text-2xl font-bold">🔒 Termos de Consentimento - LGPD</h2>
          <p className="text-brand-100 mt-2">Antes de começar, precisamos do seu consentimento</p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-blue-900 font-semibold mb-2">📋 Informações Importantes</p>
            <p className="text-blue-800 text-sm">
              A Verus Sweeply está comprometida com a proteção dos seus dados pessoais conforme 
              a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">📹 Consentimento para Gravação de Vídeos</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-gray-700 mb-3">
                Declaro que fui informado(a) e estou ciente de que:
              </p>
              <ul className="space-y-2 text-gray-700 text-sm ml-4">
                <li className="flex gap-2">
                  <span className="text-yellow-600">•</span>
                  <span>O sistema Verus Sweeply permite a gravação de vídeos durante o check-in e check-out de limpeza de imóveis</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-600">•</span>
                  <span>Estes vídeos têm finalidade de <strong>controle de qualidade do serviço prestado</strong></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-600">•</span>
                  <span>Os vídeos serão acessíveis ao administrador da minha organização</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-600">•</span>
                  <span>Os vídeos serão armazenados por <strong>30 dias</strong> após conclusão da tarefa e depois automaticamente deletados</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-600">•</span>
                  <span>Posso revogar este consentimento através do email contatoluishenriq@gmail.com, entendendo que isso pode inviabilizar meu trabalho através do sistema</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-600">•</span>
                  <span>Tenho direito de acesso, correção, exclusão e portabilidade dos meus dados conforme LGPD</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">🔐 Tratamento de Dados Pessoais</h3>
            <p className="text-gray-700 text-sm">
              Seus dados pessoais (nome, telefone, tarefas realizadas) serão tratados pela 
              <strong> Verus Sweeply (GIOVANNA DE AZEVEDO DA SILVA - CNPJ 59.608.874/0001-XX)</strong> com as seguintes finalidades:
            </p>
            <ul className="space-y-1 text-gray-700 text-sm ml-4">
              <li>• Gestão de escalas e atribuição de tarefas</li>
              <li>• Geração de relatórios de pagamento</li>
              <li>• Comunicação sobre suas tarefas</li>
              <li>• Cumprimento de obrigações contratuais</li>
            </ul>
          </div>

          {/* Checkboxes */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedPrivacy}
                onChange={(e) => setAgreedPrivacy(e.target.checked)}
                className="mt-1 w-5 h-5 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
              />
              <span className="text-gray-800 text-sm">
                Li e concordo com a{' '}
                <a href="/privacy" target="_blank" className="text-brand-600 hover:underline font-semibold">
                  Política de Privacidade
                </a>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedVideo}
                onChange={(e) => setAgreedVideo(e.target.checked)}
                className="mt-1 w-5 h-5 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
              />
              <span className="text-gray-800 text-sm">
                <strong>Concordo</strong> com a gravação de vídeos para controle de qualidade, conforme descrito acima
              </span>
            </label>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <p>
              <strong>Seus direitos:</strong> Você pode a qualquer momento acessar, corrigir, excluir ou exportar seus dados 
              através de Configurações → Privacidade, ou entrando em contato com nosso DPO pelo email contatoluishenriq@gmail.com
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t flex gap-3 justify-end">
          <button
            onClick={handleAccept}
            disabled={!agreedPrivacy || !agreedVideo || loading}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              agreedPrivacy && agreedVideo && !loading
                ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'Salvando...' : '✅ Aceitar e Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}
