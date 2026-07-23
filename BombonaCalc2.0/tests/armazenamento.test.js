import test from 'node:test';
import assert from 'node:assert/strict';

class LocalStorageMemoria {
    #dados = new Map();
    getItem(chave) { return this.#dados.has(chave) ? this.#dados.get(chave) : null; }
    setItem(chave, valor) { this.#dados.set(chave, String(valor)); }
    removeItem(chave) { this.#dados.delete(chave); }
    clear() { this.#dados.clear(); }
}

globalThis.localStorage = new LocalStorageMemoria();

const armazenamento = await import('../js/armazenamento.js');

test('inicia com Bombona Azul e quatro recipientes', () => {
    localStorage.clear();
    const estado = armazenamento.obterEstado();
    assert.equal(estado.recipientes.length, 4);
    assert.equal(estado.recipientes[0].nome, 'Bombona Azul');
    assert.equal(estado.configuracoes.recipientePadraoId, 'bombona-azul');
});

test('histórico só muda quando adicionarHistorico é chamado', () => {
    localStorage.clear();
    const inicial = armazenamento.obterEstado();
    assert.equal(inicial.historico.length, 0);

    const atualizado = armazenamento.adicionarHistorico({ id: '1' });
    assert.equal(atualizado.historico.length, 1);
});

test('migra o recipiente branca para Bombona Azul', () => {
    localStorage.clear();
    localStorage.setItem('bombonacalc_settings', JSON.stringify({ defaultBombona: 'branca' }));
    localStorage.setItem('bombonacalc_history', JSON.stringify([
        { id: 'antigo', tipoBombona: 'branca', pesoBruto: 10, gramatura: 50, resultado: 68 }
    ]));

    const estado = armazenamento.obterEstado();
    assert.equal(estado.configuracoes.recipientePadraoId, 'bombona-azul');
    assert.equal(estado.historico[0].recipiente.nome, 'Bombona Azul');
});

test('Galão usa azul diferente da Bombona Azul', () => {
    localStorage.clear();
    const estado = armazenamento.obterEstado();
    const bombona = estado.recipientes.find((item) => item.id === 'bombona-azul');
    const galao = estado.recipientes.find((item) => item.id === 'galao');
    assert.notEqual(galao.cor, bombona.cor);
    assert.equal(galao.cor, '#06b6d4');
});

test('salva identificação e preserva auditoria ao editar quantidade', () => {
    localStorage.clear();
    armazenamento.obterEstado();
    const registro = {
        id: 'registro-editavel',
        criadoEm: '2026-07-22T20:00:00.000Z',
        identificacao: { produtoId: 'PROD-10', endereco: 'A-01' },
        recipiente: { id: 'galao', nome: 'Galão', taraKg: 1, cor: '#06b6d4' },
        entrada: { pesoBrutoKg: 10, gramaturaG: 50 },
        calculo: {
            pesoLiquidoKg: 9,
            taxaRendimento: 0.95,
            politicaArredondamento: 'truncar',
            quantidadeCalculadaOriginal: 171,
            quantidadeFinal: 171,
            versaoFormula: 1
        },
        auditoria: { atualizadoEm: null, revisao: 0, alteracoes: [] },
        versaoAplicativo: '3.1.0'
    };
    armazenamento.adicionarHistorico(registro);
    const resultado = armazenamento.atualizarHistorico('registro-editavel', (item) => {
        item.identificacao = { produtoId: 'PROD-11', endereco: 'B-07' };
        item.calculo.quantidadeFinal = 168;
        item.auditoria.revisao = 1;
        item.auditoria.atualizadoEm = '2026-07-22T21:00:00.000Z';
        item.auditoria.alteracoes.push({
            em: item.auditoria.atualizadoEm,
            anterior: { produtoId: 'PROD-10', endereco: 'A-01', quantidadeFinal: 171 },
            atual: { produtoId: 'PROD-11', endereco: 'B-07', quantidadeFinal: 168 }
        });
        return item;
    });
    assert.equal(resultado.atualizado.identificacao.produtoId, 'PROD-11');
    assert.equal(resultado.atualizado.identificacao.endereco, 'B-07');
    assert.equal(resultado.atualizado.calculo.quantidadeFinal, 168);
    assert.equal(resultado.atualizado.calculo.quantidadeCalculadaOriginal, 171);
    assert.equal(resultado.atualizado.auditoria.revisao, 1);
});


test('normaliza ID e endereço antigos para letras maiúsculas', () => {
    localStorage.setItem('bombonacalc_estado_v3', JSON.stringify({
        configuracoes: {},
        recipientes: [],
        historico: [{
            id: 'x1',
            criadoEm: new Date().toISOString(),
            identificacao: { produtoId: 'prod-abc', endereco: 'rua a-10' },
            recipiente: { id: 'galao', nome: 'Galão', taraKg: 1, cor: '#00a8d6' },
            entrada: { pesoBrutoKg: 10, gramaturaG: 50 },
            calculo: { quantidadeFinal: 171 }
        }]
    }));
    const estado = armazenamento.obterEstado();
    assert.equal(estado.historico[0].identificacao.produtoId, 'PROD-ABC');
    assert.equal(estado.historico[0].identificacao.endereco, 'RUA A-10');
});
