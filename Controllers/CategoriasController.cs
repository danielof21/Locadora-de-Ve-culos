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
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriasController : ControllerBase
    {
        private readonly LocadoraContext _context;

        public CategoriasController(LocadoraContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var categorias = await _context.Categorias.ToListAsync();
                var dtos = categorias.Select(c => new CategoriaReadDto
                {
                    Id = c.Id,
                    Nome = c.Nome,
                    Descricao = c.Descricao
                });
                return Ok(dtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var categoria = await _context.Categorias.FindAsync(id);
                if (categoria == null) return NotFound("Categoria não encontrada.");

                var dto = new CategoriaReadDto
                {
                    Id = categoria.Id,
                    Nome = categoria.Nome,
                    Descricao = categoria.Descricao
                };
                return Ok(dto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CategoriaCreateDto dto)
        {
            try
            {
                if (await _context.Categorias.AnyAsync(c => c.Nome == dto.Nome))
                    return Conflict("Já existe uma categoria com este nome.");

                var categoria = new Categoria
                {
                    Nome = dto.Nome,
                    Descricao = dto.Descricao
                };

                _context.Categorias.Add(categoria);
                await _context.SaveChangesAsync();

                var readDto = new CategoriaReadDto
                {
                    Id = categoria.Id,
                    Nome = categoria.Nome,
                    Descricao = categoria.Descricao
                };

                return CreatedAtAction(nameof(GetById), new { id = categoria.Id }, readDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CategoriaCreateDto dto)
        {
            try
            {
                var categoria = await _context.Categorias.FindAsync(id);
                if (categoria == null) return NotFound("Categoria não encontrada.");

                if (await _context.Categorias.AnyAsync(c => c.Id != id && c.Nome == dto.Nome))
                    return Conflict("Já existe outra categoria com este nome.");

                categoria.Nome = dto.Nome;
                categoria.Descricao = dto.Descricao;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var categoria = await _context.Categorias.Include(c => c.Veiculos).FirstOrDefaultAsync(c => c.Id == id);
                if (categoria == null) return NotFound("Categoria não encontrada.");

                if (categoria.Veiculos != null && categoria.Veiculos.Any())
                    return BadRequest("Não é possível excluir uma categoria que possui veículos associados.");

                _context.Categorias.Remove(categoria);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }
    }
}
