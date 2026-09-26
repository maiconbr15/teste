const produtos = {
    'burger-simples': { nome: 'Burger Simples', preco: 15.00 },
    'burger-duplo': { nome: 'Burger Duplo', preco: 22.00 },
    'burger-triplo': { nome: 'Burger Triplo', preco: 29.00 },
    'combo': { nome: 'Combo', preco: 35.00 },
    'fritas': { nome: 'Fritas', preco: 8.00 },
    'bebida': { nome: 'Bebida', preco: 5.00 },
    'milkshake': { nome: 'Milkshake', preco: 12.00 },
    'sobremesa': { nome: 'Sobremesa', preco: 10.00 }
};

const estado = {
    pedidos: [
        {
            id: 1001,
            cliente: 'Cliente Teste',
            data: '2026-09-26',
            status: 'pendente',
            itens: [
                { produto: 'Burger Duplo', quantidade: 2, valor: 44.00 },
                { produto: 'Bebida', quantidade: 2, valor: 10.00 }
            ],
            total: 54.00,
            observacao: 'Sem cebola'
        },
        {
            id: 1002,
            cliente: 'João',
            data: '2026-09-26',
            status: 'pronto',
            itens: [
                { produto: 'Combo', quantidade: 1, valor: 35.00 },
                { produto: 'Milkshake', quantidade: 1, valor: 12.00 }
            ],
            total: 47.00,
            observacao: 'Sem molho'
        }
    ],
    caixaAberto: false,
    aberturaCaixa: null,
    valorEmDinheiro: 0,
    vendasDia: 0,
    totalPedidosDia: 0
};

const pageTitle = document.getElementById('page-title');
const pageLinks = document.querySelectorAll('.menu-item');
const pages = document.querySelectorAll('.page');
const listaPedidos = document.getElementById('lista-pedidos');
const filterData = document.getElementById('filter-data');
const filterStatus = document.getElementById('filter-status');
const subtotalEl = document.getElementById('subtotal');
const totalEl = document.getElementById('total');
const taxaEl = document.getElementById('taxa');
const btnAddItem = document.getElementById('btn-add-item');
const itensContainer = document.getElementById('itens-container');
const formPedido = document.getElementById('form-pedido');
const btnFinalizar = document.getElementById('btn-finalizar');
const btnLimpar = document.getElementById('btn-limpar');

function atualizarNavegacao() {
    pageLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const pageId = link.dataset.page;
            pageTitle.textContent = link.textContent.trim();

            pages.forEach(page => {
                page.classList.toggle('active', page.id === pageId);
            });

            pageLinks.forEach(item => item.classList.toggle('active', item === link));
        });
    });
}

function atualizarResumoDashboard() {
    const totalPedidos = estado.pedidos.length;
    const faturamento = estado.pedidos.reduce((soma, pedido) => soma + Number(pedido.total || 0), 0);
    const ticketMedio = totalPedidos ? faturamento / totalPedidos : 0;

    document.getElementById('stat-pedidos').textContent = totalPedidos;
    document.getElementById('stat-faturamento').textContent = formatarMoeda(faturamento);
    document.getElementById('stat-ticket').textContent = formatarMoeda(ticketMedio);
    document.getElementById('stat-caixa').textContent = estado.caixaAberto ? '✅ Aberto' : '❌ Fechado';
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(Number(valor || 0));
}

function criarItemPedido() {
    const wrapper = document.createElement('div');
    wrapper.className = 'item-form';

    wrapper.innerHTML = `
        <select class="produto-select">
            <option value="">Selecione um produto</option>
            <option value="burger-simples" data-preco="15.00">Burger Simples - R$ 15,00</option>
            <option value="burger-duplo" data-preco="22.00">Burger Duplo - R$ 22,00</option>
            <option value="burger-triplo" data-preco="29.00">Burger Triplo - R$ 29,00</option>
            <option value="combo" data-preco="35.00">Combo (Burger + Bebida + Fritas) - R$ 35,00</option>
            <option value="fritas" data-preco="8.00">Fritas - R$ 8,00</option>
            <option value="bebida" data-preco="5.00">Bebida - R$ 5,00</option>
            <option value="milkshake" data-preco="12.00">Milkshake - R$ 12,00</option>
            <option value="sobremesa" data-preco="10.00">Sobremesa - R$ 10,00</option>
        </select>
        <input type="number" class="qtd-input" value="1" min="1">
        <input type="text" class="preco-input" readonly>
        <button type="button" class="btn-remover-item">❌</button>
    `;

    const remover = wrapper.querySelector('.btn-remover-item');
    remover.addEventListener('click', () => {
        wrapper.remove();
        atualizarTotais();
    });

    wrapper.querySelector('.produto-select').addEventListener('change', atualizarTotais);
    wrapper.querySelector('.qtd-input').addEventListener('input', atualizarTotais);

    return wrapper;
}

function atualizarTotais() {
    const itens = document.querySelectorAll('#itens-container .item-form');
    let subtotal = 0;

    itens.forEach(item => {
        const select = item.querySelector('.produto-select');
        const qtdInput = item.querySelector('.qtd-input');
        const precoInput = item.querySelector('.preco-input');

        const produto = select.value;
        const qtd = Number(qtdInput.value || 0);
        const valor = Number(select.options[select.selectedIndex]?.dataset.preco || 0);

        const totalItem = valor * qtd;
        precoInput.value = formatarMoeda(totalItem);
        subtotal += totalItem;
    });

    const taxa = Number(taxaEl.value || 0);
    const total = subtotal + taxa;

    subtotalEl.textContent = formatarMoeda(subtotal);
    totalEl.textContent = formatarMoeda(total);
}

function adicionarItem() {
    itensContainer.appendChild(criarItemPedido());
    atualizarTotais();
}

function limparPedido() {
    itensContainer.innerHTML = '';
    itensContainer.appendChild(criarItemPedido());
    document.getElementById('cliente').value = '';
    document.getElementById('observacoes').value = '';
    taxaEl.value = 0;
    atualizarTotais();
}

function registrarPedido() {
    const cliente = document.getElementById('cliente').value.trim() || 'Cliente Geral';
    const observacao = document.getElementById('observacoes').value.trim();
    const itens = Array.from(document.querySelectorAll('#itens-container .item-form'))
        .map(item => {
            const select = item.querySelector('.produto-select');
            const qtd = Number(item.querySelector('.qtd-input').value || 0);
            const produtoKey = select.value;
            const nomeProduto = produtos[produtoKey]?.nome;
            const valorUnit = Number(select.options[select.selectedIndex]?.dataset.preco || 0);

            if (!produtoKey || !nomeProduto || qtd <= 0) return null;

            return {
                produto: nomeProduto,
                quantidade: qtd,
                valor: valorUnit * qtd
            };
        })
        .filter(Boolean);

    if (!itens.length) {
        alert('Adicione pelo menos um produto ao pedido.');
        return;
    }

    const total = Number(document.getElementById('total').textContent.replace(/[R$.,\s]/g, '').replace(',', '.')) || 0;
    const pedido = {
        id: Date.now(),
        cliente,
        data: new Date().toISOString().slice(0, 10),
        status: 'pendente',
        itens,
        total,
        observacao
    };

    estado.pedidos.unshift(pedido);
    atualizarResumoDashboard();
    renderizarPedidos();
    limparPedido();
    alert('Pedido registrado com sucesso!');
}

function renderizarPedidos() {
    const dataFiltro = filterData.value;
    const statusFiltro = filterStatus.value;

    const pedidosFiltrados = estado.pedidos.filter(pedido => {
        const matchData = !dataFiltro || pedido.data === dataFiltro;
        const matchStatus = !statusFiltro || pedido.status === statusFiltro;
        return matchData && matchStatus;
    });

    if (!pedidosFiltrados.length) {
        listaPedidos.innerHTML = '<p>Nenhum pedido encontrado.</p>';
        return;
    }

    listaPedidos.innerHTML = pedidosFiltrados.map(pedido => `
        <div class="pedido-item">
            <div class="pedido-header">
                <h3>Pedido #${pedido.id}</h3>
                <span class="status-badge status-${pedido.status}">${pedido.status}</span>
            </div>
            <p><strong>Cliente:</strong> ${pedido.cliente}</p>
            <p><strong>Data:</strong> ${pedido.data}</p>
            <p><strong>Itens:</strong> ${pedido.itens.map(item => `${item.quantidade}x ${item.produto}`).join(', ')}</p>
            <p><strong>Observação:</strong> ${pedido.observacao || 'Nenhuma'}</p>
            <p><strong>Total:</strong> ${formatarMoeda(pedido.total)}</p>
            <div class="button-group">
                <button class="btn-secondary btn-status" data-id="${pedido.id}" data-status="preparando">Preparando</button>
                <button class="btn-secondary btn-status" data-id="${pedido.id}" data-status="pronto">Pronto</button>
                <button class="btn-secondary btn-status" data-id="${pedido.id}" data-status="entregue">Entregue</button>
                <button class="btn-primary btn-imprimir-pedido" data-id="${pedido.id}">Imprimir</button>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.btn-status').forEach(botao => {
        botao.addEventListener('click', () => {
            const id = Number(botao.dataset.id);
            const status = botao.dataset.status;
            const pedido = estado.pedidos.find(item => item.id === id);
            if (pedido) pedido.status = status;
            renderizarPedidos();
            atualizarResumoDashboard();
        });
    });

    document.querySelectorAll('.btn-imprimir-pedido').forEach(botao => {
        botao.addEventListener('click', () => {
            const id = Number(botao.dataset.id);
            const pedido = estado.pedidos.find(item => item.id === id);
            if (pedido) imprimirPedido(pedido);
        });
    });
}

function imprimirPedido(pedido) {
    const modal = document.getElementById('modal-imprimir');
    const conteudo = document.getElementById('conteudo-impressao');

    conteudo.innerHTML = `
        <h3>Noah Burger</h3>
        <p><strong>Pedido:</strong> #${pedido.id}</p>
        <p><strong>Cliente:</strong> ${pedido.cliente}</p>
        <p><strong>Data:</strong> ${pedido.data}</p>
        <p><strong>Status:</strong> ${pedido.status}</p>
        <hr>
        ${pedido.itens.map(item => `
            <p>${item.quantidade}x ${item.produto} - ${formatarMoeda(item.valor)}</p>
        `).join('')}
        <hr>
        <p><strong>Observação:</strong> ${pedido.observacao || 'Nenhuma'}</p>
        <p><strong>Total:</strong> ${formatarMoeda(pedido.total)}</p>
    `;

    modal.classList.add('active');
}

function setupModal() {
    const modal = document.getElementById('modal-imprimir');
    const close = document.querySelector('.close');
    const imprimirBtn = document.getElementById('btn-imprimir');

    close.addEventListener('click', () => modal.classList.remove('active'));
    imprimirBtn.addEventListener('click', () => window.print());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });
}

function setupCaixa() {
    const btnAbrirCaixa = document.getElementById('btn-abrir-caixa');
    const btnCalcularCaixa = document.getElementById('btn-calcular-caixa');
    const btnFinalizarCaixa = document.getElementById('btn-finalizar-caixa');
    const btnCancelarCaixa = document.getElementById('btn-cancelar-caixa');
    const caixaAberto = document.getElementById('caixa-aberto');
    const statusText = document.getElementById('status-text');
    const horaAbertura = document.getElementById('hora-abertura');
    const valorDinheiro = document.getElementById('valor-dinheiro');
    const valorDebito = document.getElementById('valor-debito');
    const valorCredito = document.getElementById('valor-credito');
    const valorPix = document.getElementById('valor-pix');
    const resultadoFechamento = document.getElementById('resultado-fechamento');
    const diferenca = document.getElementById('diferenca');
    const msgDiferenca = document.getElementById('msg-diferenca');

    function atualizarEstadoCaixa() {
        const totalHoje = estado.pedidos.filter(p => p.data === new Date().toISOString().slice(0, 10)).reduce((s, p) => s + Number(p.total || 0), 0);
        document.getElementById('vendas-dia').textContent = formatarMoeda(totalHoje);
        document.getElementById('total-pedidos').textContent = estado.pedidos.filter(p => p.data === new Date().toISOString().slice(0, 10)).length;

        if (estado.caixaAberto) {
            caixaAberto.style.display = 'block';
            statusText.textContent = 'Caixa Aberto';
            btnAbrirCaixa.style.display = 'none';
            horaAbertura.textContent = estado.aberturaCaixa || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } else {
            caixaAberto.style.display = 'none';
            statusText.textContent = 'Caixa Fechado';
            btnAbrirCaixa.style.display = 'inline-block';
            resultadoFechamento.style.display = 'none';
        }
    }

    btnAbrirCaixa.addEventListener('click', () => {
        estado.caixaAberto = true;
        estado.aberturaCaixa = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        atualizarResumoDashboard();
        atualizarEstadoCaixa();
    });

    btnCalcularCaixa.addEventListener('click', () => {
        const totalHoje = estado.pedidos.filter(p => p.data === new Date().toISOString().slice(0, 10)).reduce((s, p) => s + Number(p.total || 0), 0);
        const dinheiro = Number(valorDinheiro.value || 0);
        const debito = Number(valorDebito.value || 0);
        const credito = Number(valorCredito.value || 0);
        const pix = Number(valorPix.value || 0);

        const fechamento = dinheiro + debito + credito + pix;
        const diferencaValor = fechamento - totalHoje;

        diferenca.textContent = formatarMoeda(diferencaValor);
        resultadoFechamento.style.display = 'block';

        if (diferencaValor === 0) {
            msgDiferenca.textContent = 'Fechamento perfeito, sem diferença.';
            btnFinalizarCaixa.style.display = 'inline-block';
        } else if (diferencaValor > 0) {
            msgDiferenca.textContent = 'Há um valor acima do esperado. Revise a contagem.';
            btnFinalizarCaixa.style.display = 'inline-block';
        } else {
            msgDiferenca.textContent = 'Há um valor abaixo do esperado. Revise a contagem.';
            btnFinalizarCaixa.style.display = 'inline-block';
        }
    });

    btnFinalizarCaixa.addEventListener('click', () => {
        estado.caixaAberto = false;
        estado.aberturaCaixa = null;
        btnFinalizarCaixa.style.display = 'none';
        resultadoFechamento.style.display = 'none';
        atualizarResumoDashboard();
        atualizarEstadoCaixa();
        alert('Caixa finalizado com sucesso!');
    });

    btnCancelarCaixa.addEventListener('click', () => {
        estado.caixaAberto = false;
        estado.aberturaCaixa = null;
        btnFinalizarCaixa.style.display = 'none';
        resultadoFechamento.style.display = 'none';
        atualizarResumoDashboard();
        atualizarEstadoCaixa();
    });

    atualizarEstadoCaixa();
}

function setupGraficos() {
    const categoriaCtx = document.getElementById('chartCategoria');
    const horaCtx = document.getElementById('chartHora');

    new Chart(categoriaCtx, {
        type: 'doughnut',
        data: {
            labels: ['Burger', 'Combo', 'Fritas', 'Bebidas'],
            datasets: [{
                data: [40, 25, 20, 15],
                backgroundColor: ['#f59e0b', '#ef4444', '#3b82f6', '#10b981']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    new Chart(horaCtx, {
        type: 'line',
        data: {
            labels: ['12h', '14h', '16h', '18h', '20h', '22h'],
            datasets: [{
                label: 'Vendas',
                data: [12, 18, 24, 32, 27, 40],
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function setupRelatorio() {
    const periodo = document.getElementById('filtro-periodo');
    const relatorio = document.getElementById('relatorio-content');

    function renderRelatorio() {
        const total = estado.pedidos.reduce((s, p) => s + Number(p.total || 0), 0);
        const pedidosHoje = estado.pedidos.filter(p => p.data === new Date().toISOString().slice(0, 10)).length;
        relatorio.innerHTML = `
            <div class="stats-container">
                <div class="stat-card">
                    <h3>Vendas total</h3>
                    <p class="stat-number">${formatarMoeda(total)}</p>
                </div>
                <div class="stat-card">
                    <h3>Pedidos</h3>
                    <p class="stat-number">${pedidosHoje}</p>
                </div>
                <div class="stat-card">
                    <h3>Faturamento Médio</h3>
                    <p class="stat-number">${formatarMoeda(pedidosHoje ? total / pedidosHoje : 0)}</p>
                </div>
                <div class="stat-card">
                    <h3>Mix de Vendas</h3>
                    <p class="stat-number">75%</p>
                </div>
            </div>
        `;
    }

    periodo.addEventListener('change', renderRelatorio);
    renderRelatorio();
}

function init() {
    atualizarNavegacao();
    setupModal();
    setupCaixa();
    setupGraficos();
    setupRelatorio();
    btnAddItem.addEventListener('click', adicionarItem);
    btnFinalizar.addEventListener('click', registrarPedido);
    btnLimpar.addEventListener('click', limparPedido);
    taxaEl.addEventListener('input', atualizarTotais);
    filterData.addEventListener('input', renderizarPedidos);
    filterStatus.addEventListener('change', renderizarPedidos);

    document.querySelectorAll('.menu-item')[0].click();
    limparPedido();
    atualizarResumoDashboard();
    renderizarPedidos();
}

init();
