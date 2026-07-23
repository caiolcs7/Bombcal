import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularProducao } from '../js/calculadora.js';

const bombonaAzul = { id: 'bombona-azul', nome: 'Bombona Azul', taraKg: 6.4 };

test('calcula produção e mantém somente unidades completas', () => {
    const resultado = calcularProducao({
        pesoBrutoKg: 20,
        gramaturaG: 50,
        recipiente: bombonaAzul,
        taxaRendimento: 0.95,
        politicaArredondamento: 'truncar'
    });

    assert.equal(resultado.sucesso, true);
    assert.equal(resultado.detalhes.pesoLiquidoKg, 13.6);
    assert.equal(resultado.resultado, 258);
});

test('aceita peso igual à tara e retorna zero', () => {
    const resultado = calcularProducao({
        pesoBrutoKg: 6.4,
        gramaturaG: 50,
        recipiente: bombonaAzul
    });

    assert.equal(resultado.sucesso, true);
    assert.equal(resultado.resultado, 0);
});

test('rejeita peso menor que a tara com a mensagem definida', () => {
    const resultado = calcularProducao({
        pesoBrutoKg: 5,
        gramaturaG: 50,
        recipiente: bombonaAzul
    });

    assert.equal(resultado.sucesso, false);
    assert.equal(resultado.codigoErro, 'PESO_MENOR_QUE_TARA');
    assert.equal(resultado.campoErro, 'pesoBruto');
    assert.equal(
        resultado.mensagem,
        'Valor adicionado menor que a tara, insira um valor válido.'
    );
});

test('aplica arredondamento convencional quando configurado', () => {
    const resultado = calcularProducao({
        pesoBrutoKg: 10,
        gramaturaG: 64,
        recipiente: { taraKg: 1 },
        taxaRendimento: 0.95,
        politicaArredondamento: 'arredondar'
    });

    assert.equal(resultado.resultado, 134);
});

test('rejeita gramatura zero', () => {
    const resultado = calcularProducao({
        pesoBrutoKg: 20,
        gramaturaG: 0,
        recipiente: bombonaAzul
    });

    assert.equal(resultado.codigoErro, 'GRAMATURA_INVALIDA');
});
