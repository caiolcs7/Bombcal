export function analisarNumero(valor) {
    const texto = String(valor ?? '').trim().replace(/\s+/g, '');
    if (!texto) return null;

    const limpo = texto.replace(/[^0-9,.-]/g, '');
    if (!limpo || !/[0-9]/.test(limpo)) return Number.NaN;

    const negativo = limpo.startsWith('-');
    const corpo = limpo.replace(/-/g, '');
    const ultimaVirgula = corpo.lastIndexOf(',');
    const ultimoPonto = corpo.lastIndexOf('.');
    let normalizado;

    if (ultimaVirgula >= 0 && ultimoPonto >= 0) {
        const separadorDecimal = ultimaVirgula > ultimoPonto ? ',' : '.';
        const separadorMilhar = separadorDecimal === ',' ? '.' : ',';
        normalizado = corpo
            .replaceAll(separadorMilhar, '')
            .replace(separadorDecimal, '.');
    } else if (ultimaVirgula >= 0) {
        const partes = corpo.split(',');
        normalizado = partes.length === 2
            ? `${partes[0]}.${partes[1]}`
            : `${partes.slice(0, -1).join('')}.${partes.at(-1)}`;
    } else if (ultimoPonto >= 0) {
        const partes = corpo.split('.');
        normalizado = partes.length === 2
            ? `${partes[0]}.${partes[1]}`
            : `${partes.slice(0, -1).join('')}.${partes.at(-1)}`;
    } else {
        normalizado = corpo;
    }

    const numero = Number(`${negativo ? '-' : ''}${normalizado}`);
    return Number.isFinite(numero) ? numero : Number.NaN;
}

export function limparEntradaDecimal(valor) {
    const limpo = String(valor ?? '').replace(/[^0-9,.-]/g, '');
    const sinal = limpo.startsWith('-') ? '-' : '';
    const semSinal = limpo.replace(/-/g, '');

    const separadores = [...semSinal].filter((caractere) => caractere === ',' || caractere === '.');
    if (separadores.length <= 1) return `${sinal}${semSinal}`;

    const ultimoIndice = Math.max(semSinal.lastIndexOf(','), semSinal.lastIndexOf('.'));
    const inteiro = semSinal.slice(0, ultimoIndice).replace(/[,.]/g, '');
    const decimal = semSinal.slice(ultimoIndice + 1).replace(/[,.]/g, '');
    return `${sinal}${inteiro},${decimal}`;
}

export function formatarPeso(valor) {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
    }).format(valor);
}

export function formatarQuantidade(valor) {
    return new Intl.NumberFormat('pt-BR', {
        maximumFractionDigits: 0
    }).format(valor);
}

export function formatarPercentual(valorDecimal) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(valorDecimal);
}

export function formatarDataHora(dataIso) {
    const data = new Date(dataIso);
    if (Number.isNaN(data.getTime())) return 'Data indisponível';

    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short'
    }).format(data);
}

export function criarId(prefixo = 'registro') {
    if (globalThis.crypto?.randomUUID) return `${prefixo}-${crypto.randomUUID()}`;
    return `${prefixo}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function clonar(valor) {
    return JSON.parse(JSON.stringify(valor));
}

export function gerarIdentificador(texto) {
    return String(texto)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || criarId('recipiente');
}
