import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function PrivacySettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [accessLogs, setAccessLogs] = useState([]);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    loadAccessLogs();
    loadUserData();
  }, []);

  const loadAccessLogs = async () => {
    try {
      const response = await api.get('/api/privacy/me/access-logs');
      setAccessLogs(response.data.logs || []);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    }
  };

  const loadUserData = async () => {
    try {
      const response = await api.get('/api/privacy/me/data');
      setUserData(response.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/privacy/me/export');
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meus-dados-verus-sweeply-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      alert('✅ Dados exportados com sucesso!');
    } catch (error) {
      alert('❌ Erro ao exportar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmText = 'EXCLUIR MINHA CONTA';
    const userInput = prompt(
      `⚠️ ATENÇÃO: Esta ação é irreversível!\n\n` +
      `Seus dados serão permanentemente deletados em 30 dias.\n` +
      `Durante este período você pode cancelar a exclusão.\n\n` +
      `Digite "${confirmText}" para confirmar:`
    );

    if (userInput !== confirmText) {
      alert('Exclusão cancelada.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.delete('/api/privacy/me/account');
      alert('✅ ' + response.data.message);
      window.location.href = '/login';
    } catch (error) {
      alert('❌ Erro: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Privacidade e Dados</h1>
        <p className="text-gray-600 mt-2">Gerencie seus dados pessoais conforme a LGPD</p>
      </div>

      {/* Meus Dados */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Meus Dados Pessoais</h2>
        {userData && (
          <div className="space-y-3 text-gray-700">
            <p><strong>Nome:</strong> {userData.user?.full_name}</p>
            <p><strong>Usuário:</strong> {userData.user?.username}</p>
            <p><strong>Telefone:</strong> {userData.user?.phone || 'Não informado'}</p>
            <p><strong>Cargo:</strong> {userData.user?.role === 'admin' ? 'Administrador' : 'Funcionário'}</p>
            <p><strong>Cadastrado em:</strong> {userData.user?.created_at ? new Date(userData.user.created_at).toLocaleDateString('pt-BR') : 'N/A'}</p>
            <p><strong>Total de tarefas:</strong> {userData.tasks?.length || 0}</p>
          </div>
        )}
      </Card>

      {/* Consentimentos */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">✅ Consentimentos LGPD</h2>
        <div className="space-y-3">
          {userData?.user?.privacy_consent_at && (
            <div className="flex items-center gap-3 text-green-700 bg-green-50 p-3 rounded">
              <span>✓</span>
              <span>Política de Privacidade aceita em {new Date(userData.user.privacy_consent_at).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
          {userData?.user?.video_consent_at && (
            <div className="flex items-center gap-3 text-green-700 bg-green-50 p-3 rounded">
              <span>✓</span>
              <span>Gravação de vídeos autorizada em {new Date(userData.user.video_consent_at).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Ações */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">⚙️ Ações</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Exportar Meus Dados (Portabilidade)</h3>
            <p className="text-sm text-gray-600 mb-3">
              Baixe todos os seus dados em formato JSON conforme direito previsto na LGPD.
            </p>
            <Button onClick={handleExportData} disabled={loading} variant="secondary">
              {loading ? 'Exportando...' : '📥 Exportar Dados (JSON)'}
            </Button>
          </div>

          <hr className="border-gray-200" />

          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Excluir Minha Conta (Direito ao Esquecimento)</h3>
            <p className="text-sm text-gray-600 mb-3">
              Solicite a exclusão permanente de sua conta e todos os dados associados. 
              Esta ação não pode ser desfeita após 30 dias.
            </p>
            <Button onClick={handleDeleteAccount} disabled={loading} variant="danger">
              {loading ? 'Processando...' : '🗑️ Excluir Minha Conta'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Logs de Acesso */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">📝 Logs de Acesso (Últimos 100)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Registro de quem acessou seus dados pessoais (auditoria LGPD).
        </p>
        
        {accessLogs.length === 0 ? (
          <p className="text-gray-500 italic">Nenhum acesso registrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-700">Ação</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Acessado por</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Data/Hora</th>
                  <th className="text-left p-3 font-semibold text-gray-700">IP</th>
                </tr>
              </thead>
              <tbody>
                {accessLogs.map((log, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3">{log.action}</td>
                    <td className="p-3">{log.accessed_by}</td>
                    <td className="p-3">{new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-gray-500">{log.ip_address || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Links úteis */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">📄 Documentos Legais</h2>
        <div className="space-y-2">
          <a href="/privacy" target="_blank" className="text-brand-600 hover:text-brand-700 block">
            → Política de Privacidade
          </a>
          <a href="/terms" target="_blank" className="text-brand-600 hover:text-brand-700 block">
            → Termos de Uso
          </a>
          <p className="text-sm text-gray-600 mt-4">
            <strong>Dúvidas sobre seus dados?</strong><br />
            Entre em contato com nosso DPO: <a href="mailto:contatoluishenriq@gmail.com" className="text-brand-600">contatoluishenriq@gmail.com</a>
          </p>
        </div>
      </Card>
    </div>
  );
}
