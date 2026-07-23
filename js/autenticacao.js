import { TEMPO_SESSAO_ADMIN_MS } from './configuracao.js';

const CHAVE_SESSAO = 'bombonacalc_admin_expira_em';
const HASH_PIN_ADMIN = '7e66b5dd3d158d14ba3300cad5702ee6d72befaec37890eed25c91687bb649df';

async function gerarHash(texto) {
    const dados = new TextEncoder().encode(texto);
    const hash = await crypto.subtle.digest('SHA-256', dados);
    return [...new Uint8Array(hash)]
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
}

export async function validarPinAdmin(pin) {
    if (!globalThis.crypto?.subtle) return String(pin) === '3007';
    return (await gerarHash(String(pin))) === HASH_PIN_ADMIN;
}

export function abrirSessaoAdmin() {
    sessionStorage.setItem(CHAVE_SESSAO, String(Date.now() + TEMPO_SESSAO_ADMIN_MS));
}

export function encerrarSessaoAdmin() {
    sessionStorage.removeItem(CHAVE_SESSAO);
}

export function sessaoAdminAtiva() {
    const expiraEm = Number(sessionStorage.getItem(CHAVE_SESSAO));
    if (!Number.isFinite(expiraEm) || expiraEm <= Date.now()) {
        encerrarSessaoAdmin();
        return false;
    }
    return true;
}
