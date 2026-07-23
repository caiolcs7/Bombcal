import {
    MENSAGENS_ERRO,
    POLITICA_ARREDONDAMENTO_PADRAO,
    TAXA_RENDIMENTO_PADRAO
} from './configuracao.js';

function aplicarArredondamento(valor, politica) {
    if (politica === 'arredondar') return Math.round(valor);
    return Math.floor(valor);
}

export function calcularProducao({
    pesoBrutoKg,
    gramaturaG,
    recipiente,
    taxaRendimento = TAXA_RENDIMENTO_PADRAO,
    politicaArredondamento = POLITICA_ARREDONDAMENTO_PADRAO
}) {
    if (pesoBrutoKg === null || gramaturaG === null) {
        return falha('DADOS_INCOMPLETOS');
    }

    if (!recipiente || !Number.isFinite(recipiente.taraKg)) {
        return falha('RECIPIENTE_INVALIDO');
    }

    if (!Number.isFinite(pesoBrutoKg) || pesoBrutoKg < 0) {
        return falha('PESO_INVALIDO', 'pesoBruto');
    }

    if (!Number.isFinite(gramaturaG) || gramaturaG <= 0) {
        return falha('GRAMATURA_INVALIDA', 'gramatura');
    }

    if (pesoBrutoKg < recipiente.taraKg) {
        return falha('PESO_MENOR_QUE_TARA', 'pesoBruto');
    }

    const pesoLiquidoKg = pesoBrutoKg - recipiente.taraKg;
    const quantidadeEstimada = (pesoLiquidoKg * 1000) / gramaturaG;
    const quantidadeComRendimento = quantidadeEstimada * taxaRendimento;
    const quantidadeFinal = aplicarArredondamento(
        quantidadeComRendimento,
        politicaArredondamento
    );

    return {
        sucesso: true,
        codigoErro: null,
        mensagem: null,
        campoErro: null,
        resultado: quantidadeFinal,
        detalhes: {
            pesoBrutoKg,
            taraKg: recipiente.taraKg,
            pesoLiquidoKg,
            gramaturaG,
            taxaRendimento,
            politicaArredondamento,
            quantidadeEstimada,
            quantidadeComRendimento,
            quantidadeFinal
        }
    };
}

function falha(codigoErro, campoErro = null) {
    return {
        sucesso: false,
        codigoErro,
        mensagem: MENSAGENS_ERRO[codigoErro],
        campoErro,
        resultado: 0,
        detalhes: null
    };
}
