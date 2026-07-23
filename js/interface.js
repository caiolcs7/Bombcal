import {
    formatarDataHora,
    formatarPeso,
    formatarPercentual,
    formatarQuantidade
} from './utilitarios.js';

export const elementos = {
    app: document.getElementById('app'),
    telaCalculadora: document.getElementById('tela-calculadora'),
    telaConfiguracoes: document.getElementById('tela-configuracoes'),
    btnAbrirConfiguracoes: document.getElementById('btn-abrir-configuracoes'),
    btnVoltar: document.getElementById('btn-voltar'),
    listaRecipientes: document.getElementById('lista-recipientes'),
    inputPesoBruto: document.getElementById('input-peso-bruto'),
    inputGramatura: document.getElementById('input-gramatura'),
    erroPesoBruto: document.getElementById('erro-peso-bruto'),
    erroGramatura: document.getElementById('erro-gramatura'),
    painelResultado: document.getElementById('painel-resultado'),
    resultadoValor: document.getElementById('resultado-valor'),
    resultadoMensagem: document.getElementById('resultado-mensagem'),
    resultadoRecipiente: document.getElementById('resultado-recipiente'),
    resumoCalculo: document.getElementById('resumo-calculo'),
    resumoPesoBruto: document.getElementById('resumo-peso-bruto'),
    resumoTara: document.getElementById('resumo-tara'),
    resumoPesoLiquido: document.getElementById('resumo-peso-liquido'),
    resumoGramatura: document.getElementById('resumo-gramatura'),
    resumoRegra: document.getElementById('resumo-regra'),
    btnSalvar: document.getElementById('btn-salvar'),
    btnCopiar: document.getElementById('btn-copiar'),
    btnLimpar: document.getElementById('btn-limpar'),
    listaHistorico: document.getElementById('lista-historico'),
    contadorHistorico: document.getElementById('contador-historico'),
    inputBuscaProduto: document.getElementById('input-busca-produto'),
    btnLimparBusca: document.getElementById('btn-limpar-busca'),
    statusBusca: document.getElementById('status-busca'),
    selectTema: document.getElementById('select-tema'),
    selectRecipientePadrao: document.getElementById('select-recipiente-padrao'),
    statusAdmin: document.getElementById('status-admin'),
    adminBloqueado: document.getElementById('admin-bloqueado'),
    adminConteudo: document.getElementById('admin-conteudo'),
    btnDesbloquearAdmin: document.getElementById('btn-desbloquear-admin'),
    btnBloquearAdmin: document.getElementById('btn-bloquear-admin'),
    btnAdicionarRecipiente: document.getElementById('btn-adicionar-recipiente'),
    btnSalvarAdmin: document.getElementById('btn-salvar-admin'),
    btnRestaurarPadroes: document.getElementById('btn-restaurar-padroes'),
    btnSolicitarLimpezaHistorico: document.getElementById('btn-solicitar-limpeza-historico'),
    btnConfirmarLimpeza: document.getElementById('btn-confirmar-limpeza'),
    editorRecipientes: document.getElementById('editor-recipientes'),
    inputRendimento: document.getElementById('input-rendimento'),
    selectArredondamento: document.getElementById('select-arredondamento'),
    dialogPin: document.getElementById('dialog-pin'),
    formPin: document.getElementById('form-pin'),
    inputPin: document.getElementById('input-pin'),
    erroPin: document.getElementById('erro-pin'),
    dialogSalvarRegistro: document.getElementById('dialog-salvar-registro'),
    formSalvarRegistro: document.getElementById('form-salvar-registro'),
    inputProdutoIdSalvar: document.getElementById('input-produto-id-salvar'),
    inputEnderecoSalvar: document.getElementById('input-endereco-salvar'),
    salvarResumoRecipiente: document.getElementById('salvar-resumo-recipiente'),
    salvarResumoQuantidade: document.getElementById('salvar-resumo-quantidade'),
    erroSalvarRegistro: document.getElementById('erro-salvar-registro'),
    dialogEditarRegistro: document.getElementById('dialog-editar-registro'),
    formEditarRegistro: document.getElementById('form-editar-registro'),
    inputRegistroIdEditar: document.getElementById('input-registro-id-editar'),
    inputProdutoIdEditar: document.getElementById('input-produto-id-editar'),
    inputEnderecoEditar: document.getElementById('input-endereco-editar'),
    inputQuantidadeEditar: document.getElementById('input-quantidade-editar'),
    erroEditarRegistro: document.getElementById('erro-editar-registro'),
    dialogDetalhes: document.getElementById('dialog-detalhes'),
    conteudoDetalhes: document.getElementById('conteudo-detalhes'),
    dialogConfirmacao: document.getElementById('dialog-confirmacao'),
    toast: document.getElementById('toast'),
    toastMensagem: document.getElementById('toast-mensagem'),
    toastAcao: document.getElementById('toast-acao'),
    avisoAtualizacao: document.getElementById('aviso-atualizacao'),
    btnAtualizarApp: document.getElementById('btn-atualizar-app')
};

let temporizadorToast;

export function alternarTela(nome) {
    const mostrarConfiguracoes = nome === 'configuracoes';
    elementos.telaCalculadora.classList.toggle('ativa', !mostrarConfiguracoes);
    elementos.telaConfiguracoes.classList.toggle('ativa', mostrarConfiguracoes);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function aplicarTema(tema) {
    const temaAplicado = tema === 'system'
        ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : tema;
    elementos.app.dataset.theme = temaAplicado;
    document.documentElement.dataset.theme = temaAplicado;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
        'content',
        temaAplicado === 'dark' ? '#070b14' : '#12344d'
    );
}

export function renderizarRecipientes(recipientes, selecionadoId, aoSelecionar) {
    elementos.listaRecipientes.replaceChildren();

    recipientes.filter((item) => item.ativo !== false).forEach((recipiente) => {
        const botao = document.createElement('button');
        const cor = document.createElement('span');
        const texto = document.createElement('span');
        const nome = document.createElement('strong');
        const tara = document.createElement('small');
        const check = document.createElement('span');
        const ativo = recipiente.id === selecionadoId;

        botao.type = 'button';
        botao.className = `recipiente-card${ativo ? ' ativo' : ''}`;
        botao.dataset.recipienteId = recipiente.id;
        botao.setAttribute('aria-pressed', String(ativo));
        botao.addEventListener('click', () => aoSelecionar(recipiente.id));

        cor.className = 'recipiente-cor';
        cor.style.setProperty('--cor-recipiente', recipiente.cor);
        nome.textContent = recipiente.nome;
        tara.textContent = `Tara ${formatarPeso(recipiente.taraKg)} kg`;
        texto.append(nome, tara);
        check.className = 'recipiente-check';
        check.textContent = '✓';
        botao.append(cor, texto, check);
        elementos.listaRecipientes.append(botao);
    });
}

export function renderizarSelectRecipientes(recipientes, selecionadoId) {
    elementos.selectRecipientePadrao.replaceChildren();

    recipientes.filter((item) => item.ativo !== false).forEach((recipiente) => {
        const opcao = document.createElement('option');
        opcao.value = recipiente.id;
        opcao.textContent = `${recipiente.nome} (${formatarPeso(recipiente.taraKg)} kg)`;
        opcao.selected = recipiente.id === selecionadoId;
        elementos.selectRecipientePadrao.append(opcao);
    });
}

export function atualizarCalculo(calculo, recipiente, configuracoes) {
    elementos.resultadoRecipiente.textContent = recipiente?.nome ?? 'Sem recipiente';
    limparErrosCampos();

    if (!calculo.sucesso) {
        elementos.resultadoValor.textContent = '0';
        elementos.resultadoMensagem.textContent = calculo.mensagem;
        elementos.painelResultado.classList.toggle(
            'erro',
            calculo.codigoErro !== 'DADOS_INCOMPLETOS'
        );
        elementos.resumoCalculo.classList.add('oculto');
        elementos.btnSalvar.disabled = true;
        elementos.btnCopiar.disabled = true;
        mostrarErroCampo(calculo.campoErro, calculo.mensagem);
        return;
    }

    elementos.painelResultado.classList.remove('erro');
    elementos.resultadoValor.textContent = formatarQuantidade(calculo.resultado);
    elementos.resultadoMensagem.textContent = 'Cálculo concluído. Identifique o produto para salvar.';
    elementos.btnSalvar.disabled = false;
    elementos.btnCopiar.disabled = false;
    elementos.resumoCalculo.classList.remove('oculto');

    elementos.resumoPesoBruto.textContent = `${formatarPeso(calculo.detalhes.pesoBrutoKg)} kg`;
    elementos.resumoTara.textContent = `${formatarPeso(calculo.detalhes.taraKg)} kg`;
    elementos.resumoPesoLiquido.textContent = `${formatarPeso(calculo.detalhes.pesoLiquidoKg)} kg`;
    elementos.resumoGramatura.textContent = `${formatarPeso(calculo.detalhes.gramaturaG)} g`;
    elementos.resumoRegra.textContent = `${formatarPercentual(configuracoes.taxaRendimento)} · ${
        configuracoes.politicaArredondamento === 'truncar'
            ? 'unidades completas'
            : 'arredondamento convencional'
    }`;
}

function mostrarErroCampo(campo, mensagem) {
    const mapa = {
        pesoBruto: [elementos.inputPesoBruto, elementos.erroPesoBruto],
        gramatura: [elementos.inputGramatura, elementos.erroGramatura]
    };
    const alvo = mapa[campo];
    if (!alvo) return;

    const [input, erro] = alvo;
    input.closest('.campo')?.classList.add('invalido');
    input.setAttribute('aria-invalid', 'true');
    erro.textContent = mensagem;
}

export function limparErrosCampos() {
    [
        [elementos.inputPesoBruto, elementos.erroPesoBruto],
        [elementos.inputGramatura, elementos.erroGramatura]
    ].forEach(([input, erro]) => {
        input.closest('.campo')?.classList.remove('invalido');
        input.removeAttribute('aria-invalid');
        erro.textContent = '';
    });
}

function textoOuPadrao(valor, padrao) {
    const texto = String(valor ?? '').trim();
    return texto || padrao;
}

export function renderizarHistorico(historico, acoes) {
    elementos.listaHistorico.replaceChildren();
    elementos.contadorHistorico.textContent = String(historico.length);

    if (!historico.length) {
        const vazio = document.createElement('div');
        vazio.className = 'historico-vazio';
        vazio.textContent = 'Nenhum cálculo salvo.';
        elementos.listaHistorico.append(vazio);
        return;
    }

    historico.forEach((registro) => {
        const item = document.createElement('article');
        const principal = document.createElement('div');
        const identificacao = document.createElement('div');
        const produto = document.createElement('strong');
        const endereco = document.createElement('span');
        const meta = document.createElement('small');
        const entrada = document.createElement('small');
        const resultadoLinha = document.createElement('div');
        const resultado = document.createElement('strong');
        const areaAcoes = document.createElement('div');
        const btnCarregar = document.createElement('button');
        const btnEditar = document.createElement('button');
        const btnDetalhes = document.createElement('button');
        const btnExcluir = document.createElement('button');

        item.className = 'item-historico';
        principal.className = 'item-historico-principal';
        principal.tabIndex = 0;
        principal.setAttribute('role', 'button');
        principal.addEventListener('click', () => acoes.aoDetalhar(registro));
        principal.addEventListener('keydown', (evento) => {
            if (evento.key === 'Enter' || evento.key === ' ') {
                evento.preventDefault();
                acoes.aoDetalhar(registro);
            }
        });

        identificacao.className = 'item-historico-identificacao';
        produto.textContent = textoOuPadrao(registro.identificacao?.produtoId, 'Produto não informado');
        endereco.textContent = textoOuPadrao(registro.identificacao?.endereco, 'Endereço não informado');
        identificacao.append(produto, endereco);
        meta.textContent = `${registro.recipiente.nome} · ${formatarDataHora(registro.criadoEm)}`;
        entrada.textContent = `PB ${formatarPeso(registro.entrada.pesoBrutoKg)} kg · ${formatarPeso(registro.entrada.gramaturaG)} g`;
        resultadoLinha.className = 'item-historico-resultado-linha';
        resultado.className = 'item-historico-resultado';
        resultado.textContent = formatarQuantidade(registro.calculo.quantidadeFinal);
        resultadoLinha.append(resultado);

        if ((registro.auditoria?.revisao ?? 0) > 0) {
            const editado = document.createElement('span');
            editado.className = 'selo-editado';
            editado.textContent = `Editado · rev. ${registro.auditoria.revisao}`;
            resultadoLinha.append(editado);
        }
        principal.append(identificacao, meta, entrada, resultadoLinha);

        areaAcoes.className = 'item-historico-acoes';
        btnCarregar.type = 'button';
        btnCarregar.textContent = 'Usar';
        btnCarregar.addEventListener('click', () => acoes.aoCarregar(registro));
        btnEditar.type = 'button';
        btnEditar.className = 'editar';
        btnEditar.textContent = 'Editar';
        btnEditar.addEventListener('click', () => acoes.aoEditar(registro));
        btnDetalhes.type = 'button';
        btnDetalhes.textContent = 'Detalhes';
        btnDetalhes.addEventListener('click', () => acoes.aoDetalhar(registro));
        btnExcluir.type = 'button';
        btnExcluir.className = 'excluir';
        btnExcluir.textContent = 'Excluir';
        btnExcluir.addEventListener('click', () => acoes.aoExcluir(registro));
        areaAcoes.append(btnCarregar, btnEditar, btnDetalhes, btnExcluir);
        item.append(principal, areaAcoes);
        elementos.listaHistorico.append(item);
    });
}

export function abrirDialogSalvar(calculo, recipiente) {
    elementos.formSalvarRegistro.reset();
    elementos.erroSalvarRegistro.textContent = '';
    elementos.salvarResumoRecipiente.textContent = recipiente?.nome ?? '—';
    elementos.salvarResumoQuantidade.textContent = formatarQuantidade(calculo?.resultado ?? 0);
    elementos.dialogSalvarRegistro.showModal();
    setTimeout(() => elementos.inputProdutoIdSalvar.focus(), 0);
}

export function lerDadosSalvar() {
    return {
        produtoId: elementos.inputProdutoIdSalvar.value.trim().toLocaleUpperCase('pt-BR'),
        endereco: elementos.inputEnderecoSalvar.value.trim().toLocaleUpperCase('pt-BR')
    };
}

export function mostrarErroSalvar(mensagem) { elementos.erroSalvarRegistro.textContent = mensagem; }
export function fecharDialogSalvar() { elementos.dialogSalvarRegistro.close(); }

export function abrirDialogEdicao(registro) {
    elementos.erroEditarRegistro.textContent = '';
    elementos.inputRegistroIdEditar.value = registro.id;
    elementos.inputProdutoIdEditar.value = registro.identificacao?.produtoId ?? '';
    elementos.inputEnderecoEditar.value = registro.identificacao?.endereco ?? '';
    elementos.inputQuantidadeEditar.value = String(registro.calculo.quantidadeFinal).replace('.', ',');
    elementos.dialogEditarRegistro.showModal();
    setTimeout(() => elementos.inputProdutoIdEditar.focus(), 0);
}

export function lerDadosEdicao() {
    return {
        registroId: elementos.inputRegistroIdEditar.value,
        produtoId: elementos.inputProdutoIdEditar.value.trim().toLocaleUpperCase('pt-BR'),
        endereco: elementos.inputEnderecoEditar.value.trim().toLocaleUpperCase('pt-BR'),
        quantidadeTexto: elementos.inputQuantidadeEditar.value.trim()
    };
}

export function mostrarErroEdicao(mensagem) { elementos.erroEditarRegistro.textContent = mensagem; }
export function fecharDialogEdicao() { elementos.dialogEditarRegistro.close(); }

export function atualizarEstadoAdmin(desbloqueado) {
    elementos.adminBloqueado.classList.toggle('oculto', desbloqueado);
    elementos.adminConteudo.classList.toggle('oculto', !desbloqueado);
    elementos.statusAdmin.textContent = desbloqueado ? 'Liberado' : 'Bloqueado';
    elementos.statusAdmin.className = desbloqueado ? 'status-liberado' : 'status-bloqueado';
}

export function preencherEditorAdmin(estado, aoRemover) {
    elementos.inputRendimento.value = String(estado.configuracoes.taxaRendimento * 100);
    elementos.selectArredondamento.value = estado.configuracoes.politicaArredondamento;
    elementos.editorRecipientes.replaceChildren();

    estado.recipientes.forEach((recipiente) => {
        elementos.editorRecipientes.append(
            criarLinhaEditorRecipiente(recipiente, aoRemover)
        );
    });
}

function criarLinhaEditorRecipiente(recipiente, aoRemover) {
    const linha = document.createElement('div');
    const campoCor = document.createElement('div');
    const inputCor = document.createElement('input');
    const campoNome = criarCampoEditor('Nome', 'text', recipiente.nome);
    const campoTara = criarCampoEditor('Tara (kg)', 'number', recipiente.taraKg);
    const alternador = document.createElement('label');
    const inputAtivo = document.createElement('input');
    const btnRemover = document.createElement('button');

    linha.className = 'linha-recipiente-admin';
    linha.dataset.recipienteId = recipiente.id;
    campoCor.className = 'campo';
    inputCor.type = 'color';
    inputCor.value = recipiente.cor;
    inputCor.className = 'admin-cor';
    inputCor.setAttribute('aria-label', `Cor de ${recipiente.nome}`);
    campoCor.append(inputCor);

    campoNome.input.className = 'admin-nome';
    campoTara.input.className = 'admin-tara';
    campoTara.input.min = '0';
    campoTara.input.step = '0.001';

    alternador.className = 'alternador-ativo';
    inputAtivo.type = 'checkbox';
    inputAtivo.checked = recipiente.ativo !== false;
    inputAtivo.className = 'admin-ativo';
    alternador.append(inputAtivo, document.createTextNode('Ativo'));

    btnRemover.type = 'button';
    btnRemover.className = 'botao-remover-recipiente';
    btnRemover.textContent = 'Remover';
    btnRemover.addEventListener('click', () => aoRemover(recipiente.id));

    linha.append(campoCor, campoNome.raiz, campoTara.raiz, alternador, btnRemover);
    return linha;
}

function criarCampoEditor(rotulo, tipo, valor) {
    const raiz = document.createElement('div');
    const label = document.createElement('label');
    const input = document.createElement('input');
    raiz.className = 'campo';
    label.textContent = rotulo;
    input.type = tipo;
    input.value = String(valor);
    raiz.append(label, input);
    return { raiz, input };
}

export function lerEditorRecipientes() {
    return [...elementos.editorRecipientes.querySelectorAll('.linha-recipiente-admin')].map((linha) => ({
        id: linha.dataset.recipienteId,
        nome: linha.querySelector('.admin-nome').value.trim(),
        taraKg: Number(linha.querySelector('.admin-tara').value),
        cor: linha.querySelector('.admin-cor').value,
        ativo: linha.querySelector('.admin-ativo').checked
    }));
}

function criarItemDetalhe(titulo, valor) {
    const grupo = document.createElement('div');
    const termo = document.createElement('dt');
    const descricao = document.createElement('dd');
    termo.textContent = titulo;
    descricao.textContent = valor;
    grupo.append(termo, descricao);
    return grupo;
}

export function mostrarDetalhes(registro) {
    elementos.conteudoDetalhes.replaceChildren();
    const lista = document.createElement('dl');
    lista.className = 'detalhes-grid';
    const itens = [
        ['ID do produto', textoOuPadrao(registro.identificacao?.produtoId, 'Não informado')],
        ['Endereço', textoOuPadrao(registro.identificacao?.endereco, 'Não informado')],
        ['Salvo em', formatarDataHora(registro.criadoEm)],
        ['Recipiente', registro.recipiente.nome],
        ['Peso bruto', `${formatarPeso(registro.entrada.pesoBrutoKg)} kg`],
        ['Tara usada', `${formatarPeso(registro.recipiente.taraKg)} kg`],
        ['Peso líquido', `${formatarPeso(registro.calculo.pesoLiquidoKg)} kg`],
        ['Gramatura', `${formatarPeso(registro.entrada.gramaturaG)} g`],
        ['Rendimento', formatarPercentual(registro.calculo.taxaRendimento)],
        ['Arredondamento', registro.calculo.politicaArredondamento === 'truncar' ? 'Unidades completas' : 'Convencional'],
        ['Quantidade atual', formatarQuantidade(registro.calculo.quantidadeFinal)],
        ['Quantidade calculada', formatarQuantidade(registro.calculo.quantidadeCalculadaOriginal)],
        ['Fórmula', `v${registro.calculo.versaoFormula}`],
        ['Aplicativo', registro.versaoAplicativo]
    ];
    if (registro.auditoria?.atualizadoEm) {
        itens.push(['Última edição', formatarDataHora(registro.auditoria.atualizadoEm)], ['Revisão', String(registro.auditoria.revisao)]);
    }
    itens.forEach(([titulo, valor]) => lista.append(criarItemDetalhe(titulo, valor)));
    elementos.conteudoDetalhes.append(lista);

    const alteracoes = registro.auditoria?.alteracoes ?? [];
    if (alteracoes.length) {
        const secao = document.createElement('section');
        const titulo = document.createElement('h3');
        const listaAlteracoes = document.createElement('ol');
        secao.className = 'historico-revisoes';
        titulo.textContent = 'Histórico de alterações';
        listaAlteracoes.className = 'lista-revisoes';
        [...alteracoes].reverse().forEach((alteracao) => {
            const item = document.createElement('li');
            const data = document.createElement('strong');
            const descricao = document.createElement('span');
            data.textContent = formatarDataHora(alteracao.em);
            descricao.textContent = `ID ${textoOuPadrao(alteracao.anterior?.produtoId, 'não informado')} → ${textoOuPadrao(alteracao.atual?.produtoId, 'não informado')} · Endereço ${textoOuPadrao(alteracao.anterior?.endereco, 'não informado')} → ${textoOuPadrao(alteracao.atual?.endereco, 'não informado')} · Quantidade ${formatarQuantidade(alteracao.anterior?.quantidadeFinal ?? 0)} → ${formatarQuantidade(alteracao.atual?.quantidadeFinal ?? 0)}`;
            item.append(data, descricao);
            listaAlteracoes.append(item);
        });
        secao.append(titulo, listaAlteracoes);
        elementos.conteudoDetalhes.append(secao);
    }
    elementos.dialogDetalhes.showModal();
}

export function mostrarToast(mensagem, acao = null) {
    clearTimeout(temporizadorToast);
    elementos.toastMensagem.textContent = mensagem;
    elementos.toastAcao.classList.toggle('oculto', !acao);
    elementos.toastAcao.onclick = null;

    if (acao) {
        elementos.toastAcao.textContent = acao.rotulo;
        elementos.toastAcao.onclick = () => {
            acao.executar();
            esconderToast();
        };
    }

    elementos.toast.classList.add('visivel');
    temporizadorToast = setTimeout(esconderToast, acao ? 6000 : 3200);
}

export function esconderToast() {
    elementos.toast.classList.remove('visivel');
}

export function configurarFechamentoDialogos() {
    document.querySelectorAll('[data-fechar-dialogo]').forEach((botao) => {
        botao.addEventListener('click', () => {
            document.getElementById(botao.dataset.fecharDialogo)?.close();
        });
    });
}
