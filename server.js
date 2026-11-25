const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 5000;
const DB_FILE = path.join(__dirname, "db", "locadora_db.json");
const FRONTEND_DIR = path.join(__dirname, "frontend");

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept"
};

function lerBanco() {
    if (!fs.existsSync(DB_FILE)) {
        fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
        fs.writeFileSync(DB_FILE, JSON.stringify({
            fabricantes: [],
            categorias: [],
            clientes: [],
            veiculos: [],
            alugueis: [],
            produtos: []
        }, null, 2), "utf-8");
    }
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function salvarBanco(db) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

function proximoId(lista) {
    return lista.length > 0 ? Math.max(...lista.map((i) => Number(i.id) || 0)) + 1 : 1;
}

function lerBodyJson(req) {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", (chunk) => { body += chunk.toString(); });
        req.on("end", () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch {
                reject(new Error("JSON inválido no corpo da requisição."));
            }
        });
        req.on("error", reject);
    });
}

function responderJson(res, statusCode, dados) {
    res.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        ...CORS_HEADERS
    });
    if (statusCode === 204) {
        return res.end();
    }
    res.end(JSON.stringify(dados));
}

function responderErro(res, statusCode, mensagem) {
    return responderJson(res, statusCode, { message: mensagem, mensagem });
}

const server = http.createServer(async (req, res) => {
    if (req.method === "OPTIONS") {
        res.writeHead(204, CORS_HEADERS);
        return res.end();
    }

    const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = parsedUrl.pathname.replace(/\/+$/, "") || "/";
    const query = Object.fromEntries(parsedUrl.searchParams.entries());

    try {
        const db = lerBanco();

        // ====================================================================
        // 1. ROTAS DE CONSULTAS / FILTROS DA ETAPA 3 (FiltrosController.cs)
        // ====================================================================
        if (pathname === "/api/filtros/veiculos-por-fabricante" && req.method === "GET") {
            const termo = (query.fabricanteNome || "").trim().toLowerCase();
            // INNER JOIN Veiculos + Fabricantes + Categorias
            const resultado = db.veiculos
                .map((v) => {
                    const fab = db.fabricantes.find((f) => f.id === v.fabricanteId);
                    const cat = db.categorias.find((c) => c.id === v.categoriaId);
                    if (!fab || !cat) return null;
                    return {
                        id: v.id,
                        modelo: v.modelo,
                        anoFabricacao: v.anoFabricacao,
                        quilometragemAtual: v.quilometragemAtual,
                        fabricanteNome: fab.nome,
                        categoriaNome: cat.nome
                    };
                })
                .filter((item) => item && (!termo || item.fabricanteNome.toLowerCase().includes(termo)));

            return responderJson(res, 200, resultado);
        }

        if (pathname === "/api/filtros/alugueis-por-cliente" && req.method === "GET") {
            const termo = (query.clienteNome || "").trim().toLowerCase();
            // INNER JOIN Alugueis + Clientes + Veiculos
            const resultado = db.alugueis
                .map((a) => {
                    const cli = db.clientes.find((c) => c.id === a.clienteId);
                    const vei = db.veiculos.find((v) => v.id === a.veiculoId);
                    if (!cli || !vei) return null;
                    return {
                        aluguelId: a.id,
                        dataInicio: a.dataInicio,
                        dataPrevistaFim: a.dataPrevistaFim,
                        dataDevolucao: a.dataDevolucao,
                        valorDiaria: a.valorDiaria,
                        valorTotalLocacao: a.valorTotalLocacao,
                        clienteNome: cli.nome,
                        veiculoModelo: vei.modelo
                    };
                })
                .filter((item) => item && (!termo || item.clienteNome.toLowerCase().includes(termo)));

            return responderJson(res, 200, resultado);
        }

        if (pathname === "/api/filtros/fabricantes-com-veiculos" && req.method === "GET") {
            // LEFT JOIN Fabricantes + Veiculos GROUP BY Fabricante
            const resultado = db.fabricantes.map((f) => ({
                fabricanteId: f.id,
                fabricanteNome: f.nome,
                quantidadeVeiculos: db.veiculos.filter((v) => v.fabricanteId === f.id).length
            }));
            return responderJson(res, 200, resultado);
        }

        if (pathname === "/api/filtros/clientes-com-alugueis-ativos" && req.method === "GET") {
            // LEFT JOIN Clientes + Alugueis GROUP BY Cliente (DataDevolucao == null)
            const resultado = db.clientes.map((c) => ({
                clienteId: c.id,
                clienteNome: c.nome,
                clienteCpf: c.cpf,
                quantidadeAlugueisAtivos: db.alugueis.filter((a) => a.clienteId === c.id && !a.dataDevolucao).length
            }));
            return responderJson(res, 200, resultado);
        }

        if (pathname === "/api/filtros/veiculos-disponiveis" && req.method === "GET") {
            const catId = query.categoriaId ? Number(query.categoriaId) : null;
            const anoMin = query.anoMinimo ? Number(query.anoMinimo) : null;

            // INNER JOIN Veiculos + Categorias + Fabricantes + LEFT JOIN Alugueis Ativos (where ag == null)
            const resultado = db.veiculos
                .filter((v) => {
                    const possuiAluguelAtivo = db.alugueis.some((a) => a.veiculoId === v.id && !a.dataDevolucao);
                    const matchCat = !catId || v.categoriaId === catId;
                    const matchAno = !anoMin || v.anoFabricacao >= anoMin;
                    return !possuiAluguelAtivo && matchCat && matchAno;
                })
                .map((v) => {
                    const fab = db.fabricantes.find((f) => f.id === v.fabricanteId);
                    const cat = db.categorias.find((c) => c.id === v.categoriaId);
                    return {
                        veiculoId: v.id,
                        modelo: v.modelo,
                        anoFabricacao: v.anoFabricacao,
                        quilometragemAtual: v.quilometragemAtual,
                        fabricanteNome: fab ? fab.nome : "",
                        categoriaNome: cat ? cat.nome : "",
                        disponivel: true
                    };
                });

            return responderJson(res, 200, resultado);
        }

        // ====================================================================
        // 2. ENTIDADE: CLIENTES (/api/clientes)
        // ====================================================================
        if (pathname === "/api/clientes") {
            if (req.method === "GET") {
                let lista = [...db.clientes];
                if (query.nome) lista = lista.filter((c) => c.nome.toLowerCase().includes(query.nome.toLowerCase()));
                if (query.cpf) lista = lista.filter((c) => c.cpf.includes(query.cpf.replace(/\D/g, "")));
                if (query.email) lista = lista.filter((c) => c.email.toLowerCase().includes(query.email.toLowerCase()));
                return responderJson(res, 200, lista);
            }

            if (req.method === "POST") {
                const dto = await lerBodyJson(req);
                const cpfLimpo = String(dto.cpf || "").replace(/\D/g, "");
                if (!dto.nome || cpfLimpo.length !== 11 || !dto.email) {
                    return responderErro(res, 400, "Nome, CPF (11 dígitos numéricos) e E-mail válido são obrigatórios.");
                }
                if (db.clientes.some((c) => c.cpf === cpfLimpo || c.email.toLowerCase() === dto.email.toLowerCase())) {
                    return responderErro(res, 409, "Já existe um cliente cadastrado com este CPF ou E-mail.");
                }
                const novo = {
                    id: proximoId(db.clientes),
                    nome: dto.nome.trim(),
                    cpf: cpfLimpo,
                    email: dto.email.trim()
                };
                db.clientes.push(novo);
                salvarBanco(db);
                return responderJson(res, 201, novo);
            }
        }

        const matchCliente = pathname.match(/^\/api\/clientes\/(\d+)$/);
        if (matchCliente) {
            const id = Number(matchCliente[1]);
            const idx = db.clientes.findIndex((c) => c.id === id);
            if (idx === -1) return responderErro(res, 404, "Cliente não encontrado.");

            if (req.method === "GET") return responderJson(res, 200, db.clientes[idx]);

            if (req.method === "PUT") {
                const dto = await lerBodyJson(req);
                const cpfLimpo = String(dto.cpf || "").replace(/\D/g, "");
                if (!dto.nome || cpfLimpo.length !== 11 || !dto.email) {
                    return responderErro(res, 400, "Nome, CPF (11 dígitos) e E-mail são obrigatórios.");
                }
                if (db.clientes.some((c) => c.id !== id && (c.cpf === cpfLimpo || c.email.toLowerCase() === dto.email.toLowerCase()))) {
                    return responderErro(res, 409, "Já existe outro cliente com este CPF ou E-mail.");
                }
                db.clientes[idx] = { id, nome: dto.nome.trim(), cpf: cpfLimpo, email: dto.email.trim() };
                salvarBanco(db);
                return responderJson(res, 200, db.clientes[idx]);
            }

            if (req.method === "DELETE") {
                if (db.alugueis.some((a) => a.clienteId === id)) {
                    return responderErro(res, 400, "Não é possível excluir um cliente que possui histórico de aluguéis (Integridade Referencial).");
                }
                db.clientes.splice(idx, 1);
                salvarBanco(db);
                return responderJson(res, 200, { mensagem: "Cliente excluído com sucesso." });
            }
        }

        // ====================================================================
        // 3. ENTIDADE: FABRICANTES (/api/fabricantes)
        // ====================================================================
        if (pathname === "/api/fabricantes") {
            if (req.method === "GET") {
                let lista = db.fabricantes.map((f) => ({
                    ...f,
                    quantidadeVeiculos: db.veiculos.filter((v) => v.fabricanteId === f.id).length
                }));
                if (query.nome) lista = lista.filter((f) => f.nome.toLowerCase().includes(query.nome.toLowerCase()));
                if (query.id) lista = lista.filter((f) => f.id === Number(query.id));
                if (query.possuiVeiculos === "true") lista = lista.filter((f) => f.quantidadeVeiculos > 0);
                if (query.possuiVeiculos === "false") lista = lista.filter((f) => f.quantidadeVeiculos === 0);
                return responderJson(res, 200, lista);
            }

            if (req.method === "POST") {
                const dto = await lerBodyJson(req);
                if (!dto.nome || !dto.nome.trim()) {
                    return responderErro(res, 400, "O nome do fabricante é obrigatório.");
                }
                if (db.fabricantes.some((f) => f.nome.toLowerCase() === dto.nome.trim().toLowerCase())) {
                    return responderErro(res, 409, "Já existe um fabricante com este nome.");
                }
                const novo = { id: proximoId(db.fabricantes), nome: dto.nome.trim() };
                db.fabricantes.push(novo);
                salvarBanco(db);
                return responderJson(res, 201, novo);
            }
        }

        const matchFabricante = pathname.match(/^\/api\/fabricantes\/(\d+)$/);
        if (matchFabricante) {
            const id = Number(matchFabricante[1]);
            const idx = db.fabricantes.findIndex((f) => f.id === id);
            if (idx === -1) return responderErro(res, 404, "Fabricante não encontrado.");

            if (req.method === "GET") return responderJson(res, 200, db.fabricantes[idx]);

            if (req.method === "PUT") {
                const dto = await lerBodyJson(req);
                if (!dto.nome || !dto.nome.trim()) return responderErro(res, 400, "O nome do fabricante é obrigatório.");
                if (db.fabricantes.some((f) => f.id !== id && f.nome.toLowerCase() === dto.nome.trim().toLowerCase())) {
                    return responderErro(res, 409, "Já existe outro fabricante com este nome.");
                }
                db.fabricantes[idx] = { id, nome: dto.nome.trim() };
                salvarBanco(db);
                return responderJson(res, 200, db.fabricantes[idx]);
            }

            if (req.method === "DELETE") {
                if (db.veiculos.some((v) => v.fabricanteId === id)) {
                    return responderErro(res, 400, "Não é possível excluir um fabricante que possui veículos associados.");
                }
                db.fabricantes.splice(idx, 1);
                salvarBanco(db);
                return responderJson(res, 200, { mensagem: "Fabricante excluído com sucesso." });
            }
        }

        // ====================================================================
        // 4. ENTIDADE: CATEGORIAS (/api/categorias)
        // ====================================================================
        if (pathname === "/api/categorias") {
            if (req.method === "GET") {
                let lista = db.categorias.map((c) => ({
                    ...c,
                    quantidadeVeiculos: db.veiculos.filter((v) => v.categoriaId === c.id).length
                }));
                if (query.nome) lista = lista.filter((c) => c.nome.toLowerCase().includes(query.nome.toLowerCase()));
                if (query.descricao) lista = lista.filter((c) => (c.descricao || "").toLowerCase().includes(query.descricao.toLowerCase()));
                return responderJson(res, 200, lista);
            }

            if (req.method === "POST") {
                const dto = await lerBodyJson(req);
                if (!dto.nome || !dto.nome.trim()) return responderErro(res, 400, "O nome da categoria é obrigatório.");
                if (db.categorias.some((c) => c.nome.toLowerCase() === dto.nome.trim().toLowerCase())) {
                    return responderErro(res, 409, "Já existe uma categoria com este nome.");
                }
                const nova = {
                    id: proximoId(db.categorias),
                    nome: dto.nome.trim(),
                    descricao: (dto.descricao || "").trim()
                };
                db.categorias.push(nova);
                salvarBanco(db);
                return responderJson(res, 201, nova);
            }
        }

        const matchCategoria = pathname.match(/^\/api\/categorias\/(\d+)$/);
        if (matchCategoria) {
            const id = Number(matchCategoria[1]);
            const idx = db.categorias.findIndex((c) => c.id === id);
            if (idx === -1) return responderErro(res, 404, "Categoria não encontrada.");

            if (req.method === "GET") return responderJson(res, 200, db.categorias[idx]);

            if (req.method === "PUT") {
                const dto = await lerBodyJson(req);
                if (!dto.nome || !dto.nome.trim()) return responderErro(res, 400, "O nome da categoria é obrigatório.");
                if (db.categorias.some((c) => c.id !== id && c.nome.toLowerCase() === dto.nome.trim().toLowerCase())) {
                    return responderErro(res, 409, "Já existe outra categoria com este nome.");
                }
                db.categorias[idx] = {
                    id,
                    nome: dto.nome.trim(),
                    descricao: (dto.descricao || "").trim()
                };
                salvarBanco(db);
                return responderJson(res, 200, db.categorias[idx]);
            }

            if (req.method === "DELETE") {
                if (db.veiculos.some((v) => v.categoriaId === id)) {
                    return responderErro(res, 400, "Não é possível excluir uma categoria que possui veículos associados.");
                }
                db.categorias.splice(idx, 1);
                salvarBanco(db);
                return responderJson(res, 200, { mensagem: "Categoria excluída com sucesso." });
            }
        }

        // ====================================================================
        // 5. ENTIDADE: VEÍCULOS (/api/veiculos)
        // ====================================================================
        if (pathname === "/api/veiculos") {
            if (req.method === "GET") {
                let lista = db.veiculos.map((v) => {
                    const fab = db.fabricantes.find((f) => f.id === v.fabricanteId);
                    const cat = db.categorias.find((c) => c.id === v.categoriaId);
                    const alugado = db.alugueis.some((a) => a.veiculoId === v.id && !a.dataDevolucao);
                    return {
                        ...v,
                        fabricanteNome: fab ? fab.nome : "N/A",
                        categoriaNome: cat ? cat.nome : "N/A",
                        disponivel: !alugado
                    };
                });

                if (query.modelo) lista = lista.filter((v) => v.modelo.toLowerCase().includes(query.modelo.toLowerCase()));
                if (query.fabricanteId) lista = lista.filter((v) => v.fabricanteId === Number(query.fabricanteId));
                if (query.categoriaId) lista = lista.filter((v) => v.categoriaId === Number(query.categoriaId));
                if (query.anoMinimo) lista = lista.filter((v) => v.anoFabricacao >= Number(query.anoMinimo));
                if (query.kmMaxima) lista = lista.filter((v) => v.quilometragemAtual <= Number(query.kmMaxima));

                return responderJson(res, 200, lista);
            }

            if (req.method === "POST") {
                const dto = await lerBodyJson(req);
                const fabId = Number(dto.fabricanteId);
                const catId = Number(dto.categoriaId);
                const ano = Number(dto.anoFabricacao);
                const km = Number(dto.quilometragemAtual);

                if (!dto.modelo || ano < 1886 || km < 0) {
                    return responderErro(res, 400, "Modelo, Ano (>= 1886) e Quilometragem (>= 0) são obrigatórios.");
                }
                if (!db.fabricantes.some((f) => f.id === fabId)) return responderErro(res, 400, "Fabricante selecionado não existe.");
                if (!db.categorias.some((c) => c.id === catId)) return responderErro(res, 400, "Categoria selecionada não existe.");

                const novo = {
                    id: proximoId(db.veiculos),
                    modelo: dto.modelo.trim(),
                    anoFabricacao: ano,
                    quilometragemAtual: km,
                    fabricanteId: fabId,
                    categoriaId: catId
                };
                db.veiculos.push(novo);
                salvarBanco(db);
                return responderJson(res, 201, novo);
            }
        }

        const matchVeiculo = pathname.match(/^\/api\/veiculos\/(\d+)$/);
        if (matchVeiculo) {
            const id = Number(matchVeiculo[1]);
            const idx = db.veiculos.findIndex((v) => v.id === id);
            if (idx === -1) return responderErro(res, 404, "Veículo não encontrado.");

            if (req.method === "GET") {
                const v = db.veiculos[idx];
                const fab = db.fabricantes.find((f) => f.id === v.fabricanteId);
                const cat = db.categorias.find((c) => c.id === v.categoriaId);
                return responderJson(res, 200, {
                    ...v,
                    fabricanteNome: fab ? fab.nome : "",
                    categoriaNome: cat ? cat.nome : ""
                });
            }

            if (req.method === "PUT") {
                const dto = await lerBodyJson(req);
                const fabId = Number(dto.fabricanteId);
                const catId = Number(dto.categoriaId);
                const ano = Number(dto.anoFabricacao);
                const km = Number(dto.quilometragemAtual);

                if (!dto.modelo || ano < 1886 || km < 0) {
                    return responderErro(res, 400, "Dados inválidos para o veículo.");
                }
                db.veiculos[idx] = {
                    id,
                    modelo: dto.modelo.trim(),
                    anoFabricacao: ano,
                    quilometragemAtual: km,
                    fabricanteId: fabId,
                    categoriaId: catId
                };
                salvarBanco(db);
                return responderJson(res, 200, db.veiculos[idx]);
            }

            if (req.method === "DELETE") {
                if (db.alugueis.some((a) => a.veiculoId === id)) {
                    return responderErro(res, 400, "Não é possível excluir um veículo que possui aluguéis associados.");
                }
                db.veiculos.splice(idx, 1);
                salvarBanco(db);
                return responderJson(res, 200, { mensagem: "Veículo excluído com sucesso." });
            }
        }

        // ====================================================================
        // 6. ENTIDADE: ALUGUÉIS (/api/alugueis)
        // ====================================================================
        if (pathname === "/api/alugueis") {
            if (req.method === "GET") {
                let lista = db.alugueis.map((a) => {
                    const cli = db.clientes.find((c) => c.id === a.clienteId);
                    const vei = db.veiculos.find((v) => v.id === a.veiculoId);
                    return {
                        ...a,
                        clienteNome: cli ? cli.nome : "N/A",
                        veiculoModelo: vei ? vei.modelo : "N/A"
                    };
                });

                if (query.clienteNome) lista = lista.filter((a) => a.clienteNome.toLowerCase().includes(query.clienteNome.toLowerCase()));
                if (query.veiculoModelo) lista = lista.filter((a) => a.veiculoModelo.toLowerCase().includes(query.veiculoModelo.toLowerCase()));
                if (query.status === "ativo") lista = lista.filter((a) => !a.dataDevolucao);
                if (query.status === "finalizado") lista = lista.filter((a) => Boolean(a.dataDevolucao));
                if (query.valorDiariaMax) lista = lista.filter((a) => a.valorDiaria <= Number(query.valorDiariaMax));

                return responderJson(res, 200, lista);
            }

            if (req.method === "POST") {
                const dto = await lerBodyJson(req);
                const clienteId = Number(dto.clienteId);
                const veiculoId = Number(dto.veiculoId);
                const kmInicial = Number(dto.quilometragemInicial);
                const valorDiaria = Number(dto.valorDiaria);

                if (!db.clientes.some((c) => c.id === clienteId)) return responderErro(res, 400, "Cliente não encontrado.");
                if (!db.veiculos.some((v) => v.id === veiculoId)) return responderErro(res, 400, "Veículo não encontrado.");
                if (!dto.dataInicio || !dto.dataPrevistaFim || dto.dataPrevistaFim < dto.dataInicio) {
                    return responderErro(res, 400, "A data prevista de fim deve ser maior ou igual à data de início.");
                }
                if (valorDiaria <= 0 || kmInicial < 0) {
                    return responderErro(res, 400, "Valor da diária (> 0) e quilometragem inicial (>= 0) inválidos.");
                }

                const novo = {
                    id: proximoId(db.alugueis),
                    dataInicio: dto.dataInicio,
                    dataPrevistaFim: dto.dataPrevistaFim,
                    dataDevolucao: dto.dataDevolucao || null,
                    quilometragemInicial: kmInicial,
                    quilometragemFinal: dto.quilometragemFinal ? Number(dto.quilometragemFinal) : null,
                    valorDiaria,
                    valorTotalLocacao: dto.valorTotalLocacao ? Number(dto.valorTotalLocacao) : null,
                    clienteId,
                    veiculoId
                };
                db.alugueis.push(novo);
                salvarBanco(db);
                return responderJson(res, 201, novo);
            }
        }

        const matchAluguel = pathname.match(/^\/api\/alugueis\/(\d+)$/);
        if (matchAluguel) {
            const id = Number(matchAluguel[1]);
            const idx = db.alugueis.findIndex((a) => a.id === id);
            if (idx === -1) return responderErro(res, 404, "Aluguel não encontrado.");

            if (req.method === "GET") {
                const a = db.alugueis[idx];
                const cli = db.clientes.find((c) => c.id === a.clienteId);
                const vei = db.veiculos.find((v) => v.id === a.veiculoId);
                return responderJson(res, 200, {
                    ...a,
                    clienteNome: cli ? cli.nome : "",
                    veiculoModelo: vei ? vei.modelo : ""
                });
            }

            if (req.method === "PUT") {
                const dto = await lerBodyJson(req);
                const atual = db.alugueis[idx];

                const dataInicio = dto.dataInicio || atual.dataInicio;
                const dataPrevistaFim = dto.dataPrevistaFim || atual.dataPrevistaFim;
                const dataDevolucao = dto.dataDevolucao !== undefined && dto.dataDevolucao !== "" ? dto.dataDevolucao : null;
                const kmInicial = dto.quilometragemInicial !== undefined ? Number(dto.quilometragemInicial) : atual.quilometragemInicial;
                const kmFinal = dto.quilometragemFinal !== undefined && dto.quilometragemFinal !== "" && dto.quilometragemFinal !== null
                    ? Number(dto.quilometragemFinal)
                    : null;
                const valorDiaria = dto.valorDiaria !== undefined ? Number(dto.valorDiaria) : atual.valorDiaria;
                const valorTotal = dto.valorTotalLocacao !== undefined && dto.valorTotalLocacao !== "" && dto.valorTotalLocacao !== null
                    ? Number(dto.valorTotalLocacao)
                    : null;

                if (kmFinal !== null && kmFinal < kmInicial) {
                    return responderErro(res, 400, "A quilometragem final não pode ser menor que a quilometragem inicial.");
                }

                db.alugueis[idx] = {
                    ...atual,
                    clienteId: dto.clienteId ? Number(dto.clienteId) : atual.clienteId,
                    veiculoId: dto.veiculoId ? Number(dto.veiculoId) : atual.veiculoId,
                    dataInicio,
                    dataPrevistaFim,
                    dataDevolucao,
                    quilometragemInicial: kmInicial,
                    quilometragemFinal: kmFinal,
                    valorDiaria,
                    valorTotalLocacao: valorTotal
                };

                if (kmFinal !== null) {
                    const vIdx = db.veiculos.findIndex((v) => v.id === db.alugueis[idx].veiculoId);
                    if (vIdx !== -1 && kmFinal > db.veiculos[vIdx].quilometragemAtual) {
                        db.veiculos[vIdx].quilometragemAtual = kmFinal;
                    }
                }

                salvarBanco(db);
                return responderJson(res, 200, db.alugueis[idx]);
            }

            if (req.method === "DELETE") {
                db.alugueis.splice(idx, 1);
                salvarBanco(db);
                return responderJson(res, 200, { mensagem: "Aluguel excluído com sucesso." });
            }
        }

        // ====================================================================
        // 7. ENTIDADE: PRODUTOS (/api/produtos e /produtos)
        // ====================================================================
        if (pathname === "/api/produtos" || pathname === "/produtos") {
            if (req.method === "GET") {
                let lista = [...db.produtos];
                if (query.nome) lista = lista.filter((p) => p.nome.toLowerCase().includes(query.nome.toLowerCase()));
                if (query.codigo) lista = lista.filter((p) => p.codigo.toLowerCase().includes(query.codigo.toLowerCase()));
                if (query.categoria) lista = lista.filter((p) => p.categoria.toLowerCase().includes(query.categoria.toLowerCase()));
                if (query.precoMax) lista = lista.filter((p) => p.preco <= Number(query.precoMax));
                return responderJson(res, 200, lista);
            }

            if (req.method === "POST") {
                const dto = await lerBodyJson(req);
                if (!dto.nome || !dto.codigo) {
                    return responderErro(res, 400, "Nome e código do produto são obrigatórios.");
                }
                if (db.produtos.some((p) => p.codigo.toLowerCase() === dto.codigo.trim().toLowerCase())) {
                    return responderErro(res, 409, `Já existe um produto com o código '${dto.codigo}'.`);
                }
                const novo = {
                    id: proximoId(db.produtos),
                    nome: dto.nome.trim(),
                    codigo: dto.codigo.trim(),
                    preco: Number(dto.preco || 0),
                    descricao: (dto.descricao || "").trim(),
                    quantidadeEstoque: Number(dto.quantidadeEstoque ?? 0),
                    avaliacao: Number(dto.avaliacao ?? 5),
                    categoria: (dto.categoria || "Geral").trim()
                };
                db.produtos.push(novo);
                salvarBanco(db);
                return responderJson(res, 201, novo);
            }
        }

        const matchProdutoCodigo = pathname.match(/^\/(api\/)?produtos\/codigo\/([^/]+)$/);
        if (matchProdutoCodigo && req.method === "GET") {
            const codigo = decodeURIComponent(matchProdutoCodigo[2]).toLowerCase();
            const prod = db.produtos.find((p) => p.codigo.toLowerCase() === codigo);
            if (!prod) return responderErro(res, 404, "Produto não encontrado para o código informado.");
            return responderJson(res, 200, prod);
        }

        const matchProdutoCategoria = pathname.match(/^\/(api\/)?produtos\/categoria\/([^/]+)$/);
        if (matchProdutoCategoria && req.method === "GET") {
            const cat = decodeURIComponent(matchProdutoCategoria[2]).toLowerCase();
            const lista = db.produtos.filter((p) => p.categoria.toLowerCase().includes(cat));
            return responderJson(res, 200, lista);
        }

        const matchProdutoId = pathname.match(/^\/(api\/)?produtos\/(\d+)$/);
        if (matchProdutoId) {
            const id = Number(matchProdutoId[2]);
            const idx = db.produtos.findIndex((p) => p.id === id);
            if (idx === -1) return responderErro(res, 404, "Produto não encontrado.");

            if (req.method === "GET") return responderJson(res, 200, db.produtos[idx]);

            if (req.method === "PUT" || req.method === "PATCH") {
                const dto = await lerBodyJson(req);
                const atual = db.produtos[idx];
                if (dto.codigo && db.produtos.some((p) => p.id !== id && p.codigo.toLowerCase() === dto.codigo.trim().toLowerCase())) {
                    return responderErro(res, 409, `O código '${dto.codigo}' já está em uso.`);
                }
                db.produtos[idx] = {
                    id,
                    nome: dto.nome !== undefined ? dto.nome.trim() : atual.nome,
                    codigo: dto.codigo !== undefined ? dto.codigo.trim() : atual.codigo,
                    preco: dto.preco !== undefined ? Number(dto.preco) : atual.preco,
                    descricao: dto.descricao !== undefined ? dto.descricao.trim() : atual.descricao,
                    quantidadeEstoque: dto.quantidadeEstoque !== undefined ? Number(dto.quantidadeEstoque) : atual.quantidadeEstoque,
                    avaliacao: dto.avaliacao !== undefined ? Number(dto.avaliacao) : atual.avaliacao,
                    categoria: dto.categoria !== undefined ? dto.categoria.trim() : atual.categoria
                };
                salvarBanco(db);
                return responderJson(res, 200, db.produtos[idx]);
            }

            if (req.method === "DELETE") {
                db.produtos.splice(idx, 1);
                salvarBanco(db);
                return responderJson(res, 200, { mensagem: "Produto removido com sucesso." });
            }
        }

        // ====================================================================
        // 8. ARQUIVOS ESTÁTICOS (pasta frontend/ e recursos de documentação)
        // ====================================================================
        const mimeTypes = {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".js": "application/javascript; charset=utf-8",
            ".svg": "image/svg+xml",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".json": "application/json; charset=utf-8"
        };

        let relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
        if (relativePath.startsWith("frontend/")) {
            relativePath = relativePath.replace(/^frontend\//, "");
        }

        let targetFile = path.join(FRONTEND_DIR, relativePath);
        if (!fs.existsSync(targetFile)) {
            targetFile = path.join(__dirname, pathname.slice(1));
        }

        if (fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
            const ext = path.extname(targetFile).toLowerCase();
            res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
            return res.end(fs.readFileSync(targetFile));
        }

        return responderErro(res, 404, "Rota não encontrada.");
    } catch (erro) {
        return responderErro(res, 500, erro.message || "Erro interno do servidor.");
    }
});

server.listen(PORT, () => {
    console.log(`=============================================================`);
    console.log(`Locadora de Veículos & Produtos - API + Frontend (TP1 & TP2)`);
    console.log(`Frontend: http://localhost:${PORT}`);
    console.log(`API Base: http://localhost:${PORT}/api`);
    console.log(`=============================================================`);
});
