import React from 'react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
        <Link to="/" className="text-brand-600 hover:text-brand-700 mb-6 inline-block">
          ← Voltar
        </Link>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Termos de Uso</h1>
        <p className="text-sm text-gray-500 mb-8">Última atualização: 10 de setembro de 2026</p>

        <div className="prose prose-slate max-w-none space-y-8">
          
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Aceitação dos Termos</h2>
            <p className="text-gray-700">
              Ao criar uma conta e utilizar o sistema Verus Sweeply, você concorda integralmente com estes 
              Termos de Uso. Se você representa uma empresa ou organização, declara ter poderes legais 
              para vincular a entidade a estes termos.
            </p>
            <p className="text-gray-700 mt-3">
              Caso não concorde com qualquer parte destes termos, não utilize o serviço.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Descrição do Serviço</h2>
            <p className="text-gray-700 mb-3">
              O Verus Sweeply é um software como serviço (SaaS) que oferece solução para gestão de 
              limpeza de imóveis tipo Airbnb, incluindo:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Gestão de apartamentos e funcionários</li>
              <li>Criação de escalas semanais e tarefas</li>
              <li>Registro de execução com vídeos de check-in/check-out</li>
              <li>Checklists personalizados por apartamento</li>
              <li>Relatórios de pagamento e produtividade</li>
              <li>Controle de estoque de produtos de limpeza</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Planos e Pagamento</h2>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-blue-900 mb-2">Plano Basic</h3>
                <p className="text-3xl font-bold text-blue-700 mb-4">R$ 89,99<span className="text-sm font-normal">/mês</span></p>
                <ul className="space-y-2 text-blue-800">
                  <li>✓ Até 60 tarefas/mês</li>
                  <li>✓ 3 funcionários</li>
                  <li>✓ 5 apartamentos</li>
                  <li>✓ Relatórios básicos</li>
                  <li>✓ Suporte por email</li>
                </ul>
              </div>

              <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-500">
                <h3 className="text-xl font-bold text-purple-900 mb-2">Plano Pro</h3>
                <p className="text-3xl font-bold text-purple-700 mb-4">R$ 189,99<span className="text-sm font-normal">/mês</span></p>
                <ul className="space-y-2 text-purple-800">
                  <li>✓ Tarefas ilimitadas</li>
                  <li>✓ Funcionários ilimitados</li>
                  <li>✓ Apartamentos ilimitados</li>
                  <li>✓ Relatórios avançados + export</li>
                  <li>✓ Controle de estoque</li>
                  <li>✓ Integração iCalendar</li>
                  <li>✓ Suporte prioritário</li>
                </ul>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Condições de Pagamento</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Período de teste:</strong> 7 dias gratuitos no primeiro cadastro</li>
              <li><strong>Cobrança:</strong> Mensal recorrente via cartão de crédito (Stripe)</li>
              <li><strong>Renovação:</strong> Automática no mesmo dia de cada mês</li>
              <li><strong>Reajuste:</strong> Anual pelo IPCA com aviso prévio de 30 dias</li>
              <li><strong>Atraso:</strong> Conta suspensa após 5 dias de inadimplência</li>
              <li><strong>Impostos:</strong> Valores já incluem todos os tributos aplicáveis</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Cadastro e Conta</h2>
            <p className="text-gray-700 mb-3">Ao criar uma conta, você concorda em:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Fornecer informações verdadeiras, completas e atualizadas</li>
              <li>Manter a segurança de sua senha e credenciais</li>
              <li>Notificar imediatamente sobre uso não autorizado</li>
              <li>Não compartilhar sua conta com terceiros</li>
              <li>Ser responsável por todas as atividades em sua conta</li>
            </ul>
            <p className="text-gray-700 mt-3 font-semibold">
              O cadastro requer cartão de crédito válido, mesmo durante o período de teste.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Cancelamento e Reembolso</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Cancelamento pelo Cliente</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Você pode cancelar sua assinatura a qualquer momento através do painel de configurações</li>
              <li>Conta permanece <strong>inativa</strong> (não é deletada), preservando seus dados</li>
              <li>Você pode reativar a qualquer momento renovando o pagamento</li>
              <li>Para exclusão definitiva, solicite através de contatoluishenriq@gmail.com</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">Política de Reembolso</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Durante teste (7 dias):</strong> Cancele sem cobrança</li>
              <li><strong>Após início da cobrança:</strong> Não há reembolso proporcional, exceto em caso de falha comprovada do serviço por nossa responsabilidade</li>
              <li>Cobranças indevidas serão estornadas em até 10 dias úteis</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Uso Aceitável</h2>
            
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
              <p className="font-semibold text-green-900 mb-2">O CLIENTE É RESPONSÁVEL POR:</p>
              <ul className="space-y-2 text-green-800">
                <li>✓ Obter autorização dos proprietários dos imóveis para gravação de vídeos</li>
                <li>✓ Cumprir toda legislação trabalhista aplicável aos seus funcionários</li>
                <li>✓ Avisar hóspedes ou moradores sobre gravação, quando aplicável</li>
                <li>✓ Uso lícito, ético e de boa-fé do sistema</li>
                <li>✓ Veracidade das informações cadastradas</li>
              </ul>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <p className="font-semibold text-red-900 mb-2">É EXPRESSAMENTE PROIBIDO:</p>
              <ul className="space-y-2 text-red-800">
                <li>✗ Uso para atividades ilegais ou não autorizadas</li>
                <li>✗ Tentativas de invasão, hacking ou engenharia reversa</li>
                <li>✗ Sobrecarga intencional do sistema (DoS/DDoS)</li>
                <li>✗ Revenda ou sublicenciamento do acesso sem autorização</li>
                <li>✗ Upload de malware, vírus ou código malicioso</li>
                <li>✗ Coleta automatizada de dados (scraping) sem autorização</li>
                <li>✗ Violação de direitos de terceiros</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Propriedade Intelectual</h2>
            <p className="text-gray-700 mb-3">
              <strong>Software:</strong> Todo código-fonte, design, interface, logotipos e documentação 
              são propriedade exclusiva da Verus Sweeply (GIOVANNA DE AZEVEDO DA SILVA), protegidos 
              por direitos autorais e propriedade intelectual.
            </p>
            <p className="text-gray-700 mb-3">
              <strong>Seus dados:</strong> Você mantém todos os direitos sobre os dados que insere no sistema 
              (informações de funcionários, apartamentos, vídeos, etc). Concedemos licença não exclusiva 
              apenas para processar estes dados conforme necessário para prestar o serviço.
            </p>
            <p className="text-gray-700">
              <strong>Licença de uso:</strong> Concedemos a você uma licença limitada, não exclusiva, 
              intransferível e revogável para usar o software durante a vigência do contrato.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Disponibilidade e SLA</h2>
            <p className="text-gray-700 mb-3">
              Nos esforçamos para manter o serviço disponível 99% do tempo mensalmente, excluindo:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Manutenções programadas (avisadas com 24h de antecedência)</li>
              <li>Casos fortuitos ou força maior</li>
              <li>Falhas de provedores terceiros (internet, AWS, etc.)</li>
              <li>Problemas causados pelo cliente ou seus usuários</li>
            </ul>
            <p className="text-gray-700 mt-3">
              <strong>Não garantimos</strong> disponibilidade ininterrupta ou livre de erros. 
              O serviço é fornecido "como está" (as-is).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitação de Responsabilidade</h2>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
              <p className="font-semibold text-yellow-900 mb-2">A VERUS SWEEPLY NÃO SE RESPONSABILIZA POR:</p>
              <ul className="space-y-2 text-yellow-800">
                <li>• Relações trabalhistas entre o cliente e seus funcionários</li>
                <li>• Danos a imóveis ocorridos durante limpeza</li>
                <li>• Conflitos entre cliente e proprietários de imóveis</li>
                <li>• Perda de dados causada por ação ou omissão do cliente</li>
                <li>• Danos indiretos, incidentais, consequenciais ou lucros cessantes</li>
                <li>• Vírus, invasões ou ataques cibernéticos externos</li>
                <li>• Uso indevido do sistema por terceiros</li>
                <li>• Falhas decorrentes de caso fortuito ou força maior</li>
              </ul>
            </div>

            <p className="text-gray-700 font-semibold">
              Nossa responsabilidade total está limitada ao valor de 3 (três) mensalidades 
              do seu plano contratado.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Suporte Técnico</h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>Canal:</strong> Email (contatoluishenriq@gmail.com)</p>
              <p><strong>Horário:</strong> Dias úteis, das 9h às 18h (horário de Brasília)</p>
              <p><strong>SLA de resposta:</strong></p>
              <ul className="list-disc pl-6">
                <li>Plano Basic: até 48 horas úteis</li>
                <li>Plano Pro: até 24 horas úteis (suporte prioritário)</li>
              </ul>
              <p className="text-sm text-gray-600 mt-2">
                * Tempo de resposta não significa tempo de resolução. Questões complexas 
                podem exigir mais tempo para solução.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Modificações no Serviço</h2>
            <p className="text-gray-700">
              Reservamo-nos o direito de adicionar, modificar ou remover funcionalidades do serviço 
              a qualquer momento. Mudanças significativas que afetem recursos principais contratados 
              serão comunicadas com 30 dias de antecedência.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Rescisão</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Pelo Cliente</h3>
            <p className="text-gray-700">A qualquer momento, conforme item 5 (Cancelamento).</p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">Pela Verus Sweeply</h3>
            <p className="text-gray-700 mb-3">Podemos suspender ou encerrar sua conta em caso de:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Violação destes Termos de Uso</li>
              <li>Inadimplência superior a 15 dias</li>
              <li>Uso fraudulento ou ilegal do serviço</li>
              <li>Risco à segurança ou estabilidade do sistema</li>
            </ul>
            <p className="text-gray-700 mt-3">
              Tentaremos notificá-lo com 7 dias de antecedência, exceto em casos de fraude 
              ou risco imediato (suspensão imediata).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Modificações nos Termos</h2>
            <p className="text-gray-700">
              Estes Termos podem ser atualizados periodicamente. Você será notificado por email 
              sobre mudanças significativas com 30 dias de antecedência. O uso continuado do 
              serviço após as alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Lei Aplicável e Foro</h2>
            <p className="text-gray-700">
              Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. 
              Fica eleito o foro da comarca de <strong>Duque de Caxias/RJ</strong> para dirimir 
              quaisquer controvérsias decorrentes deste contrato, com renúncia expressa 
              a qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Disposições Gerais</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Se qualquer cláusula for considerada inválida, as demais permanecem em vigor</li>
              <li>A tolerância ao descumprimento não implica renúncia de direitos</li>
              <li>Este contrato não gera vínculo empregatício, sociedade ou joint venture</li>
              <li>Você não pode ceder seus direitos sem nossa autorização prévia</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Contato</h2>
            <div className="bg-slate-50 p-6 rounded-lg">
              <p className="text-gray-700"><strong>GIOVANNA DE AZEVEDO DA SILVA</strong></p>
              <p className="text-gray-700">CNPJ: 59.608.874/0001-XX</p>
              <p className="text-gray-700">Nome Fantasia: Verus Sweeply</p>
              <p className="text-gray-700">Endereço: Rua Capitão Silva Barros - Duque de Caxias/RJ</p>
              <p className="text-gray-700">Email: contatoluishenriq@gmail.com</p>
            </div>
          </section>

          <section className="border-t pt-6 mt-8">
            <p className="text-sm text-gray-500">
              Ao clicar em "Aceito os Termos de Uso" ou ao utilizar o serviço, você declara 
              ter lido, compreendido e concordado integralmente com estes termos.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Para dúvidas sobre estes termos, entre em contato: contatoluishenriq@gmail.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
