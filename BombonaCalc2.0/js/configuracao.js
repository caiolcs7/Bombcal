export const VERSAO_APLICATIVO = '4.2.1-pages';
export const VERSAO_FORMULA = 1;
export const TAXA_RENDIMENTO_PADRAO = 0.95;
export const POLITICA_ARREDONDAMENTO_PADRAO = 'truncar';
export const TEMPO_SESSAO_ADMIN_MS = 10 * 60 * 1000;

export const RECIPIENTES_PADRAO = Object.freeze([
    { id: 'bombona-azul', nome: 'Bombona Azul', taraKg: 6.4, cor: '#2563eb', ativo: true },
    { id: 'bombona-marrom', nome: 'Bombona Marrom', taraKg: 9.2, cor: '#8b5a2b', ativo: true },
    { id: 'caixa-vermelha', nome: 'Caixa Vermelha', taraKg: 3, cor: '#ef4444', ativo: true },
    { id: 'galao', nome: 'Galão', taraKg: 1, cor: '#06b6d4', ativo: true }
]);

export const MENSAGENS_ERRO = Object.freeze({
    DADOS_INCOMPLETOS: 'Preencha o peso bruto e a gramatura.',
    RECIPIENTE_INVALIDO: 'Selecione um recipiente válido.',
    PESO_INVALIDO: 'Informe um peso bruto válido.',
    GRAMATURA_INVALIDA: 'A gramatura deve ser maior que zero.',
    PESO_MENOR_QUE_TARA: 'Valor adicionado menor que a tara, insira um valor válido.'
});
