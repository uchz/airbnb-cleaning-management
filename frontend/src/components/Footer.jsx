import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Links Legais */}
          <div className="flex flex-wrap gap-4 text-sm">
            <Link to="/privacy" className="text-gray-600 hover:text-brand-600 transition-colors">
              Política de Privacidade
            </Link>
            <Link to="/terms" className="text-gray-600 hover:text-brand-600 transition-colors">
              Termos de Uso
            </Link>
            <a 
              href="mailto:contatoluishenriq@gmail.com" 
              className="text-gray-600 hover:text-brand-600 transition-colors"
            >
              Contato DPO
            </a>
          </div>

          {/* Badges de Compliance */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
              <span>🔒</span>
              <span>LGPD Compliant</span>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
              <span>🛡️</span>
              <span>SSL Seguro</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-4 pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Verus Sweeply - GIOVANNA DE AZEVEDO DA SILVA (CNPJ 59.608.874/0001-XX)</p>
          <p className="mt-1">Todos os direitos reservados. Dados protegidos conforme LGPD (Lei nº 13.709/2018)</p>
        </div>
      </div>
    </footer>
  );
}
