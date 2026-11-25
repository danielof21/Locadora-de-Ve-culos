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
    public class VeiculosController : ControllerBase
    {
        private readonly LocadoraContext _context;

        public VeiculosController(LocadoraContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? modelo,
            [FromQuery] int? fabricanteId,
            [FromQuery] int? categoriaId,
            [FromQuery] int? anoMinimo,
            [FromQuery] int? kmMaxima)
        {
            try
            {
                var query = _context.Veiculos
                    .Include(v => v.Fabricante)
                    .Include(v => v.Categoria)
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(modelo))
                    query = query.Where(v => v.Modelo.ToLower().Contains(modelo.ToLower()));

                if (fabricanteId.HasValue)
                    query = query.Where(v => v.FabricanteId == fabricanteId.Value);

                if (categoriaId.HasValue)
                    query = query.Where(v => v.CategoriaId == categoriaId.Value);

                if (anoMinimo.HasValue)
                    query = query.Where(v => v.AnoFabricacao >= anoMinimo.Value);

                if (kmMaxima.HasValue)
                    query = query.Where(v => v.QuilometragemAtual <= kmMaxima.Value);

                var veiculos = await query.OrderBy(v => v.Modelo).ToListAsync();

                var dtos = veiculos.Select(v => new VeiculoReadDto
                {
                    Id = v.Id,
                    Modelo = v.Modelo,
                    AnoFabricacao = v.AnoFabricacao,
                    QuilometragemAtual = v.QuilometragemAtual,
                    FabricanteId = v.FabricanteId,
                    FabricanteNome = v.Fabricante?.Nome ?? string.Empty,
                    CategoriaId = v.CategoriaId,
                    CategoriaNome = v.Categoria?.Nome ?? string.Empty
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
                var veiculo = await _context.Veiculos
                    .Include(v => v.Fabricante)
                    .Include(v => v.Categoria)
                    .FirstOrDefaultAsync(v => v.Id == id);

                if (veiculo == null) return NotFound("Veículo não encontrado.");

                var dto = new VeiculoReadDto
                {
                    Id = veiculo.Id,
                    Modelo = veiculo.Modelo,
                    AnoFabricacao = veiculo.AnoFabricacao,
                    QuilometragemAtual = veiculo.QuilometragemAtual,
                    FabricanteId = veiculo.FabricanteId,
                    FabricanteNome = veiculo.Fabricante?.Nome ?? string.Empty,
                    CategoriaId = veiculo.CategoriaId,
                    CategoriaNome = veiculo.Categoria?.Nome ?? string.Empty
                };
                return Ok(dto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] VeiculoCreateDto dto)
        {
            try
            {
                if (!await _context.Fabricantes.AnyAsync(f => f.Id == dto.FabricanteId))
                    return BadRequest("Fabricante não encontrado.");

                if (!await _context.Categorias.AnyAsync(c => c.Id == dto.CategoriaId))
                    return BadRequest("Categoria não encontrada.");

                var veiculo = new Veiculo
                {
                    Modelo = dto.Modelo,
                    AnoFabricacao = dto.AnoFabricacao,
                    QuilometragemAtual = dto.QuilometragemAtual,
                    FabricanteId = dto.FabricanteId,
                    CategoriaId = dto.CategoriaId
                };

                _context.Veiculos.Add(veiculo);
                await _context.SaveChangesAsync();

                var readDto = new VeiculoReadDto
                {
                    Id = veiculo.Id,
                    Modelo = veiculo.Modelo,
                    AnoFabricacao = veiculo.AnoFabricacao,
                    QuilometragemAtual = veiculo.QuilometragemAtual,
                    FabricanteId = veiculo.FabricanteId,
                    CategoriaId = veiculo.CategoriaId
                };

                return CreatedAtAction(nameof(GetById), new { id = veiculo.Id }, readDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] VeiculoCreateDto dto)
        {
            try
            {
                var veiculo = await _context.Veiculos.FindAsync(id);
                if (veiculo == null) return NotFound("Veículo não encontrado.");

                if (!await _context.Fabricantes.AnyAsync(f => f.Id == dto.FabricanteId))
                    return BadRequest("Fabricante não encontrado.");

                if (!await _context.Categorias.AnyAsync(c => c.Id == dto.CategoriaId))
                    return BadRequest("Categoria não encontrada.");

                veiculo.Modelo = dto.Modelo;
                veiculo.AnoFabricacao = dto.AnoFabricacao;
                veiculo.QuilometragemAtual = dto.QuilometragemAtual;
                veiculo.FabricanteId = dto.FabricanteId;
                veiculo.CategoriaId = dto.CategoriaId;

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
                var veiculo = await _context.Veiculos.Include(v => v.Alugueis).FirstOrDefaultAsync(v => v.Id == id);
                if (veiculo == null) return NotFound("Veículo não encontrado.");

                if (veiculo.Alugueis != null && veiculo.Alugueis.Any())
                    return BadRequest("Não é possível excluir um veículo que possui aluguéis associados.");

                _context.Veiculos.Remove(veiculo);
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
