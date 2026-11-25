# Roteiro do Vídeo Pitch (3 a 5 Minutos) e Guia de Entrega (TP2)

Este guia contém o roteiro cronometrado exato para você gravar o **Vídeo Pitch de 3 a 5 minutos** exigido na rubrica (2,0 pts) e as instruções para o **Figma (Wireframes - 1,0 pt)** e o **Artigo SBC**.

---

## 1. Como Gerar o Link do Figma em 30 Segundos (Critério: Wireframes - 1,0 pt)

1. Acesse [https://www.figma.com](https://www.figma.com) e crie um novo arquivo de design (**New Design File**).
2. Abra a pasta `docs/wireframes/` deste projeto no Windows Explorer e **arraste o arquivo `wireframes_sistema.svg`** para dentro da tela do Figma.
   - O Figma converterá automaticamente o arquivo SVG em camadas editáveis!
3. Se quiser também colocar os prints de média fidelidade (tons de cinza) e alta fidelidade (colorido), abra `http://localhost:5000/wireframes.html` e clique no botão **"Alternar: Tons de Cinza / Colorido"**.
4. No Figma, clique em **Share** (canto superior direito) -> **Anyone with the link can view** -> **Copy link** e cole esse link no seu artigo SBC (`docs/artigo_sbc_tp2.tex`).

---

## 2. Roteiro Cronometrado do Vídeo Pitch (3 a 5 Minutos — Critério: 2,0 pts)

> **Requisito da Observação:** *"A apresentação deverá ter duração entre 3 e 5 minutos (pitch), abordando apenas o problema, a modelagem adotada e pelo menos dois exemplos de consultas (banco e rota) e seus resultados no front-end."*

### [00:00 – 00:45] 1. Abertura e O Problema (Estilo Pitch)
- **Tela aberta:** Aba **"Visão Geral & Modelagem"** (`http://localhost:5000`).
- **O que falar:**
  > *"Olá! Locadoras de veículos que controlam sua frota em planilhas ou sistemas desconectados enfrentam um problema crítico: alugar um veículo que já está locado, perder o histórico de quilometragem na devolução ou não saber quais categorias e fabricantes geram maior demanda. Para resolver esse problema com integridade transacional, desenvolvemos o Sistema Integrado de Gestão de Locadora de Veículos, conectando nosso Front-end Web à API RESTful e ao banco de dados relacional projetados no Trabalho Prático 1."*

### [00:45 – 01:40] 2. A Modelagem Adotada e os Wireframes
- **Tela aberta:** Mostre o **Diagrama do Modelo Conceitual (`modelo_conceitual.jpg`)** na aba *Visão Geral* e clique rapidamente no menu **"Wireframes"** (`wireframes.html`), alternando entre *Tons de Cinza* e *Colorido*.
- **O que falar:**
  > *"Nossa modelagem relacional foi construída com cinco entidades centrais da locadora — Clientes, Fabricantes, Categorias, Veículos e Aluguéis — além do módulo de Produtos. Garantimos integridade referencial com restrição de exclusão em cascata (DeleteBehavior.Restrict), índices únicos para CPF, E-mail e Nomes, e Check Constraints para validar datas, valores de diárias e quilometragem. Antes da codificação, projetamos os wireframes em tons de cinza e em alta fidelidade para padronizar os fluxos de cadastro, edição, exclusão e filtros."*

### [01:40 – 02:50] 3. Demonstração do CRUD e Filtros Personalizados (>= 2 campos por entidade)
- **Tela aberta:** Clique nas abas **Clientes**, **Fabricantes**, **Categorias**, **Veículos** e **Aluguéis**.
- **O que fazer e falar:**
  1. Em **Veículos**, filtre simultaneamente por **Fabricante = Toyota** e **Ano Mínimo = 2024** e clique em **Pesquisar** (mostrando a pesquisa com múltiplos campos).
  2. Clique em **+ Novo Veículo** (ou em **Editar** em um registro), mostre o modal preenchido com os *selects* dinâmicos vindos do banco e salve.
  3. Em **Aluguéis**, mostre que é possível filtrar por **Cliente**, **Veículo**, **Status (Ativo/Finalizado)** e **Diária Máxima**, além de registrar a devolução atualizando automaticamente a quilometragem do veículo.

### [02:50 – 04:20] 4. Dois Exemplos de Consultas (Banco e Rota) e Resultados no Front-end
- **Tela aberta:** Clique na aba **"Consultas & Visualizações (Etapa 3)"**.
- **Exemplo de Consulta 1 (`GET /api/filtros/veiculos-disponiveis`):**
  - Aponte para o quadro escuro de SQL e para a badge azul da rota `GET /api/filtros/veiculos-disponiveis`.
  - **O que falar:**
    > *"O primeiro exemplo de consulta da terceira etapa é a rota `GET /api/filtros/veiculos-disponiveis`. No banco de dados, ela executa um `INNER JOIN` entre Veículos, Categorias e Fabricantes combinado com um `LEFT JOIN` na tabela de Aluguéis ativos (`DataDevolucao IS NULL`), retornando apenas os veículos onde não há locação em aberto. Aqui no front-end, ao selecionar a categoria 'SUV Compacto' e o ano mínimo '2024' e clicar em Consultar, o resultado é atualizado instantaneamente na tabela."*
- **Exemplo de Consulta 2 (`GET /api/filtros/fabricantes-com-veiculos` e `GET /api/filtros/alugueis-por-cliente`):**
  - Digite `"Daniel"` no campo da **Consulta 2 (`GET /api/filtros/alugueis-por-cliente`)** e clique em **Consultar**, e aponte também para o gráfico de barras da **Consulta 4 (`GET /api/filtros/fabricantes-com-veiculos`)**.
  - **O que falar:**
    > *"O segundo exemplo utiliza a rota `GET /api/filtros/alugueis-por-cliente`, que faz um `INNER JOIN` triplo entre Aluguéis, Clientes e Veículos filtrando pelo nome do cliente, e a rota `GET /api/filtros/fabricantes-com-veiculos`, que executa um `LEFT JOIN` com `GROUP BY` no banco para contabilizar quantos veículos cada fabricante possui — inclusive exibindo fabricantes com zero veículos no gráfico de barras do front-end."*

### [04:20 – 04:45] 5. Encerramento
- **O que falar:**
  > *"Com isso, todos os artefatos do Trabalho Prático 1 foram integrados ao front-end na pasta `frontend/`, com CRUD completo, filtros personalizados por entidade e visualizações analíticas em tempo real. Muito obrigado!"*
