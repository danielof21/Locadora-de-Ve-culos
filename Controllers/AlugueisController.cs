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
    public class AlugueisController : ControllerBase
    {
        private readonly LocadoraContext _context;

        public AlugueisController(LocadoraContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var alugueis = await _context.Alugueis
                    .Include(a => a.Cliente)
                    .Include(a => a.Veiculo)
                    .ToListAsync();

                var dtos = alugueis.Select(a => new AluguelReadDto
                {
                    Id = a.Id,
                    DataInicio = a.DataInicio,
                    DataPrevistaFim = a.DataPrevistaFim,
                    DataDevolucao = a.DataDevolucao,
                    QuilometragemInicial = a.QuilometragemInicial,
                    QuilometragemFinal = a.QuilometragemFinal,
                    ValorDiaria = a.ValorDiaria,
                    ValorTotalLocacao = a.ValorTotalLocacao,
                    ClienteId = a.ClienteId,
                    ClienteNome = a.Cliente?.Nome,
                    VeiculoId = a.VeiculoId,
                    VeiculoModelo = a.Veiculo?.Modelo
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
                var aluguel = await _context.Alugueis
                    .Include(a => a.Cliente)
                    .Include(a => a.Veiculo)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (aluguel == null) return NotFound("Aluguel não encontrado.");

                var dto = new AluguelReadDto
                {
                    Id = aluguel.Id,
                    DataInicio = aluguel.DataInicio,
                    DataPrevistaFim = aluguel.DataPrevistaFim,
                    DataDevolucao = aluguel.DataDevolucao,
                    QuilometragemInicial = aluguel.QuilometragemInicial,
                    QuilometragemFinal = aluguel.QuilometragemFinal,
                    ValorDiaria = aluguel.ValorDiaria,
                    ValorTotalLocacao = aluguel.ValorTotalLocacao,
                    ClienteId = aluguel.ClienteId,
                    ClienteNome = aluguel.Cliente?.Nome,
                    VeiculoId = aluguel.VeiculoId,
                    VeiculoModelo = aluguel.Veiculo?.Modelo
                };
                return Ok(dto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] AluguelCreateDto dto)
        {
            try
            {
                if (!await _context.Clientes.AnyAsync(c => c.Id == dto.ClienteId))
                    return BadRequest("Cliente não encontrado.");

                if (!await _context.Veiculos.AnyAsync(v => v.Id == dto.VeiculoId))
                    return BadRequest("Veículo não encontrado.");

                var aluguel = new Aluguel
                {
                    DataInicio = dto.DataInicio,
                    DataPrevistaFim = dto.DataPrevistaFim,
                    QuilometragemInicial = dto.QuilometragemInicial,
                    ValorDiaria = dto.ValorDiaria,
                    ClienteId = dto.ClienteId,
                    VeiculoId = dto.VeiculoId
                };

                _context.Alugueis.Add(aluguel);
                await _context.SaveChangesAsync();

                var readDto = new AluguelReadDto
                {
                    Id = aluguel.Id,
                    DataInicio = aluguel.DataInicio,
                    DataPrevistaFim = aluguel.DataPrevistaFim,
                    QuilometragemInicial = aluguel.QuilometragemInicial,
                    ValorDiaria = aluguel.ValorDiaria,
                    ClienteId = aluguel.ClienteId,
                    VeiculoId = aluguel.VeiculoId
                };

                return CreatedAtAction(nameof(GetById), new { id = aluguel.Id }, readDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] AluguelUpdateDto dto)
        {
            try
            {
                var aluguel = await _context.Alugueis.FindAsync(id);
                if (aluguel == null) return NotFound("Aluguel não encontrado.");

                aluguel.DataDevolucao = dto.DataDevolucao;
                aluguel.QuilometragemFinal = dto.QuilometragemFinal;
                aluguel.ValorTotalLocacao = dto.ValorTotalLocacao;

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
                var aluguel = await _context.Alugueis.FindAsync(id);
                if (aluguel == null) return NotFound("Aluguel não encontrado.");

                _context.Alugueis.Remove(aluguel);
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
