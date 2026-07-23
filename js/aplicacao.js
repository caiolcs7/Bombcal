import {
    VERSAO_APLICATIVO,
    VERSAO_FORMULA
} from './configuracao.js';
import { calcularProducao } from './calculadora.js';
import {
    adicionarHistorico,
    atualizarHistorico,
    ErroArmazenamento,
    limparHistorico,
    obterEstado,
    removerHistorico,
    restaurarHistorico,
    restaurarPadroesAdministrativos,
    salvarConfiguracoes,
    salvarRecipientes
} from './armazenamento.js';
import {
    abrirSessaoAdmin,
    encerrarSessaoAdmin,
    sessaoAdminAtiva,
    validarPinAdmin
} from './autenticacao.js';
import {
    alternarTela,
    aplicarTema,
    abrirDialogEdicao,
    abrirDialogSalvar,
    atualizarCalculo,
    atualizarEstadoAdmin,
    configurarFechamentoDialogos,
    elementos,
    fecharDialogEdicao,
    fecharDialogSalvar,
    lerDadosEdicao,
    lerDadosSalvar,
    lerEditorRecipientes,
    mostrarDetalhes,
    mostrarErroEdicao,
    mostrarErroSalvar,
    mostrarToast,
    preencherEditorAdmin,
    renderizarHistorico,
    renderizarRecipientes,
    renderizarSelectRecipientes
} from './interface.js';
import {
    analisarNumero,
    criarId,
    formatarPeso,
    gerarIdentificador,
    limparEntradaDecimal
} from './utilitarios.js';

const estadoSessao = {
    estado: null,
    recipienteAtualId: null,
    calculoAtual: null,
    ultimoSalvamento: { assinatura: null, momento: 0 },
    registroRemovido: null,
    registroServiceWorker: null,
    termoBuscaProduto: ''
};

function iniciar() {
    try {
        estadoSessao.estado = obterEstado();
    } catch (erro) {
        console.error(erro);
        estadoSessao.estado = {
            configuracoes: {
                tema: 'system',
                recipientePadraoId: 'bombona-azul',
                taxaRendimento: 0.95,
                politicaArredondamento: 'truncar'
            },
            recipientes: [],
            historico: []
        };
        mostrarToast('O armazenamento local não está disponível.');
    }

    estadoSessao.recipienteAtualId = escolherRecipienteInicial();
    aplicarTema(estadoSessao.estado.configuracoes.tema);
    elementos.selectTema.value = estadoSessao.estado.configuracoes.tema;
    atualizarInterfaceCompleta();
    configurarEventos();
    configurarFechamentoDialogos();
    registrarServiceWorker();
    executarCalculo();
}

function escolherRecipienteInicial() {
    const ativos = recipientesAtivos();
    const padrao = ativos.find(
        (item) => item.id === estadoSessao.estado.configuracoes.recipientePadraoId
    );
    return padrao?.id ?? ativos[0]?.id ?? null;
}

function recipientesAtivos() {
    return estadoSessao.estado.recipientes.filter((item) => item.ativo !== false);
}

function recipienteAtual() {
    return estadoSessao.estado.recipientes.find(
        (item) => item.id === estadoSessao.recipienteAtualId
    ) ?? null;
}

function atualizarInterfaceCompleta() {
    const ativos = recipientesAtivos();
    renderizarRecipientes(ativos, estadoSessao.recipienteAtualId, selecionarRecipiente);
    renderizarSelectRecipientes(
        ativos,
        estadoSessao.estado.configuracoes.recipientePadraoId
    );
    renderizarHistoricoAtual();
    atualizarPainelAdmin();
}

function renderizarHistoricoAtual() {
    const termo = estadoSessao.termoBuscaProduto.trim().toLocaleUpperCase('pt-BR');
    const historico = termo
        ? estadoSessao.estado.historico.filter((registro) =>
            String(registro.identificacao?.produtoId ?? '')
                .toLocaleUpperCase('pt-BR')
                .includes(termo)
        )
        : estadoSessao.estado.historico;

    renderizarHistorico(historico, {
        aoCarregar: carregarRegistro,
        aoEditar: abrirEdicaoRegistro,
        aoDetalhar: mostrarDetalhes,
        aoExcluir: excluirRegistro
    });

    elementos.statusBusca.textContent = termo
        ? `${historico.length} registro(s) encontrado(s) para “${termo}”.`
        : '';
}

function configurarEventos() {
    elementos.inputPesoBruto.addEventListener('input', (evento) => {
        evento.target.value = limparEntradaDecimal(evento.target.value);
        executarCalculo();
    });

    elementos.inputGramatura.addEventListener('input', (evento) => {
        evento.target.value = limparEntradaDecimal(evento.target.value);
        executarCalculo();
    });

    [
        elementos.inputProdutoIdSalvar,
        elementos.inputEnderecoSalvar,
        elementos.inputProdutoIdEditar,
        elementos.inputEnderecoEditar,
        elementos.inputBuscaProduto
    ].forEach((input) => {
        input.addEventListener('input', (evento) => {
            const inicio = evento.target.selectionStart;
            evento.target.value = evento.target.value.toLocaleUpperCase('pt-BR');
            if (inicio !== null) evento.target.setSelectionRange(inicio, inicio);
        });
    });

    elementos.inputBuscaProduto.addEventListener('input', () => {
        estadoSessao.termoBuscaProduto = elementos.inputBuscaProduto.value;
        renderizarHistoricoAtual();
    });
    elementos.btnLimparBusca.addEventListener('click', () => {
        elementos.inputBuscaProduto.value = '';
        estadoSessao.termoBuscaProduto = '';
        renderizarHistoricoAtual();
        elementos.inputBuscaProduto.focus();
    });

    elementos.btnSalvar.addEventListener('click', abrirSalvamentoAtual);
    elementos.formSalvarRegistro.addEventListener('submit', confirmarSalvamentoAtual);
    elementos.formEditarRegistro.addEventListener('submit', salvarEdicaoRegistro);
    elementos.inputQuantidadeEditar.addEventListener('input', (evento) => {
        evento.target.value = limparEntradaDecimal(evento.target.value);
    });
    elementos.btnCopiar.addEventListener('click', copiarResultado);
    elementos.btnLimpar.addEventListener('click', limparCampos);
    elementos.btnAbrirConfiguracoes.addEventListener('click', () => {
        alternarTela('configuracoes');
        atualizarPainelAdmin();
    });
    elementos.btnVoltar.addEventListener('click', () => alternarTela('calculadora'));

    elementos.selectTema.addEventListener('change', () => {
        executarOperacaoArmazenamento(() => {
            estadoSessao.estado = salvarConfiguracoes({ tema: elementos.selectTema.value });
            aplicarTema(elementos.selectTema.value);
        });
    });

    elementos.selectRecipientePadrao.addEventListener('change', () => {
        executarOperacaoArmazenamento(() => {
            estadoSessao.estado = salvarConfiguracoes({
                recipientePadraoId: elementos.selectRecipientePadrao.value
            });
            mostrarToast('Recipiente inicial atualizado.');
        });
    });

    elementos.btnDesbloquearAdmin.addEventListener('click', abrirDialogPin);
    elementos.formPin.addEventListener('submit', tratarPinAdmin);
    elementos.btnBloquearAdmin.addEventListener('click', bloquearAdministracao);
    elementos.btnAdicionarRecipiente.addEventListener('click', adicionarRecipienteAoEditor);
    elementos.btnSalvarAdmin.addEventListener('click', salvarConfiguracoesAdministrativas);
    elementos.btnRestaurarPadroes.addEventListener('click', restaurarPadroes);
    elementos.btnSolicitarLimpezaHistorico.addEventListener('click', () => {
        if (!garantirSessaoAdmin()) return;
        elementos.dialogConfirmacao.showModal();
    });
    elementos.btnConfirmarLimpeza.addEventListener('click', apagarHistorico);

    elementos.btnAtualizarApp.addEventListener('click', atualizarAplicativo);

    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (estadoSessao.estado.configuracoes.tema === 'system') aplicarTema('system');
    });
}

function selecionarRecipiente(id) {
    estadoSessao.recipienteAtualId = id;
    renderizarRecipientes(recipientesAtivos(), id, selecionarRecipiente);
    executarCalculo();
}

function executarCalculo() {
    const calculo = calcularProducao({
        pesoBrutoKg: analisarNumero(elementos.inputPesoBruto.value),
        gramaturaG: analisarNumero(elementos.inputGramatura.value),
        recipiente: recipienteAtual(),
        taxaRendimento: estadoSessao.estado.configuracoes.taxaRendimento,
        politicaArredondamento: estadoSessao.estado.configuracoes.politicaArredondamento
    });

    estadoSessao.calculoAtual = calculo;
    atualizarCalculo(calculo, recipienteAtual(), estadoSessao.estado.configuracoes);
}

function abrirSalvamentoAtual() {
    const calculo = estadoSessao.calculoAtual;
    const recipiente = recipienteAtual();
    if (!calculo?.sucesso || !recipiente) return;
    abrirDialogSalvar(calculo, recipiente);
}

function confirmarSalvamentoAtual(evento) {
    evento.preventDefault();
    const calculo = estadoSessao.calculoAtual;
    const recipiente = recipienteAtual();
    const identificacao = lerDadosSalvar();

    if (!calculo?.sucesso || !recipiente) {
        mostrarErroSalvar('O cálculo deixou de ser válido. Feche esta janela e calcule novamente.');
        return;
    }
    const erro = validarIdentificacaoRegistro(identificacao);
    if (erro) { mostrarErroSalvar(erro); return; }

    const assinatura = [
        recipiente.id,
        calculo.detalhes.pesoBrutoKg,
        calculo.detalhes.gramaturaG,
        calculo.detalhes.taxaRendimento,
        calculo.resultado,
        identificacao.produtoId,
        identificacao.endereco
    ].join('|');
    const agora = Date.now();
    if (assinatura === estadoSessao.ultimoSalvamento.assinatura && agora - estadoSessao.ultimoSalvamento.momento < 1200) return;

    const registro = {
        id: criarId('calculo'),
        criadoEm: new Date().toISOString(),
        identificacao,
        recipiente: { id: recipiente.id, nome: recipiente.nome, taraKg: recipiente.taraKg, cor: recipiente.cor },
        entrada: { pesoBrutoKg: calculo.detalhes.pesoBrutoKg, gramaturaG: calculo.detalhes.gramaturaG },
        calculo: {
            pesoLiquidoKg: calculo.detalhes.pesoLiquidoKg,
            quantidadeEstimada: calculo.detalhes.quantidadeEstimada,
            quantidadeComRendimento: calculo.detalhes.quantidadeComRendimento,
            taxaRendimento: calculo.detalhes.taxaRendimento,
            politicaArredondamento: calculo.detalhes.politicaArredondamento,
            quantidadeCalculadaOriginal: calculo.detalhes.quantidadeFinal,
            quantidadeFinal: calculo.detalhes.quantidadeFinal,
            versaoFormula: VERSAO_FORMULA
        },
        auditoria: { atualizadoEm: null, revisao: 0, alteracoes: [] },
        versaoAplicativo: VERSAO_APLICATIVO
    };

    executarOperacaoArmazenamento(() => {
        estadoSessao.estado = adicionarHistorico(registro);
        estadoSessao.ultimoSalvamento = { assinatura, momento: agora };
        fecharDialogSalvar();
        renderizarHistoricoAtual();
        mostrarToast(`Produto ${identificacao.produtoId} salvo no histórico.`);
    });
}

function validarIdentificacaoRegistro({ produtoId, endereco }) {
    if (!produtoId) return 'Informe o ID do produto.';
    if (!endereco) return 'Informe o endereço.';
    if (produtoId.length > 80) return 'O ID do produto deve ter até 80 caracteres.';
    if (endereco.length > 120) return 'O endereço deve ter até 120 caracteres.';
    return null;
}

function abrirEdicaoRegistro(registro) { abrirDialogEdicao(registro); }

function salvarEdicaoRegistro(evento) {
    evento.preventDefault();
    const dados = lerDadosEdicao();
    const erro = validarIdentificacaoRegistro(dados);
    const quantidade = analisarNumero(dados.quantidadeTexto);
    if (erro) { mostrarErroEdicao(erro); return; }
    if (!Number.isFinite(quantidade) || quantidade < 0) {
        mostrarErroEdicao('Informe uma quantidade válida e não negativa.');
        return;
    }
    if (!Number.isInteger(quantidade)) {
        mostrarErroEdicao('A quantidade deve ser informada em unidades inteiras.');
        return;
    }

    const registroAtual = estadoSessao.estado.historico.find((item) => item.id === dados.registroId);
    if (!registroAtual) { mostrarErroEdicao('Este registro não foi encontrado.'); return; }
    const anterior = {
        produtoId: registroAtual.identificacao?.produtoId ?? '',
        endereco: registroAtual.identificacao?.endereco ?? '',
        quantidadeFinal: registroAtual.calculo.quantidadeFinal
    };
    const atual = { produtoId: dados.produtoId, endereco: dados.endereco, quantidadeFinal: quantidade };
    if (anterior.produtoId === atual.produtoId && anterior.endereco === atual.endereco && anterior.quantidadeFinal === atual.quantidadeFinal) {
        fecharDialogEdicao();
        mostrarToast('Nenhuma alteração foi realizada.');
        return;
    }

    executarOperacaoArmazenamento(() => {
        const momento = new Date().toISOString();
        const resultado = atualizarHistorico(dados.registroId, (registro) => {
            registro.identificacao = { produtoId: atual.produtoId, endereco: atual.endereco };
            registro.calculo.quantidadeFinal = atual.quantidadeFinal;
            registro.auditoria = registro.auditoria ?? { atualizadoEm: null, revisao: 0, alteracoes: [] };
            registro.auditoria.atualizadoEm = momento;
            registro.auditoria.revisao = (registro.auditoria.revisao ?? 0) + 1;
            registro.auditoria.alteracoes = [
                ...(registro.auditoria.alteracoes ?? []),
                { em: momento, anterior, atual }
            ].slice(-20);
            return registro;
        });
        if (!resultado.atualizado) { mostrarErroEdicao('Este registro não foi encontrado.'); return; }
        estadoSessao.estado = resultado.estado;
        fecharDialogEdicao();
        renderizarHistoricoAtual();
        mostrarToast('Registro atualizado e revisão salva.');
    });
}

async function copiarResultado() {
    if (!estadoSessao.calculoAtual?.sucesso) return;
    const texto = String(estadoSessao.calculoAtual.resultado);

    try {
        await navigator.clipboard.writeText(texto);
        mostrarToast('Resultado copiado.');
    } catch {
        mostrarToast('Não foi possível copiar o resultado.');
    }
}

function limparCampos() {
    elementos.inputPesoBruto.value = '';
    elementos.inputGramatura.value = '';
    elementos.inputPesoBruto.focus();
    executarCalculo();
}

function carregarRegistro(registro) {
    const recipienteDisponivel = recipientesAtivos().find(
        (item) => item.id === registro.recipiente.id
    );

    if (!recipienteDisponivel) {
        mostrarToast('O recipiente deste registro não está ativo.');
        mostrarDetalhes(registro);
        return;
    }

    estadoSessao.recipienteAtualId = recipienteDisponivel.id;
    elementos.inputPesoBruto.value = formatarPeso(registro.entrada.pesoBrutoKg);
    elementos.inputGramatura.value = String(registro.entrada.gramaturaG).replace('.', ',');
    renderizarRecipientes(recipientesAtivos(), recipienteDisponivel.id, selecionarRecipiente);
    alternarTela('calculadora');
    executarCalculo();
    mostrarToast('Valores carregados. O registro não foi salvo novamente.');
}

function excluirRegistro(registro) {
    executarOperacaoArmazenamento(() => {
        const resultado = removerHistorico(registro.id);
        estadoSessao.estado = resultado.estado;
        estadoSessao.registroRemovido = resultado.removido;
        renderizarHistoricoAtual();
        mostrarToast('Registro excluído.', {
            rotulo: 'Desfazer',
            executar: desfazerExclusao
        });
    });
}

function desfazerExclusao() {
    if (!estadoSessao.registroRemovido) return;
    executarOperacaoArmazenamento(() => {
        estadoSessao.estado = restaurarHistorico(estadoSessao.registroRemovido);
        estadoSessao.registroRemovido = null;
        renderizarHistoricoAtual();
        mostrarToast('Registro restaurado.');
    });
}

function abrirDialogPin() {
    elementos.erroPin.textContent = '';
    elementos.inputPin.value = '';
    elementos.dialogPin.showModal();
    setTimeout(() => elementos.inputPin.focus(), 0);
}

async function tratarPinAdmin(evento) {
    evento.preventDefault();
    elementos.erroPin.textContent = '';

    if (await validarPinAdmin(elementos.inputPin.value)) {
        abrirSessaoAdmin();
        elementos.dialogPin.close();
        atualizarPainelAdmin();
        mostrarToast('Administração desbloqueada por 10 minutos.');
        return;
    }

    elementos.erroPin.textContent = 'PIN incorreto.';
    elementos.inputPin.select();
}

function bloquearAdministracao() {
    encerrarSessaoAdmin();
    atualizarPainelAdmin();
    mostrarToast('Administração bloqueada.');
}

function atualizarPainelAdmin() {
    const desbloqueado = sessaoAdminAtiva();
    atualizarEstadoAdmin(desbloqueado);
    if (desbloqueado) preencherEditorAdmin(estadoSessao.estado, removerRecipienteDoEditor);
}

function garantirSessaoAdmin() {
    if (sessaoAdminAtiva()) return true;
    atualizarPainelAdmin();
    abrirDialogPin();
    return false;
}

function adicionarRecipienteAoEditor() {
    if (!garantirSessaoAdmin()) return;
    const atuais = lerEditorRecipientes();
    const baseId = gerarIdentificador(`recipiente-${atuais.length + 1}`);
    let id = baseId;
    let contador = 2;
    while (atuais.some((item) => item.id === id)) id = `${baseId}-${contador++}`;

    atuais.push({
        id,
        nome: 'Novo recipiente',
        taraKg: 0,
        cor: '#526873',
        ativo: true
    });

    preencherEditorAdmin(
        { ...estadoSessao.estado, recipientes: atuais },
        removerRecipienteDoEditor
    );
}

function removerRecipienteDoEditor(id) {
    if (!garantirSessaoAdmin()) return;
    const atuais = lerEditorRecipientes();
    const restantes = atuais.filter((item) => item.id !== id);

    if (!restantes.length) {
        mostrarToast('Mantenha ao menos um recipiente.');
        return;
    }

    preencherEditorAdmin(
        { ...estadoSessao.estado, recipientes: restantes },
        removerRecipienteDoEditor
    );
}

function salvarConfiguracoesAdministrativas() {
    if (!garantirSessaoAdmin()) return;

    const recipientes = lerEditorRecipientes();
    const taxaRendimento = Number(elementos.inputRendimento.value) / 100;
    const politicaArredondamento = elementos.selectArredondamento.value;
    const erro = validarConfiguracoesAdministrativas(
        recipientes,
        taxaRendimento,
        politicaArredondamento
    );

    if (erro) {
        mostrarToast(erro);
        return;
    }

    executarOperacaoArmazenamento(() => {
        estadoSessao.estado = salvarRecipientes(recipientes);
        estadoSessao.estado = salvarConfiguracoes({
            taxaRendimento,
            politicaArredondamento
        });

        const ativos = recipientesAtivos();
        if (!ativos.some((item) => item.id === estadoSessao.recipienteAtualId)) {
            estadoSessao.recipienteAtualId = ativos[0].id;
        }

        if (!ativos.some((item) => item.id === estadoSessao.estado.configuracoes.recipientePadraoId)) {
            estadoSessao.estado = salvarConfiguracoes({ recipientePadraoId: ativos[0].id });
        }

        atualizarInterfaceCompleta();
        executarCalculo();
        mostrarToast('Configurações administrativas salvas.');
    });
}

function validarConfiguracoesAdministrativas(recipientes, taxaRendimento, politica) {
    if (!recipientes.length) return 'Cadastre ao menos um recipiente.';
    if (!recipientes.some((item) => item.ativo)) return 'Mantenha ao menos um recipiente ativo.';
    if (recipientes.some((item) => !item.nome)) return 'Todos os recipientes precisam de nome.';
    if (recipientes.some((item) => !Number.isFinite(item.taraKg) || item.taraKg < 0)) {
        return 'Informe taras válidas e não negativas.';
    }
    if (new Set(recipientes.map((item) => item.id)).size !== recipientes.length) {
        return 'Existem identificadores de recipiente duplicados.';
    }
    if (!Number.isFinite(taxaRendimento) || taxaRendimento <= 0 || taxaRendimento > 1) {
        return 'O rendimento deve ficar entre 1% e 100%.';
    }
    if (!['truncar', 'arredondar'].includes(politica)) return 'Política de arredondamento inválida.';
    return null;
}

function restaurarPadroes() {
    if (!garantirSessaoAdmin()) return;

    executarOperacaoArmazenamento(() => {
        estadoSessao.estado = restaurarPadroesAdministrativos();
        estadoSessao.recipienteAtualId = escolherRecipienteInicial();
        atualizarInterfaceCompleta();
        executarCalculo();
        mostrarToast('Taras e fórmula restauradas para os padrões.');
    });
}

function apagarHistorico() {
    if (!garantirSessaoAdmin()) return;
    executarOperacaoArmazenamento(() => {
        estadoSessao.estado = limparHistorico();
        elementos.dialogConfirmacao.close();
        renderizarHistoricoAtual();
        mostrarToast('Histórico apagado.');
    });
}

function executarOperacaoArmazenamento(operacao) {
    try {
        operacao();
    } catch (erro) {
        console.error(erro);
        mostrarToast(
            erro instanceof ErroArmazenamento
                ? erro.message
                : 'Não foi possível concluir a operação.'
        );
    }
}

function registrarServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', async () => {
        try {
            const registro = await navigator.serviceWorker.register('./sw.js');
            estadoSessao.registroServiceWorker = registro;

            if (registro.waiting) elementos.avisoAtualizacao.classList.remove('oculto');

            registro.addEventListener('updatefound', () => {
                const instalando = registro.installing;
                instalando?.addEventListener('statechange', () => {
                    if (instalando.state === 'installed' && navigator.serviceWorker.controller) {
                        elementos.avisoAtualizacao.classList.remove('oculto');
                    }
                });
            });

            let recarregando = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (recarregando) return;
                recarregando = true;
                location.reload();
            });
        } catch (erro) {
            console.warn('Service Worker indisponível:', erro);
        }
    });
}

function atualizarAplicativo() {
    const esperando = estadoSessao.registroServiceWorker?.waiting;
    if (esperando) esperando.postMessage({ tipo: 'ATIVAR_AGORA' });
    else location.reload();
}

document.addEventListener('DOMContentLoaded', iniciar);
