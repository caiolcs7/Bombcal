import {
    POLITICA_ARREDONDAMENTO_PADRAO,
    RECIPIENTES_PADRAO,
    TAXA_RENDIMENTO_PADRAO,
    VERSAO_APLICATIVO
} from './configuracao.js';
import { clonar } from './utilitarios.js';

const CHAVE_ESTADO = 'bombonacalc_estado_v3';
const CHAVE_HISTORICO_ANTIGO = 'bombonacalc_history';
const CHAVE_CONFIG_ANTIGA = 'bombonacalc_settings';
const VERSAO_SCHEMA = 4;
const LIMITE_HISTORICO = 200;
const LIMITE_REVISOES = 20;

export class ErroArmazenamento extends Error {}

export function criarEstadoPadrao() {
    return {
        schema: VERSAO_SCHEMA,
        versaoAplicativo: VERSAO_APLICATIVO,
        configuracoes: {
            tema: 'system',
            recipientePadraoId: 'bombona-azul',
            taxaRendimento: TAXA_RENDIMENTO_PADRAO,
            politicaArredondamento: POLITICA_ARREDONDAMENTO_PADRAO
        },
        recipientes: clonar(RECIPIENTES_PADRAO),
        historico: []
    };
}

function lerJson(chave) {
    const valor = localStorage.getItem(chave);
    if (!valor) return null;
    try { return JSON.parse(valor); } catch { return null; }
}

function salvarEstado(estado) {
    try {
        localStorage.setItem(CHAVE_ESTADO, JSON.stringify(estado));
    } catch (erro) {
        throw new ErroArmazenamento('Não foi possível salvar os dados neste dispositivo.', { cause: erro });
    }
}

function migrarDadosAntigos(estadoPadrao) {
    const historicoAntigo = lerJson(CHAVE_HISTORICO_ANTIGO);
    const configuracaoAntiga = lerJson(CHAVE_CONFIG_ANTIGA);

    if (configuracaoAntiga?.theme) estadoPadrao.configuracoes.tema = configuracaoAntiga.theme;
    if (configuracaoAntiga?.defaultBombona) {
        estadoPadrao.configuracoes.recipientePadraoId = configuracaoAntiga.defaultBombona === 'branca'
            ? 'bombona-azul'
            : `bombona-${configuracaoAntiga.defaultBombona}`;
    }

    if (Array.isArray(historicoAntigo)) {
        estadoPadrao.historico = historicoAntigo.map((item, indice) => {
            const tipoAntigo = item.tipoBombona ?? 'branca';
            const recipiente = tipoAntigo === 'branca'
                ? RECIPIENTES_PADRAO[0]
                : RECIPIENTES_PADRAO.find((registro) => registro.id.includes(tipoAntigo)) ?? RECIPIENTES_PADRAO[0];
            const quantidadeFinal = Math.floor(Number(item.resultado) || 0);
            return {
                id: item.id ?? `migrado-${indice}-${Date.now()}`,
                criadoEm: new Date().toISOString(),
                identificacao: { produtoId: '', endereco: '' },
                recipiente: clonar(recipiente),
                entrada: { pesoBrutoKg: Number(item.pesoBruto) || 0, gramaturaG: Number(item.gramatura) || 0 },
                calculo: {
                    pesoLiquidoKg: Math.max(0, (Number(item.pesoBruto) || 0) - recipiente.taraKg),
                    taxaRendimento: TAXA_RENDIMENTO_PADRAO,
                    politicaArredondamento: POLITICA_ARREDONDAMENTO_PADRAO,
                    quantidadeCalculadaOriginal: quantidadeFinal,
                    quantidadeFinal,
                    versaoFormula: 1
                },
                auditoria: { atualizadoEm: null, revisao: 0, alteracoes: [] },
                versaoAplicativo: 'migrado'
            };
        });
    }
    return estadoPadrao;
}

function normalizarRecipientes(recipientes, schemaAnterior) {
    const padroesPorId = new Map(RECIPIENTES_PADRAO.map((item) => [item.id, item]));
    return recipientes.map((item) => {
        const padrao = padroesPorId.get(item.id);
        const migrarCorGalao = schemaAnterior < 4
            && item.id === 'galao'
            && String(item.cor).toLowerCase() === '#d6a126';
        return { ...item, cor: migrarCorGalao ? padrao.cor : (item.cor ?? padrao?.cor ?? '#526873') };
    });
}

function normalizarRegistro(registro) {
    const quantidadeFinal = Number(registro?.calculo?.quantidadeFinal) || 0;
    return {
        ...registro,
        identificacao: {
            produtoId: String(registro?.identificacao?.produtoId ?? registro?.produtoId ?? '').trim().toLocaleUpperCase('pt-BR'),
            endereco: String(registro?.identificacao?.endereco ?? registro?.endereco ?? '').trim().toLocaleUpperCase('pt-BR')
        },
        calculo: {
            ...registro?.calculo,
            quantidadeCalculadaOriginal: Number(registro?.calculo?.quantidadeCalculadaOriginal ?? quantidadeFinal),
            quantidadeFinal
        },
        auditoria: {
            atualizadoEm: registro?.auditoria?.atualizadoEm ?? registro?.atualizadoEm ?? null,
            revisao: Number(registro?.auditoria?.revisao) || 0,
            alteracoes: Array.isArray(registro?.auditoria?.alteracoes)
                ? registro.auditoria.alteracoes.slice(-LIMITE_REVISOES)
                : []
        }
    };
}

function normalizarEstado(estado) {
    const padrao = criarEstadoPadrao();
    const schemaAnterior = Number(estado?.schema) || 0;
    const origem = Array.isArray(estado?.recipientes) && estado.recipientes.length ? estado.recipientes : padrao.recipientes;
    const recipientes = normalizarRecipientes(origem, schemaAnterior);
    const ativos = recipientes.filter((item) => item.ativo !== false);
    const padraoValido = ativos.some((item) => item.id === estado?.configuracoes?.recipientePadraoId);
    return {
        schema: VERSAO_SCHEMA,
        versaoAplicativo: VERSAO_APLICATIVO,
        configuracoes: {
            ...padrao.configuracoes,
            ...estado?.configuracoes,
            recipientePadraoId: padraoValido
                ? estado.configuracoes.recipientePadraoId
                : ativos[0]?.id ?? recipientes[0].id
        },
        recipientes,
        historico: Array.isArray(estado?.historico)
            ? estado.historico.map(normalizarRegistro).slice(0, LIMITE_HISTORICO)
            : []
    };
}

export function obterEstado() {
    let estado = lerJson(CHAVE_ESTADO);
    if (!estado) estado = migrarDadosAntigos(criarEstadoPadrao());
    const normalizado = normalizarEstado(estado);
    salvarEstado(normalizado);
    return normalizado;
}

export function atualizarEstado(mutacao) {
    const atual = obterEstado();
    const proximo = normalizarEstado(mutacao(clonar(atual)) ?? atual);
    salvarEstado(proximo);
    return proximo;
}

export function salvarConfiguracoes(configuracoes) {
    return atualizarEstado((estado) => {
        estado.configuracoes = { ...estado.configuracoes, ...configuracoes };
        return estado;
    });
}

export function salvarRecipientes(recipientes) {
    return atualizarEstado((estado) => { estado.recipientes = recipientes; return estado; });
}

export function adicionarHistorico(registro) {
    return atualizarEstado((estado) => {
        estado.historico.unshift(normalizarRegistro(registro));
        estado.historico = estado.historico.slice(0, LIMITE_HISTORICO);
        return estado;
    });
}

export function atualizarHistorico(id, mutacao) {
    let atualizado = null;
    const estado = atualizarEstado((rascunho) => {
        const indice = rascunho.historico.findIndex((item) => item.id === id);
        if (indice < 0) return rascunho;
        const atual = clonar(rascunho.historico[indice]);
        atualizado = normalizarRegistro(mutacao(atual) ?? atual);
        rascunho.historico[indice] = atualizado;
        return rascunho;
    });
    return { estado, atualizado };
}

export function removerHistorico(id) {
    let removido = null;
    const estado = atualizarEstado((rascunho) => {
        const indice = rascunho.historico.findIndex((item) => item.id === id);
        if (indice >= 0) [removido] = rascunho.historico.splice(indice, 1);
        return rascunho;
    });
    return { estado, removido };
}

export function restaurarHistorico(registro) {
    if (!registro) return obterEstado();
    return atualizarEstado((estado) => {
        estado.historico = estado.historico.filter((item) => item.id !== registro.id);
        estado.historico.unshift(normalizarRegistro(registro));
        return estado;
    });
}

export function limparHistorico() {
    return atualizarEstado((estado) => { estado.historico = []; return estado; });
}

export function restaurarPadroesAdministrativos() {
    return atualizarEstado((estado) => {
        estado.recipientes = clonar(RECIPIENTES_PADRAO);
        estado.configuracoes.recipientePadraoId = 'bombona-azul';
        estado.configuracoes.taxaRendimento = TAXA_RENDIMENTO_PADRAO;
        estado.configuracoes.politicaArredondamento = POLITICA_ARREDONDAMENTO_PADRAO;
        return estado;
    });
}
