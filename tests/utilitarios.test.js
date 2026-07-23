import test from 'node:test';
import assert from 'node:assert/strict';
import { analisarNumero, limparEntradaDecimal } from '../js/utilitarios.js';

const casos = [
    ['6,4', 6.4],
    ['6.4', 6.4],
    ['6,400', 6.4],
    ['6.400', 6.4],
    ['1.250,50', 1250.5],
    ['1,250.50', 1250.5],
    [' 20,750 kg ', 20.75]
];

for (const [entrada, esperado] of casos) {
    test(`interpreta ${entrada}`, () => {
        assert.equal(analisarNumero(entrada), esperado);
    });
}

test('diferencia campo vazio de zero', () => {
    assert.equal(analisarNumero(''), null);
    assert.equal(analisarNumero('0'), 0);
});

test('mantém apenas um separador decimal durante a digitação', () => {
    assert.equal(limparEntradaDecimal('1.2,3'), '12,3');
});
