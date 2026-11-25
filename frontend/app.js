const API_BASE = "http://localhost:5000/api";

let cacheFabricantes = [];
let cacheCategorias = [];
let cacheClientes = [];
let cacheVeiculos = [];
let cacheAlugueis = [];
let cacheProdutos = [];

// ============================================================================
// UTILITÁRIOS GERAIS
// ============================================================================

function formatarMoeda(valor) {
    if (valor === null || valor === undefined || valor === "") return "—";
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(isoString) {
    if (!isoString) return "—";
    const parteData = String(isoString).split("T")[0];
    const [ano, mes, dia] = parteData.split("-");
    return dia && mes && ano ? `${dia}/${mes}/${ano}` : isoString;
}

function formatarCpf(cpf) {
    const d = String(cpf || "").replace(/\D/g, "");
    if (d.length !== 11) return cpf;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function mostrarAlerta(mensagem, tipo = "success") {
    const el = document.getElementById("alertaGlobal");
    if (!el) return;
    el.className = `alert alert-${tipo} alert-dismissible fade show`;
    el.innerHTML = `
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function alternarAba(tabId) {
    document.querySelectorAll(".tab-section").forEach((sec) => sec.classList.add("d-none"));
    const alvo = document.getElementById(tabId);
    if (alvo) alvo.classList.remove("d-none");

    document.querySelectorAll("#menuNavegacao .nav-link").forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
    });
}

function montarQueryString(paramsObj) {
    const params = new URLSearchParams();
    Object.entries(paramsObj).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v).trim() !== "") {
            params.append(k, String(v).trim());
        }
    });
    const qs = params.toString();
    return qs ? `?${qs}` : "";
}

async function requisitarApi(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        ...options
    });

    if (response.status === 204) return null;

    const texto = await response.text();
    let dados = null;
    try {
        dados = texto ? JSON.parse(texto) : null;
    } catch {
        dados = texto;
    }

    if (!response.ok) {
        const msg = (dados && (dados.mensagem || dados.message || dados.detail)) || (typeof dados === "string" ? dados : `Erro HTTP ${response.status}`);
        throw new Error(msg);
    }

    return dados;
}

// ============================================================================
// 1. DASHBOARD & CONSULTAS ETAPA 3 (FiltrosController)
// ============================================================================

async function atualizarDashboard() {
    try {
        const [disponiveis, fabGroup, cliGroup] = await Promise.all([
            requisitarApi("/filtros/veiculos-disponiveis"),
            requisitarApi("/filtros/fabricantes-com-veiculos"),
            requisitarApi("/filtros/clientes-com-alugueis-ativos")
        ]);

        document.getElementById("kpiClientes").textContent = cacheClientes.length;
        document.getElementById("kpiVeiculos").textContent = cacheVeiculos.length;
        document.getElementById("kpiDisponiveis").textContent = disponiveis.length;

        const ativos = cacheAlugueis.filter((a) => !a.dataDevolucao).length;
        document.getElementById("kpiAlugueisAtivos").textContent = ativos;
        document.getElementById("kpiFabCat").textContent = `${cacheFabricantes.length} / ${cacheCategorias.length}`;

        const receita = cacheAlugueis.reduce((acc, a) => acc + (Number(a.valorTotalLocacao) || 0), 0);
        document.getElementById("kpiReceita").textContent = formatarMoeda(receita);

        renderizarBarrasFabricantes("dashGraficoFabricantes", fabGroup);
        renderizarBarrasFabricantes("visualizacaoFabricantesGroup", fabGroup);
        renderizarBarrasClientesAtivos("visualizacaoClientesAtivosGroup", cliGroup);
    } catch (erro) {
        mostrarAlerta(`Erro ao atualizar indicadores: ${erro.message}`, "danger");
    }
}

function renderizarBarrasFabricantes(containerId, lista) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const max = Math.max(1, ...lista.map((i) => i.quantidadeVeiculos));

    el.innerHTML = lista.map((item) => {
        const pct = Math.round((item.quantidadeVeiculos / max) * 100);
        return `
            <div class="mb-2">
                <div class="d-flex justify-content-between small mb-1">
                    <span class="fw-semibold">${item.fabricanteNome}</span>
                    <span class="badge bg-primary">${item.quantidadeVeiculos} veículo(s)</span>
                </div>
                <div class="bar-track">
                    <div class="bar-fill" style="width: ${pct}%"></div>
                </div>
            </div>
        `;
    }).join("");
}

function renderizarBarrasClientesAtivos(containerId, lista) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const max = Math.max(1, ...lista.map((i) => i.quantidadeAlugueisAtivos));

    el.innerHTML = lista.map((item) => {
        const pct = Math.round((item.quantidadeAlugueisAtivos / max) * 100);
        return `
            <div class="mb-2">
                <div class="d-flex justify-content-between small mb-1">
                    <span class="fw-semibold">${item.clienteNome} <small class="text-muted">(${formatarCpf(item.clienteCpf)})</small></span>
                    <span class="badge ${item.quantidadeAlugueisAtivos > 0 ? "bg-warning text-dark" : "bg-light text-secondary border"}">
                        ${item.quantidadeAlugueisAtivos} ativo(s)
                    </span>
                </div>
                <div class="bar-track">
                    <div class="bar-fill" style="width: ${pct}%"></div>
                </div>
            </div>
        `;
    }).join("");
}

async function executarConsultaDisponiveis() {
    try {
        const categoriaId = document.getElementById("filtroDispCategoria").value;
        const anoMinimo = document.getElementById("filtroDispAno").value;
        const qs = montarQueryString({ categoriaId, anoMinimo });
        const dados = await requisitarApi(`/filtros/veiculos-disponiveis${qs}`);

        const tbody = document.getElementById("tabelaConsultaDisponiveis");
        if (dados.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">Nenhum veículo disponível para os filtros informados.</td></tr>`;
            return;
        }

        tbody.innerHTML = dados.map((v) => `
            <tr>
                <td>#${v.veiculoId}</td>
                <td class="fw-semibold">${v.modelo}</td>
                <td>${v.fabricanteNome}</td>
                <td><span class="badge bg-light text-dark border">${v.categoriaNome}</span></td>
                <td>${v.anoFabricacao}</td>
                <td>${Number(v.quilometragemAtual).toLocaleString("pt-BR")} km</td>
            </tr>
        `).join("");
    } catch (erro) {
        mostrarAlerta(`Erro na consulta de veículos disponíveis: ${erro.message}`, "danger");
    }
}

async function executarConsultaAlugueisPorCliente() {
    try {
        const clienteNome = document.getElementById("filtroJoinClienteNome").value;
        const qs = montarQueryString({ clienteNome });
        const dados = await requisitarApi(`/filtros/alugueis-por-cliente${qs}`);

        const tbody = document.getElementById("tabelaConsultaAlugueisCliente");
        if (dados.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">Nenhum aluguel encontrado para este filtro.</td></tr>`;
            return;
        }

        tbody.innerHTML = dados.map((a) => `
            <tr>
                <td>#${a.aluguelId}</td>
                <td class="fw-semibold">${a.clienteNome}</td>
                <td>${a.veiculoModelo}</td>
                <td>${formatarData(a.dataInicio)}</td>
                <td>
                    ${a.dataDevolucao
                        ? `<span class="badge bg-success">Devolvido (${formatarData(a.dataDevolucao)})</span>`
                        : `<span class="badge bg-warning text-dark">Ativo</span>`}
                </td>
                <td>${formatarMoeda(a.valorDiaria)}</td>
            </tr>
        `).join("");
    } catch (erro) {
        mostrarAlerta(`Erro na consulta de aluguéis por cliente: ${erro.message}`, "danger");
    }
}

async function executarConsultaVeiculosPorFabricante() {
    try {
        const fabricanteNome = document.getElementById("filtroJoinFabricanteNome").value;
        const qs = montarQueryString({ fabricanteNome });
        const dados = await requisitarApi(`/filtros/veiculos-por-fabricante${qs}`);

        const tbody = document.getElementById("tabelaConsultaVeiculosFabricante");
        if (dados.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">Nenhum veículo encontrado.</td></tr>`;
            return;
        }

        tbody.innerHTML = dados.map((v) => `
            <tr>
                <td class="fw-semibold">${v.modelo}</td>
                <td>${v.fabricanteNome}</td>
                <td>${v.categoriaNome}</td>
                <td>${v.anoFabricacao}</td>
            </tr>
        `).join("");
    } catch (erro) {
        mostrarAlerta(`Erro na consulta por fabricante: ${erro.message}`, "danger");
    }
}

// ============================================================================
// 2. CRUD E FILTROS DE CLIENTES (/api/clientes)
// ============================================================================

async function carregarClientes() {
    try {
        const qs = montarQueryString({
            nome: document.getElementById("filtroClienteNome")?.value,
            cpf: document.getElementById("filtroClienteCpf")?.value,
            email: document.getElementById("filtroClienteEmail")?.value
        });
        const lista = await requisitarApi(`/clientes${qs}`);
        if (!qs) cacheClientes = lista;

        const tbody = document.getElementById("tabelaClientes");
        if (lista.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Nenhum cliente encontrado.</td></tr>`;
            return;
        }

        tbody.innerHTML = lista.map((c) => `
            <tr>
                <td>#${c.id}</td>
                <td class="fw-semibold">${c.nome}</td>
                <td><code>${formatarCpf(c.cpf)}</code></td>
                <td>${c.email}</td>
                <td class="text-end">
                    <button class="btn btn-outline-primary btn-sm me-1" onclick="editarCliente(${c.id})">Editar</button>
                    <button class="btn btn-outline-danger btn-sm" onclick="excluirCliente(${c.id}, '${c.nome.replace(/'/g, "\\'")}')">Excluir</button>
                </td>
            </tr>
        `).join("");
    } catch (erro) {
        mostrarAlerta(`Erro ao carregar clientes: ${erro.message}`, "danger");
    }
}

function limparFiltrosClientes() {
    document.getElementById("filtroClienteNome").value = "";
    document.getElementById("filtroClienteCpf").value = "";
    document.getElementById("filtroClienteEmail").value = "";
    carregarClientes();
}

function abrirModalCliente() {
    document.getElementById("formCliente").reset();
    document.getElementById("clienteId").value = "";
    document.getElementById("tituloModalCliente").textContent = "Cadastrar Novo Cliente";
    new bootstrap.Modal(document.getElementById("modalCliente")).show();
}

async function editarCliente(id) {
    try {
        const c = await requisitarApi(`/clientes/${id}`);
        document.getElementById("clienteId").value = c.id;
        document.getElementById("clienteNome").value = c.nome;
        document.getElementById("clienteCpf").value = c.cpf;
        document.getElementById("clienteEmail").value = c.email;
        document.getElementById("tituloModalCliente").textContent = `Editar Cliente #${c.id}`;
        new bootstrap.Modal(document.getElementById("modalCliente")).show();
    } catch (erro) {
        mostrarAlerta(erro.message, "danger");
    }
}

async function salvarCliente(event) {
    event.preventDefault();
    const id = document.getElementById("clienteId").value;
    const payload = {
        nome: document.getElementById("clienteNome").value.trim(),
        cpf: document.getElementById("clienteCpf").value.replace(/\D/g, ""),
        email: document.getElementById("clienteEmail").value.trim()
    };

    try {
        if (id) {
            await requisitarApi(`/clientes/${id}`, { method: "PUT", body: JSON.stringify(payload) });
            mostrarAlerta("Cliente atualizado com sucesso!");
        } else {
            await requisitarApi("/clientes", { method: "POST", body: JSON.stringify(payload) });
            mostrarAlerta("Cliente cadastrado com sucesso!");
        }
        bootstrap.Modal.getInstance(document.getElementById("modalCliente"))?.hide();
        await carregarTudo();
    } catch (erro) {
        mostrarAlerta(erro.message, "danger");
    }
}

async function excluirCliente(id, nome) {
    if (!window.confirm(`Confirma a exclusão do cliente "${nome}" (ID #${id})?`)) return;
    try {
        await requisitarApi(`/clientes/${id}`, { method: "DELETE" });
        mostrarAlerta("Cliente excluído com sucesso!");
        await carregarTudo();
    } catch (erro) {
        mostrarAlerta(erro.message, "danger");
    }
}

// ============================================================================
// 3. CRUD E FILTROS DE FABRICANTES (/api/fabricantes)
// ============================================================================

async function carregarFabricantes() {
    try {
        const qs = montarQueryString({
            nome: document.getElementById("filtroFabricanteNome")?.value,
            id: document.getElementById("filtroFabricanteId")?.value,
            possuiVeiculos: document.getElementById("filtroFabricantePossuiVeiculos")?.value
        });
        const lista = await requisitarApi(`/fabricantes${qs}`);
        if (!qs) cacheFabricantes = lista;

        const tbody = document.getElementById("tabelaFabricantes");
        if (lista.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Nenhum fabricante encontrado.</td></tr>`;
            return;
        }

        tbody.innerHTML = lista.map((f) => {
            const qtd = f.quantidadeVeiculos !== undefined
                ? f.quantidadeVeiculos
                : cacheVeiculos.filter((v) => v.fabricanteId === f.id).length;
            return `
                <tr>
                    <td>#${f.id}</td>
                    <td class="fw-semibold">${f.nome}</td>
                    <td><span class="badge bg-secondary">${qtd} veículo(s)</span></td>
                    <td class="text-end">
                        <button class="btn btn-outline-primary btn-sm me-1" onclick="editarFabricante(${f.id})">Editar</button>
                        <button class="btn btn-outline-danger btn-sm" onclick="excluirFabricante(${f.id}, '${f.nome.replace(/'/g, "\\'")}')">Excluir</button>
                    </td>
                </tr>
            `;
        }).join("");
    } catch (erro) {
        mostrarAlerta(`Erro ao carregar fabricantes: ${erro.message}`, "danger");
    }
}

function limparFiltrosFabricantes() {
    document.getElementById("filtroFabricanteNome").value = "";
    document.getElementById("filtroFabricanteId").value = "";
    document.getElementById("filtroFabricantePossuiVeiculos").value = "";
    carregarFabricantes();
}

function abrirModalFabricante() {
    document.getElementById("formFabricante").reset();
    document.getElementById("fabricanteId").value = "";
    document.getElementById("tituloModalFabricante").textContent = "Cadastrar Novo Fabricante";
    new bootstrap.Modal(document.getElementById("modalFabricante")).show();
}

async function editarFabricante(id) {
    try {
        const f = await requisitarApi(`/fabricantes/${id}`);
        document.getElementById("fabricanteId").value = f.id;
        document.getElementById("fabricanteNome").value = f.nome;
        document.getElementById("tituloModalFabricante").textContent = `Editar Fabricante #${f.id}`;
        new bootstrap.Modal(document.getElementById("modalFabricante")).show();
    } catch (erro) {
        mostrarAlerta(erro.message, "danger");
    }
}

async function salvarFabricante(event) {
    event.preventDefault();
    const id = document.getElementById("fabricanteId").value;
    const payload = { nome: document.getElementById("fabricanteNome").value.trim() };

    try {
        if (id) {
            await requisitarApi(`/fabricantes/${id}`, { method: "PUT", body: JSON.stringify(payload) });
            mostrarAlerta("Fabricante atualizado com sucesso!");
        } else {
            await requisitarApi("/fabricantes", { method: "POST", body: JSON.stringify(payload) });
            mostrarAlerta("Fabricante cadastrado com sucesso!");
        }
        bootstrap.Modal.getInstance(document.getElementById("modalFabricante"))?.hide();
        await carregarTudo();
    } catch (erro) {
        mostrarAlerta(erro.message, "danger");
    }
}

async function excluirFabricante(id, nome) {
    if (!window.confirm(`Confirma a exclusão do fabricante "${nome}" (ID #${id})?`)) return;
    try {
        await requisitarApi(`/fabricantes/${id}`, { method: "DELETE" });
        mostrarAlerta("Fabricante excluído com sucesso!");
        await carregarTudo();
    } catch (erro) {
        mostrarAlerta(erro.message, "danger");
    }
}

// ============================================================================
// 4. CRUD E FILTROS DE CATEGORIAS (/api/categorias)
// ============================================================================

async function carregarCategorias() {
    try {
        const qs = montarQueryString({
            nome: document.getElementById("filtroCategoriaNome")?.value,
            descricao: document.getElementById("filtroCategoriaDescricao")?.value
        });
        const lista = await requisitarApi(`/categorias${qs}`);
        if (!qs) cacheCategorias = lista;

        const tbody = document.getElementById("tabelaCategorias");
        if (lista.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Nenhuma categoria encontrada.</td></tr>`;
            return;
        }

        tbody.innerHTML = lista.map((c) => {
            const qtd = c.quantidadeVeiculos !== undefined
                ? c.quantidadeVeiculos
                : cacheVeiculos.filter((v) => v.categoriaId === c.id).length;
            return `
                <tr>
                    <td>#${c.id}</td>
                    <td class="fw-semibold">${c.nome}</td>
                    <td class="text-secondary">${c.descricao || "—"}</td>
                    <td><span class="badge bg-secondary">${qtd} veículo(s)</span></td>
                    <td class="text-end">
                        <button class="btn btn-outline-primary btn-sm me-1" onclick="editarCategoria(${c.id})">Editar</button>
                        <button class="btn btn-outline-danger btn-sm" onclick="excluirCategoria(${c.id}, '${c.nome.replace(/'/g, "\\'")}')">Excluir</button>
                    </td>
                </tr>
            `;
        }).join("");
    } catch (erro) {
        mostrarAlerta(`Erro ao carregar categorias: ${erro.message}`, "danger");
    }
}

function limparFiltrosCategorias() {
    document.getElementById("filtroCategoriaNome").value = "";
    document.getElementById("filtroCategoriaDescricao").value = "";
    carregarCategorias();
}

function abrirModalCategoria() {
    document.getElementById("formCategoria").reset();
    document.getElementById("categoriaId").value = "";
    document.getElementById("tituloModalCategoria").textContent = "Cadastrar Nova Categoria";
    new bootstrap.Modal(document.getElementById("modalCategoria")).show();
}

async function editarCategoria(id) {
    try {
        const c = await requisitarApi(`/categorias/${id}`);
        document.getElementById("categoriaId").value = c.id;
        document.getElementById("categoriaNome").value = c.nome;
        document.getElementById("categoriaDescricao").value = c.descricao || "";
        document.getElementById("tituloModalCategoria").textContent = `Editar Categoria #${c.id}`;
        new bootstrap.Modal(document.getElementById("modalCategoria")).show();
    } catch (erro) {
        mostrarAlerta(erro.message, "danger");
    }
}

async function salvarCategoria(event) {
    event.preventDefault();
    const id = document.getElementById("categoriaId").value;
    const payload = {
        nome: document.getElementById("categoriaNome").value.trim(),
        descricao: document.getElementById("categoriaDescricao").value.trim()
    };

    try {
        if (id) {
            await requisitarApi(`/categorias/${id}`, { method: "PUT", body: JSON.stringify(payload) });
            mostrarAlerta("Categoria atualizada com sucesso!");
        } else {
            await requisitarApi("/categorias", { method: "POST", body: JSON.stringify(payload) });
            mostrarAlerta("Categoria cadastrada com sucesso!");
        }
        bootstrap.Modal.getInstance(document.getElementById("modalCategoria"))?.hide();
        await carregarTudo();
    } catch (erro) {
        mostrarAlerta(erro.message, "danger");
    }
}

async function excluirCategoria(id, nome) {
    if (!window.confirm(`Confirma a exclusão da categoria "${nome}" (ID #${id})?`)) return;
    try {
        await requisitarApi(`/categorias/${id}`, { method: "DELETE" });
        mostrarAlerta("Categoria excluída com sucesso!");
        await carregarTudo();
    } catch (erro) {
        mostrarAlerta(erro.message, "danger");
    }
}

// ============================================================================
// 5. CRUD E FILTROS DE VEÍCULOS (/api/veiculos)
// ============================================================================

async function carregarVeiculos() {
    try {
        const qs = montarQueryString({
            modelo: document.getElementById("filtroVeiculoModelo")?.value,
            fabricanteId: document.getElementById("filtroVeiculoFabricante")?.value,
            categoriaId: document.getElementById("filtroVeiculoCategoria")?.value,
            anoMinimo: document.getElementById("filtroVeiculoAnoMin")?.value,
            kmMaxima: document.getElementById("filtroVeiculoKmMax")?.value
        });
        const lista = await requisitarApi(`/veiculos${qs}`);
        if (!qs) cacheVeiculos = lista;

        const tbody = document.getElementById("tabelaVeiculos");
        if (lista.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">Nenhum veículo encontrado.</td></tr>`;
            return;
        }

        tbody.innerHTML = lista.map((v) => {
            const alugado = cacheAlugueis.some((a) => a.veiculoId === v.id && !a.dataDevolucao);
            return `
                <tr>
                    <td>#${v.id}</td>
                    <td class="fw-semibold">${v.modelo}</td>
                    <td>${v.fabricanteNome}</td>
                    <td><span class="badge bg-light text-dark border">${v.categoriaNome}</span></td>
                    <td>${v.anoFabricacao}</td>
                    <td>${Number(v.quilometragemAtual).toLocaleString("pt-BR")} km</td>
                    <td>
                        ${alugado
                            ? `<span class="badge bg-warning text-dark">Locado</span>`
                            : `<span class="badge bg-success">Disponível</span>`}
                    </td>
                    <td class="text-end">
                        <button class="btn btn-outline-primary btn-sm me-1" onclick="editarVeiculo(${v.id})">Editar</button>
                        <button class="btn btn-outline-danger btn-sm" onclick="excluirVeiculo(${v.id}, '${v.modelo.replace(/'/g, "\\'")}')">Excluir</button>
                    </td>
                </tr>
            `;
        }).join("");
    } catch (erro) {
        mostrarAlerta(`Erro ao carregar veículos: ${erro.message}`, "danger");
    }
}

function limparFiltrosVeiculos() {
    document.getElementById("filtroVeiculoModelo").value = "";
    document.getElementById("filtroVeiculoFabricante").value = "";
    document.getElementById("filtroVeiculoCategoria").value = "";
    document.getElementById("filtroVeiculoAnoMin").value = "";
    document.getElementById("filtroVeiculoKmMax").value = "";
    carregarVeiculos();
}

function abrirModalVeiculo() {
    document.getElementById("formVeiculo").reset();
    document.getElementById("veiculoId").value = "";
    document.getElementById("tituloModalVeiculo").textContent = "Cadastrar Novo Veículo";
    new bootstrap.Modal(document.getElementById("modalVeiculo")).show();
}

async function editarVeiculo(id) {
    try {
        const v = await requisitarApi(`/veiculos/${id}`);
        document.getElementById("veiculoId").value = v.id;
        document.getElementById("veiculoModelo").value = v.modelo;
        document.getElementById("veiculoFabricanteId").value = v.fabricanteId;
        document.getElementById("veiculoCategoriaId").value = v.categoriaId;
        document.getElementById("veiculoAno").value = v.anoFabricacao;
        document.getElementById("veiculoKm").value = v.quilometragemAtual;
        document.getElementById("tituloModalVeiculo").textContent = `Editar Veículo #${v.id}`;
        new bootstrap.Modal(document.getElementById("modalVeiculo")).show();
    } catch (erro) {
        mostrarAlerta(erro.message, "danger");
    }
}

async function salvarVeiculo(event) {
    event.preventDefault();
    const id = document.getElementById("veiculoId").value;
    const payload = {
        modelo: document.getElementById("veiculoModelo").value.trim(),
        fabricanteId: Number(document.getElementById("veiculoFabricanteId").value),
        categoriaId: Number(document.getElementById("veiculoCategoriaId").value),
        anoFabricacao: Number(document.getElementById("veiculoAno").value),
        quilometragemAtual: Number(document.getElementById("veiculoKm").value)
    };

    try {
        if (id) {
            await requisitarApi(`/veiculos/${id}`, { method: "PUT", body: JSON.stringify(payload) });
            mostrarAlerta("Veículo atualizado com sucesso!");
        } else {
            await requisitarApi("/veiculos", { method: "POST", body: JSON.stringify(payload) });
            mostrarAlerta("Veículo cadastrado com sucesso!");
        }
        bootstrap.Modal.getInstance(document.getElementById("modalVeiculo"))?.hide();
        await carregarTudo();
    } catch (erro) {
        mostrarAlerta(erro.message, "danger");
    }
}

async function excluirVeiculo(id, modelo) {
    if (!window.confirm(`Confirma a exclusão do veículo "${modelo}" (ID #${id})?`)) return;
    try {
        await requisitarApi(`/veiculos/${id}`, { method: "DELETE" });
        mostrarAlerta("Veículo excluído com sucesso!");
        await carregarTudo();
    } catch (erro) {
        mostrarAlerta(erro.message, "danger");
    }
}

// ============================================================================
// 6. CRUD E FILTROS DE ALUGUÉIS (/api/alugueis)
// ============================================================================

async function carregarAlugueis() {
    try {
        const qs = montarQueryString({
            clienteNome: document.getElementById("filtroAluguelCliente")?.value,
            veiculoModelo: document.getElementById("filtroAluguelVeiculo")?.value,
            status: document.getElementById("filtroAluguelStatus")?.value,
            valorDiariaMax: document.getElementById("filtroAluguelDiariaMax")?.value
        });
        const lista = await requisitarApi(`/alugueis${qs}`);
        if (!qs) cacheAlugueis = lista;

        const tbody = document.getElementById("tabelaAlugueis");
        if (lista.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">Nenhum contrato de aluguel encontrado.</td></tr>`;
            return;
        }

        tbody.innerHTML = lista.map((a) => `
            <tr>
                <td>#${a.id}</td>
                <td class="fw-semibold">${a.clienteNome}</td>
                <td>${a.veiculoModelo}</td>
                <td>${formatarData(a.dataInicio)} → ${formatarData(a.dataPrevistaFim)}</td>
                <td>
                    ${a.dataDevolucao
                        ? `<span class="badge bg-success">${formatarData(a.dataDevolucao)}</span>`
                        : `<span class="badge bg-warning text-dark">Em Aberto</span>`}
                </td>
                <td>${Number(a.quilometragemInicial).toLocaleString("pt-BR")} → ${a.quilometragemFinal ? Number(a.quilometragemFinal).toLocaleString("pt-BR") : "—"} km</td>
                <td>${formatarMoeda(a.valorDiaria)}</td>
                <td class="fw-bold text-success">${formatarMoeda(a.valorTotalLocacao)}</td>
                <td class="text-end">
                    <button class="btn btn-outline-primary btn-sm me-1" onclick="editarAluguel(${a.id})">Editar / Devolver</button>
                    <button class="btn btn-outline-danger btn-sm" onclick="excluirAluguel(${a.id})">Excluir</button>
                </td>
            </tr>
        `).join("");
    } catch (erro) {
        mostrarAlerta(`Erro ao carregar aluguéis: ${erro.message}`, "danger");
    }
}

function limparFiltrosAlugueis() {
    document.getElementById("filtroAluguelCliente").value = "";
    document.getElementById("filtroAluguelVeiculo").value = "";
    document.getElementById("filtroAluguelStatus").value = "";
    document.getElementById("filtroAluguelDiariaMax").value = "";
    carregarAlugueis();
}

function preencherKmVeiculoSelecionado() {
    const idAluguel = document.getElementById("aluguelId").value;
    if (idAluguel) return; // Não sobrescreve na edição
    const vId = Number(document.getElementById("aluguelVeiculoId").value);
    const veiculo = cacheVeiculos.find((v) => v.id === vId);
    if (veiculo) {
        document.getElementById("aluguelKmInicial").value = veiculo.quilometragemAtual;
    }
}

function calcularValorTotalAluguel() {
    const inicio = document.getElementById("aluguelDataInicio").value;
    const devolucao = document.getElementById("aluguelDataDevolucao").value;
    const diaria = Number(document.getElementById("aluguelValorDiaria").value || 0);

    if (inicio && devolucao && diaria > 0) {
        const dtIni = new Date(inicio);
        const dtFim = new Date(devolucao);
        const diffDias = Math.max(1, Math.ceil((dtFim - dtIni) / (1000 * 60 * 60 * 24)));
        document.getElementById("aluguelValorTotal").value = (diffDias * diaria).toFixed(2);
    }
}

function abrirModalAluguel() {
    document.getElementById("formAluguel").reset();
    document.getElementById("aluguelId").value = "";
    const hoje = new Date().toISOString().split("T")[0];
    document.getElementById("aluguelDataInicio").value = hoje;
    document.getElementById("tituloModalAluguel").textContent = "Registrar Novo Contrato de Aluguel";
    preencherKmVeiculoSelecionado();
    new bootstrap.Modal(document.getElementById("modalAluguel")).show();
}

async function editarAluguel(id) {
    try {
        const a = await requisitarApi(`/alugueis/${id}`);
        document.getElementById("aluguelId").value = a.id;
        document.getElementById("aluguelClienteId").value = a.clienteId;
        document.getElementById("aluguelVeiculoId").value = a.veiculoId;
        document.getElementById("aluguelDataInicio").value = String(a.dataInicio).split("T")[0];
        document.getElementById("aluguelDataPrevistaFim").value = String(a.dataPrevistaFim).split("T")[0];
        document.getElementById("aluguelDataDevolucao").value = a.dataDevolucao ? String(a.dataDevolucao).split("T")[0] : "";
        document.getElementById("aluguelKmInicial").value = a.quilometragemInicial;
        document.getElementById("aluguelKmFinal").value = a.quilometragemFinal ?? "";
        document.getElementById("aluguelValorDiaria").value = a.valorDiaria;
        document.getElementById("aluguelValorTotal").value = a.valorTotalLocacao ?? "";
        document.getElementById("tituloModalAluguel").textContent = `Editar / Encerrar Aluguel #${a.id}`;
        new bootstrap.Modal(document.getElementById("modalAluguel")).show();
    } catch (erro) {
        mostrarAlerta(erro.message, "danger");
    }
}

async function salvarAluguel(event) {
    event.preventDefault();
    const id = document.getElementById("aluguelId").value;
    const dataDevolucao = document.getElementById("aluguelDataDevolucao").value || null;
    const kmFinalVal = document.getElementById("aluguelKmFinal").value;
    const totalVal = document.getElementById("aluguelValorTotal").value;

    const payload = {
        clienteId: Number(document.getElementById("aluguelClienteId").value),
        veiculoId: Number(document.getElementById("aluguelVeiculoId").value),
        dataInicio: document.getElementById("aluguelDataInicio").value,
        dataPrevistaFim: document.getElementById("aluguelDataPrevistaFim").value,
        dataDevolucao,
        quilometragemInicial: Number(document.getElementById("aluguelKmInicial").value),
        quilometragemFinal: kmFinalVal !== "" ? Number(kmFinalVal) : null,
        valorDiaria: Number(document.getElementById("aluguelValorDiaria").value),
        valorTotalLocacao: totalVal !== "" ? Number(totalVal) : null
    };

    try {
        if (id) {
            await requisitarApi(`/alugueis/${id}`, { method: "PUT", body: JSON.stringify(payload) });
            mostrarAlerta("Contrato de aluguel atualizado com sucesso!");
        } else {
            await requisitarApi("/alugueis", { method: "POST", body: JSON.stringify(payload) });
            mostrarAlerta("Contrato de aluguel registrado com sucesso!");
        }
        bootstrap.Modal.getInstance(document.getElementById("modalAluguel"))?.hide();
        await carregarTudo();
    } catch (erro) {
        mostrarAlerta(erro.message, "danger");
    }
}

async function excluirAluguel(id) {
    if (!window.confirm(`Confirma a exclusão permanente do contrato de aluguel #${id}?`)) return;
    try {
        await requisitarApi(`/alugueis/${id}`, { method: "DELETE" });
        mostrarAlerta("Aluguel excluído com sucesso!");
        await carregarTudo();
    } catch (erro) {
        mostrarAlerta(erro.message, "danger");
    }
}

// ============================================================================
// 7. CRUD E FILTROS DE PRODUTOS (/api/produtos)
// ============================================================================

async function carregarProdutos() {
    try {
        const qs = montarQueryString({
            nome: document.getElementById("filtroProdutoNome")?.value,
            codigo: document.getElementById("filtroProdutoCodigo")?.value,
            categoria: document.getElementById("filtroProdutoCategoria")?.value,
            precoMax: document.getElementById("filtroProdutoPrecoMax")?.value
        });
        const lista = await requisitarApi(`/produtos${qs}`);
        if (!qs) cacheProdutos = lista;

        const tbody = document.getElementById("tabelaProdutos");
        if (lista.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">Nenhum produto encontrado.</td></tr>`;
            return;
        }

        tbody.innerHTML = lista.map((p) => `
            <tr>
                <td>#${p.id}</td>
                <td><code>${p.codigo}</code></td>
                <td class="fw-semibold">${p.nome}</td>
                <td><span class="badge bg-light text-dark border">${p.categoria}</span></td>
                <td class="fw-bold text-success">${formatarMoeda(p.preco)}</td>
                <td>${p.quantidadeEstoque} un.</td>
                <td>★ ${Number(p.avaliacao).toFixed(1)}</td>
                <td class="text-end">
                    <button class="btn btn-outline-primary btn-sm me-1" onclick="editarProduto(${p.id})">Editar</button>
                    <button class="btn btn-outline-danger btn-sm" onclick="excluirProduto(${p.id}, '${p.nome.replace(/'/g, "\\'")}')">Excluir</button>
                </td>
            </tr>
        `).join("");
    } catch (erro) {
        mostrarAlerta(`Erro ao carregar produtos: ${erro.message}`, "danger");
    }
}

function limparFiltrosProdutos() {
    document.getElementById("filtroProdutoNome").value = "";
    document.getElementById("filtroProdutoCodigo").value = "";
    document.getElementById("filtroProdutoCategoria").value = "";
    document.getElementById("filtroProdutoPrecoMax").value = "";
    carregarProdutos();
}

function abrirModalProduto() {
    document.getElementById("formProduto").reset();
    document.getElementById("produtoId").value = "";
    document.getElementById("tituloModalProduto").textContent = "Cadastrar Novo Produto";
    new bootstrap.Modal(document.getElementById("modalProduto")).show();
}

async function editarProduto(id) {
    try {
        const p = await requisitarApi(`/produtos/${id}`);
        document.getElementById("produtoId").value = p.id;
        document.getElementById("produtoNome").value = p.nome;
        document.getElementById("produtoCodigo").value = p.codigo;
        document.getElementById("produtoPreco").value = p.preco;
        document.getElementById("produtoEstoque").value = p.quantidadeEstoque;
        document.getElementById("produtoAvaliacao").value = p.avaliacao;
        document.getElementById("produtoCategoria").value = p.categoria;
        document.getElementById("produtoDescricao").value = p.descricao || "";
        document.getElementById("tituloModalProduto").textContent = `Editar Produto #${p.id}`;
        new bootstrap.Modal(document.getElementById("modalProduto")).show();
    } catch (erro) {
        mostrarAlerta(erro.message, "danger");
    }
}

async function salvarProduto(event) {
    event.preventDefault();
    const id = document.getElementById("produtoId").value;
    const payload = {
        nome: document.getElementById("produtoNome").value.trim(),
        codigo: document.getElementById("produtoCodigo").value.trim(),
        preco: Number(document.getElementById("produtoPreco").value),
        quantidadeEstoque: Number(document.getElementById("produtoEstoque").value),
        avaliacao: Number(document.getElementById("produtoAvaliacao").value),
        categoria: document.getElementById("produtoCategoria").value.trim(),
        descricao: document.getElementById("produtoDescricao").value.trim()
    };

    try {
        if (id) {
            await requisitarApi(`/produtos/${id}`, { method: "PUT", body: JSON.stringify(payload) });
            mostrarAlerta("Produto atualizado com sucesso!");
        } else {
            await requisitarApi("/produtos", { method: "POST", body: JSON.stringify(payload) });
            mostrarAlerta("Produto cadastrado com sucesso!");
        }
        bootstrap.Modal.getInstance(document.getElementById("modalProduto"))?.hide();
        await carregarProdutos();
    } catch (erro) {
        mostrarAlerta(erro.message, "danger");
    }
}

async function excluirProduto(id, nome) {
    if (!window.confirm(`Confirma a exclusão do produto "${nome}" (ID #${id})?`)) return;
    try {
        await requisitarApi(`/produtos/${id}`, { method: "DELETE" });
        mostrarAlerta("Produto removido com sucesso!");
        await carregarProdutos();
    } catch (erro) {
        mostrarAlerta(erro.message, "danger");
    }
}

// ============================================================================
// SINCRONIZAÇÃO DE SELECTS E INICIALIZAÇÃO GLOBAL
// ============================================================================

function popularSelectsRelacionais() {
    const optsFab = cacheFabricantes.map((f) => `<option value="${f.id}">${f.nome}</option>`).join("");
    const optsCat = cacheCategorias.map((c) => `<option value="${c.id}">${c.nome}</option>`).join("");
    const optsCli = cacheClientes.map((c) => `<option value="${c.id}">${c.nome} (${formatarCpf(c.cpf)})</option>`).join("");
    const optsVei = cacheVeiculos.map((v) => `<option value="${v.id}">${v.modelo} (${v.anoFabricacao})</option>`).join("");

    document.getElementById("veiculoFabricanteId").innerHTML = optsFab;
    document.getElementById("veiculoCategoriaId").innerHTML = optsCat;
    document.getElementById("aluguelClienteId").innerHTML = optsCli;
    document.getElementById("aluguelVeiculoId").innerHTML = optsVei;

    document.getElementById("filtroVeiculoFabricante").innerHTML = `<option value="">Todos</option>${optsFab}`;
    document.getElementById("filtroVeiculoCategoria").innerHTML = `<option value="">Todas</option>${optsCat}`;
    document.getElementById("filtroDispCategoria").innerHTML = `<option value="">Todas as Categorias</option>${optsCat}`;
}

async function carregarTudo() {
    await Promise.all([
        carregarClientes(),
        carregarFabricantes(),
        carregarCategorias(),
        carregarAlugueis(),
        carregarProdutos()
    ]);
    await carregarVeiculos();
    popularSelectsRelacionais();
    await Promise.all([
        atualizarDashboard(),
        executarConsultaDisponiveis(),
        executarConsultaAlugueisPorCliente(),
        executarConsultaVeiculosPorFabricante()
    ]);
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("formCliente").addEventListener("submit", salvarCliente);
    document.getElementById("formFabricante").addEventListener("submit", salvarFabricante);
    document.getElementById("formCategoria").addEventListener("submit", salvarCategoria);
    document.getElementById("formVeiculo").addEventListener("submit", salvarVeiculo);
    document.getElementById("formAluguel").addEventListener("submit", salvarAluguel);
    document.getElementById("formProduto").addEventListener("submit", salvarProduto);

    carregarTudo();
});
