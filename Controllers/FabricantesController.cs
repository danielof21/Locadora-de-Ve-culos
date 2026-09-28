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
    public class FabricantesController : ControllerBase
    {
        private readonly LocadoraContext _context;

        public FabricantesController(LocadoraContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var fabricantes = await _context.Fabricantes.ToListAsync();
                var dtos = fabricantes.Select(f => new FabricanteReadDto
                {
                    Id = f.Id,
                    Nome = f.Nome
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
                var fabricante = await _context.Fabricantes.FindAsync(id);
                if (fabricante == null) return NotFound("Fabricante não encontrado.");

                var dto = new FabricanteReadDto
                {
                    Id = fabricante.Id,
                    Nome = fabricante.Nome
                };
                return Ok(dto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] FabricanteCreateDto dto)
        {
            try
            {
                if (await _context.Fabricantes.AnyAsync(f => f.Nome == dto.Nome))
                    return Conflict("Já existe um fabricante com este nome.");

                var fabricante = new Fabricante
                {
                    Nome = dto.Nome
                };

                _context.Fabricantes.Add(fabricante);
                await _context.SaveChangesAsync();

                var readDto = new FabricanteReadDto
                {
                    Id = fabricante.Id,
                    Nome = fabricante.Nome
                };

                return CreatedAtAction(nameof(GetById), new { id = fabricante.Id }, readDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] FabricanteCreateDto dto)
        {
            try
            {
                var fabricante = await _context.Fabricantes.FindAsync(id);
                if (fabricante == null) return NotFound("Fabricante não encontrado.");

                if (await _context.Fabricantes.AnyAsync(f => f.Id != id && f.Nome == dto.Nome))
                    return Conflict("Já existe outro fabricante com este nome.");

                fabricante.Nome = dto.Nome;

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
                var fabricante = await _context.Fabricantes.Include(f => f.Veiculos).FirstOrDefaultAsync(f => f.Id == id);
                if (fabricante == null) return NotFound("Fabricante não encontrado.");

                if (fabricante.Veiculos != null && fabricante.Veiculos.Any())
                    return BadRequest("Não é possível excluir um fabricante que possui veículos associados.");

                _context.Fabricantes.Remove(fabricante);
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
