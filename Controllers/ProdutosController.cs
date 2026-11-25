using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Locadora.Data;
using Locadora.Entities;
using Locadora.DTOs;

namespace Locadora.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Route("produtos")]
    public class ProdutosController : ControllerBase
    {
        private readonly LocadoraContext _context;

        public ProdutosController(LocadoraContext context)
        {
            _context = context;
        }

        // 1. GET: Leitura de todos os dados do banco com filtros personalizados
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? nome,
            [FromQuery] string? codigo,
            [FromQuery] string? categoria,
            [FromQuery] decimal? precoMax)
        {
            try
            {
                var query = _context.Produtos.AsQueryable();

                if (!string.IsNullOrWhiteSpace(nome))
                    query = query.Where(p => p.Nome.ToLower().Contains(nome.ToLower()));

                if (!string.IsNullOrWhiteSpace(codigo))
                    query = query.Where(p => p.Codigo.ToLower().Contains(codigo.ToLower()));

                if (!string.IsNullOrWhiteSpace(categoria))
                    query = query.Where(p => p.Categoria.ToLower().Contains(categoria.ToLower()));

                if (precoMax.HasValue)
                    query = query.Where(p => p.Preco <= precoMax.Value);

                var produtos = await query.OrderBy(p => p.Nome).ToListAsync();
                var dtos = produtos.Select(p => new ProdutoReadDto
                {
                    Id = p.Id,
                    Nome = p.Nome,
                    Codigo = p.Codigo,
                    Preco = p.Preco,
                    Descricao = p.Descricao,
                    QuantidadeEstoque = p.QuantidadeEstoque,
                    Avaliacao = p.Avaliacao,
                    Categoria = p.Categoria
                });
                return Ok(dtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }

        // 2. GET: Leitura por ID
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var p = await _context.Produtos.FindAsync(id);
                if (p == null) return NotFound(new { mensagem = "Produto não encontrado." });

                var dto = new ProdutoReadDto
                {
                    Id = p.Id,
                    Nome = p.Nome,
                    Codigo = p.Codigo,
                    Preco = p.Preco,
                    Descricao = p.Descricao,
                    QuantidadeEstoque = p.QuantidadeEstoque,
                    Avaliacao = p.Avaliacao,
                    Categoria = p.Categoria
                };
                return Ok(dto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }

        // 3. GET: Leitura de dados por código do produto com Get
        [HttpGet("codigo/{codigo}")]
        public async Task<IActionResult> GetByCodigo(string codigo)
        {
            try
            {
                var p = await _context.Produtos.FirstOrDefaultAsync(prod => prod.Codigo.ToLower() == codigo.ToLower());
                if (p == null) return NotFound(new { mensagem = $"Produto com código '{codigo}' não encontrado." });

                var dto = new ProdutoReadDto
                {
                    Id = p.Id,
                    Nome = p.Nome,
                    Codigo = p.Codigo,
                    Preco = p.Preco,
                    Descricao = p.Descricao,
                    QuantidadeEstoque = p.QuantidadeEstoque,
                    Avaliacao = p.Avaliacao,
                    Categoria = p.Categoria
                };
                return Ok(dto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }

        // 4. GET: Leitura de dados por categoria com Get
        [HttpGet("categoria/{categoria}")]
        public async Task<IActionResult> GetByCategoria(string categoria)
        {
            try
            {
                var produtos = await _context.Produtos
                    .Where(p => p.Categoria.ToLower() == categoria.ToLower())
                    .ToListAsync();

                var dtos = produtos.Select(p => new ProdutoReadDto
                {
                    Id = p.Id,
                    Nome = p.Nome,
                    Codigo = p.Codigo,
                    Preco = p.Preco,
                    Descricao = p.Descricao,
                    QuantidadeEstoque = p.QuantidadeEstoque,
                    Avaliacao = p.Avaliacao,
                    Categoria = p.Categoria
                });
                return Ok(dtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }

        // 5. POST: Criação de dados com Post
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ProdutoCreateDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Nome))
                    return BadRequest(new { mensagem = "O nome do produto é obrigatório." });

                if (string.IsNullOrWhiteSpace(dto.Codigo))
                    return BadRequest(new { mensagem = "O código do produto é obrigatório." });

                if (await _context.Produtos.AnyAsync(p => p.Codigo == dto.Codigo))
                    return Conflict(new { mensagem = $"Já existe um produto com o código '{dto.Codigo}'." });

                var produto = new Produto
                {
                    Nome = dto.Nome,
                    Codigo = dto.Codigo,
                    Preco = dto.Preco,
                    Descricao = dto.Descricao,
                    QuantidadeEstoque = dto.QuantidadeEstoque,
                    Avaliacao = dto.Avaliacao,
                    Categoria = dto.Categoria
                };

                _context.Produtos.Add(produto);
                await _context.SaveChangesAsync();

                var readDto = new ProdutoReadDto
                {
                    Id = produto.Id,
                    Nome = produto.Nome,
                    Codigo = produto.Codigo,
                    Preco = produto.Preco,
                    Descricao = produto.Descricao,
                    QuantidadeEstoque = produto.QuantidadeEstoque,
                    Avaliacao = produto.Avaliacao,
                    Categoria = produto.Categoria
                };

                return CreatedAtAction(nameof(GetById), new { id = produto.Id }, readDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }

        // 6. PUT: Atualização completa de informações com Put
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] ProdutoCreateDto dto)
        {
            try
            {
                var produto = await _context.Produtos.FindAsync(id);
                if (produto == null) return NotFound(new { mensagem = "Produto não encontrado." });

                if (await _context.Produtos.AnyAsync(p => p.Id != id && p.Codigo == dto.Codigo))
                    return Conflict(new { mensagem = $"O código '{dto.Codigo}' já está em uso por outro produto." });

                produto.Nome = dto.Nome;
                produto.Codigo = dto.Codigo;
                produto.Preco = dto.Preco;
                produto.Descricao = dto.Descricao;
                produto.QuantidadeEstoque = dto.QuantidadeEstoque;
                produto.Avaliacao = dto.Avaliacao;
                produto.Categoria = dto.Categoria;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }

        // 7. PATCH: Atualização parcial de informações com Patch
        [HttpPatch("{id:int}")]
        public async Task<IActionResult> Patch(int id, [FromBody] ProdutoUpdateDto dto)
        {
            try
            {
                var produto = await _context.Produtos.FindAsync(id);
                if (produto == null) return NotFound(new { mensagem = "Produto não encontrado." });

                if (dto.Codigo != null && await _context.Produtos.AnyAsync(p => p.Id != id && p.Codigo == dto.Codigo))
                    return Conflict(new { mensagem = $"O código '{dto.Codigo}' já está em uso por outro produto." });

                if (dto.Nome != null) produto.Nome = dto.Nome;
                if (dto.Codigo != null) produto.Codigo = dto.Codigo;
                if (dto.Preco.HasValue) produto.Preco = dto.Preco.Value;
                if (dto.Descricao != null) produto.Descricao = dto.Descricao;
                if (dto.QuantidadeEstoque.HasValue) produto.QuantidadeEstoque = dto.QuantidadeEstoque.Value;
                if (dto.Avaliacao.HasValue) produto.Avaliacao = dto.Avaliacao.Value;
                if (dto.Categoria != null) produto.Categoria = dto.Categoria;

                await _context.SaveChangesAsync();

                return Ok(new ProdutoReadDto
                {
                    Id = produto.Id,
                    Nome = produto.Nome,
                    Codigo = produto.Codigo,
                    Preco = produto.Preco,
                    Descricao = produto.Descricao,
                    QuantidadeEstoque = produto.QuantidadeEstoque,
                    Avaliacao = produto.Avaliacao,
                    Categoria = produto.Categoria
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }

        // 8. DELETE: Exclusão de elementos com Delete
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var produto = await _context.Produtos.FindAsync(id);
                if (produto == null) return NotFound(new { mensagem = "Produto não encontrado." });

                _context.Produtos.Remove(produto);
                await _context.SaveChangesAsync();

                return Ok(new { mensagem = $"Produto '{produto.Nome}' (ID: {id}) removido com sucesso." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }
    }
}
