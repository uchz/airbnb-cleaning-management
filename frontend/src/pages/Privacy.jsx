import React from 'react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
        <Link to="/" className="text-brand-600 hover:text-brand-700 mb-6 inline-block">
          ← Voltar
        </Link>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Política de Privacidade</h1>
        <p className="text-sm text-gray-500 mb-8">Última atualização: 10 de setembro de 2026</p>

        <div className="prose prose-slate max-w-none space-y-8">
          
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Identificação do Controlador</h2>
            <div className="bg-slate-50 p-6 rounded-lg space-y-2">
              <p><strong>Razão Social:</strong> GIOVANNA DE AZEVEDO DA SILVA</p>
              <p><strong>CNPJ:</strong> 59.608.874/0001-XX</p>
              <p><strong>Nome Fantasia:</strong> Verus Sweeply</p>
              <p><strong>Endereço:</strong> Rua Capitão Silva Barros - Duque de Caxias/RJ</p>
              <p><strong>Email do Encarregado (DPO):</strong> contatoluishenriq@gmail.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Dados Coletados</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">a) Dados de Cadastro</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Nome completo, nome de usuário, email, telefone</li>
              <li>Senha (armazenada com hash bcrypt)</li>
              <li>Informações de pagamento (processadas via Stripe - PCI-DSS compliant)</li>
              <li>Cargo/função (administrador ou funcionário)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">b) Dados da Organização</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Nome da empresa/organização</li>
              <li>Endereços dos imóveis gerenciados</li>
              <li>Informações de apartamentos (nome, localização, checklist)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">c) Dados Operacionais</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Vídeos de check-in e check-out</strong> dos apartamentos durante limpeza</li>
              <li>Checklists de limpeza preenchidos</li>
              <li>Histórico de tarefas e reagendamentos</li>
              <li>Logs de acesso a dados sensíveis</li>
              <li>Notificações e comunicações internas</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">d) Dados Técnicos</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Endereço IP, navegador, dispositivo utilizado</li>
              <li>Logs de sistema para segurança e diagnóstico</li>
              <li>Cookies essenciais para autenticação</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Finalidade do Tratamento</h2>
            <p className="text-gray-700 mb-3">Coletamos e tratamos seus dados para:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Gestão de escalas:</strong> Organizar e atribuir tarefas de limpeza</li>
              <li><strong>Controle de qualidade:</strong> Verificar execução através dos vídeos de check-in/check-out</li>
              <li><strong>Relatórios financeiros:</strong> Gerar relatórios de pagamento para funcionários</li>
              <li><strong>Comunicação:</strong> Enviar notificações sobre tarefas e atualizações</li>
              <li><strong>Cumprimento contratual:</strong> Execução do contrato de prestação de serviços</li>
              <li><strong>Segurança:</strong> Prevenir fraudes e uso não autorizado</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Base Legal (LGPD Art. 7)</h2>
            <p className="text-gray-700 mb-3">O tratamento de dados pessoais é realizado com base em:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Execução de contrato (Art. 7, V):</strong> Dados necessários para prestar o serviço contratado</li>
              <li><strong>Legítimo interesse (Art. 7, IX):</strong> Controle de qualidade e segurança do sistema</li>
              <li><strong>Consentimento (Art. 7, I):</strong> Gravação de vídeos pelos funcionários</li>
              <li><strong>Cumprimento de obrigação legal (Art. 7, II):</strong> Dados fiscais e tributários</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Compartilhamento de Dados</h2>
            <p className="text-gray-700 mb-3">Seus dados podem ser compartilhados com:</p>
            
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4">
              <p className="text-amber-900"><strong>Stripe (Processamento de Pagamentos):</strong> Localizado nos EUA, certificado PCI-DSS</p>
            </div>
            
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4">
              <p className="text-amber-900"><strong>Railway (Infraestrutura de Hospedagem):</strong> Localizado nos EUA</p>
            </div>

            <p className="text-gray-700 font-semibold">NÃO vendemos, alugamos ou compartilhamos seus dados para fins de marketing com terceiros.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Retenção de Dados</h2>
            <div className="space-y-3 text-gray-700">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="font-semibold text-blue-900">Vídeos de check-in/check-out:</p>
                <p className="text-blue-800">Armazenados por <strong>30 dias</strong> após conclusão da tarefa, depois são automaticamente deletados.</p>
              </div>
              
              <p><strong>Dados cadastrais:</strong> Mantidos enquanto houver contrato ativo com a Verus Sweeply</p>
              <p><strong>Dados de pagamento:</strong> 5 anos (obrigação legal fiscal)</p>
              <p><strong>Logs de acesso:</strong> 90 dias para auditoria de segurança</p>
              <p><strong>Após cancelamento:</strong> Conta permanece inativa, mas dados são preservados caso você deseje reativar. Para exclusão definitiva, solicite através do email do DPO.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Seus Direitos (LGPD Art. 18)</h2>
            <p className="text-gray-700 mb-3">Você tem direito a:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Confirmação</strong> da existência de tratamento de dados</li>
              <li><strong>Acesso</strong> aos dados pessoais que temos sobre você</li>
              <li><strong>Correção</strong> de dados incompletos, inexatos ou desatualizados</li>
              <li><strong>Anonimização, bloqueio ou eliminação</strong> de dados desnecessários</li>
              <li><strong>Portabilidade</strong> dos dados a outro fornecedor (export em JSON)</li>
              <li><strong>Eliminação</strong> dos dados tratados com consentimento</li>
              <li><strong>Revogação do consentimento</strong> a qualquer momento</li>
              <li><strong>Informação</strong> sobre compartilhamento de dados</li>
            </ul>

            <div className="bg-green-50 p-6 rounded-lg mt-4">
              <p className="font-semibold text-green-900 mb-2">Como exercer seus direitos:</p>
              <p className="text-green-800">📧 Email: contatoluishenriq@gmail.com</p>
              <p className="text-green-800">📍 Endereço: Rua Capitão Silva Barros - Duque de Caxias/RJ</p>
              <p className="text-green-800">⚙️ Ou acesse: Configurações → Privacidade (dentro do sistema)</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Segurança</h2>
            <p className="text-gray-700 mb-3">Implementamos medidas técnicas e organizacionais para proteger seus dados:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>🔒 <strong>Criptografia HTTPS</strong> para dados em trânsito</li>
              <li>🔐 <strong>Senhas protegidas</strong> com hash bcrypt</li>
              <li>📁 <strong>Armazenamento isolado</strong> por organização (multi-tenant seguro)</li>
              <li>📝 <strong>Logs de acesso</strong> a dados sensíveis para auditoria</li>
              <li>💾 <strong>Backups criptografados</strong> regulares</li>
              <li>🚪 <strong>Controle de acesso</strong> baseado em permissões (admin/funcionário)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Transferência Internacional</h2>
            <p className="text-gray-700 mb-3">
              Seus dados podem ser processados e armazenados nos Estados Unidos através dos nossos 
              provedores de infraestrutura (Railway) e pagamento (Stripe). Estas empresas são certificadas 
              e utilizam cláusulas contratuais padrão aprovadas para proteção de dados.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Cookies</h2>
            <p className="text-gray-700">
              Utilizamos apenas cookies essenciais para autenticação e funcionamento do sistema. 
              Não utilizamos cookies de rastreamento ou publicidade.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Alterações nesta Política</h2>
            <p className="text-gray-700">
              Esta Política de Privacidade pode ser atualizada periodicamente. Notificaremos você 
              por email com <strong>30 dias de antecedência</strong> sobre mudanças significativas. 
              O uso continuado do serviço após as alterações constitui aceitação da nova política.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contato e Reclamações</h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>Encarregado de Dados (DPO):</strong></p>
              <p>📧 Email: contatoluishenriq@gmail.com</p>
              <p>📍 Endereço: Rua Capitão Silva Barros - Duque de Caxias/RJ</p>
              
              <p className="mt-4">
                <strong>Autoridade Nacional de Proteção de Dados (ANPD):</strong><br />
                Caso não esteja satisfeito com nossas respostas, você pode apresentar reclamação à ANPD.
              </p>
            </div>
          </section>

          <section className="border-t pt-6 mt-8">
            <p className="text-sm text-gray-500">
              Esta Política de Privacidade está em conformidade com a Lei nº 13.709/2018 
              (Lei Geral de Proteção de Dados - LGPD) e com o Marco Civil da Internet (Lei nº 12.965/2014).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
