# Sistema de Gestão de Locadora de Veículos & Produtos (TP1 e TP2)

Repositório unificado contendo o **Back-end RESTful e Modelagem de Banco de Dados (Trabalho Prático 1)** e o **Front-end Web Integrado, Wireframes e Painel de Consultas/Visualizações (Trabalho Prático 2)**.

---

## 📁 Estrutura do Repositório

```text
├── Controllers/                # Controllers RESTful C# ASP.NET Core (TP1 + Filtros Multi-Campo)
│   ├── AlugueisController.cs   # CRUD + Devolução + 4 filtros personalizados
│   ├── CategoriasController.cs # CRUD + 2 filtros personalizados (Nome, Descrição)
│   ├── ClientesController.cs   # CRUD + 3 filtros personalizados (Nome, CPF, E-mail)
│   ├── FabricantesController.cs# CRUD + 3 filtros personalizados (Nome, ID, Vínculo Frota)
│   ├── FiltrosController.cs    # 5 Rotas da 3ª Etapa (INNER JOIN, LEFT JOIN e GROUP BY)
│   ├── ProdutosController.cs   # CRUD + 4 filtros personalizados (Nome, Código, Categoria, Preço)
│   └── VeiculosController.cs   # CRUD + 5 filtros personalizados (Modelo, Fab, Cat, Ano, KM)
├── Data/
│   └── LocadoraContext.cs      # Contexto EF Core, chaves, índices únicos e Check Constraints
├── DTOs/                       # Data Transfer Objects com validações (DataAnnotations)
├── Entities/                   # Entidades de domínio (Cliente, Fabricante, Categoria, Veiculo, Aluguel, Produto)
├── Migrations/                 # Migrations do Entity Framework Core (SQL Server)
├── frontend/                   # Pasta específica do Front-end (Trabalho Prático 2)
│   ├── index.html              # SPA com Dashboard, Consultas (Etapa 3) e CRUD de todas as entidades
│   ├── wireframes.html         # Wireframes interativos (Tons de Cinza e Colorido Alta Fidelidade)
│   ├── style.css               # Estilização customizada com Bootstrap 5
│   └── app.js                  # Integração Fetch API (GET, POST, PUT, DELETE e Query Params)
├── docs/                       # Artefatos de Documentação do TP2
│   ├── wireframes/
│   │   └── wireframes_sistema.svg # Wireframe vetorial importável diretamente no Figma
│   ├── artigo_sbc_tp2.tex      # Artigo acadêmico completo no template oficial da SBC (Overleaf/LaTeX)
│   └── ROTEIRO_PITCH_E_ENTREGA.md # Roteiro cronometrado do vídeo Pitch (3 a 5 min)
├── db/
│   └── locadora_db.json        # Persistência JSON local para execução imediata via Node.js
├── modelo_conceitual.jpg       # Diagrama do Modelo Conceitual do Banco de Dados (TP1)
├── Program.cs                  # Inicialização ASP.NET Core + CORS + Seed + Static Files
└── server.js                   # Servidor espelho Node.js com todas as rotas da API e Front-end
```

---

## 🚀 Como Executar o Projeto

### Opção 1: Execução Imediata com Node.js (API Completa + Front-end na porta 5000)
```bash
node server.js
```
Acesse no navegador:
- **Sistema Completo (Front-end):** [http://localhost:5000](http://localhost:5000)
- **Wireframes (Tons de Cinza / Colorido):** [http://localhost:5000/wireframes.html](http://localhost:5000/wireframes.html)

### Opção 2: Execução via .NET SDK + SQL Server
```bash
dotnet run
```
(O `Program.cs` também serve automaticamente a pasta `frontend/` e o Swagger em `/swagger`).

---

## 🔗 Rotas da API Utilizadas pelo Front-end

### 1. Entidades (CRUD + Filtros Personalizados em $\ge 2$ Campos)
| Entidade | Rota Base | Métodos | Filtros Personalizados (`Query Params`) |
| :--- | :--- | :--- | :--- |
| **Clientes** | `/api/clientes` | `GET, POST, PUT, DELETE` | `?nome=&cpf=&email=` (3 campos) |
| **Fabricantes** | `/api/fabricantes` | `GET, POST, PUT, DELETE` | `?nome=&id=&possuiVeiculos=` (3 campos) |
| **Categorias** | `/api/categorias` | `GET, POST, PUT, DELETE` | `?nome=&descricao=` (2 campos) |
| **Veículos** | `/api/veiculos` | `GET, POST, PUT, DELETE` | `?modelo=&fabricanteId=&categoriaId=&anoMinimo=&kmMaxima=` (5 campos) |
| **Aluguéis** | `/api/alugueis` | `GET, POST, PUT, DELETE` | `?clienteNome=&veiculoModelo=&status=&valorDiariaMax=` (4 campos) |
| **Produtos** | `/api/produtos` | `GET, POST, PUT, DELETE` | `?nome=&codigo=&categoria=&precoMax=` (4 campos) |

### 2. Rotas de Consultas Avançadas da 3ª Etapa (`FiltrosController`)
1. `GET /api/filtros/veiculos-disponiveis?categoriaId=&anoMinimo=` (`INNER JOIN` + `LEFT JOIN` verificando locações em aberto)
2. `GET /api/filtros/alugueis-por-cliente?clienteNome=` (`INNER JOIN` entre `Alugueis`, `Clientes` e `Veiculos`)
3. `GET /api/filtros/veiculos-por-fabricante?fabricanteNome=` (`INNER JOIN` entre `Veiculos`, `Fabricantes` e `Categorias`)
4. `GET /api/filtros/fabricantes-com-veiculos` (`LEFT JOIN` + `GROUP BY` contabilizando veículos por fabricante)
5. `GET /api/filtros/clientes-com-alugueis-ativos` (`LEFT JOIN` + `GROUP BY` contabilizando aluguéis ativos por cliente)
