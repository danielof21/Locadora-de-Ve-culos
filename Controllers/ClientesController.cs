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
    public class ClientesController : ControllerBase
    {
        private readonly LocadoraContext _context;

        public ClientesController(LocadoraContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? nome, [FromQuery] string? cpf, [FromQuery] string? email)
        {
            try
            {
                var query = _context.Clientes.AsQueryable();

                if (!string.IsNullOrWhiteSpace(nome))
                    query = query.Where(c => c.Nome.ToLower().Contains(nome.ToLower()));

                if (!string.IsNullOrWhiteSpace(cpf))
                    query = query.Where(c => c.Cpf.Contains(cpf));

                if (!string.IsNullOrWhiteSpace(email))
                    query = query.Where(c => c.Email.ToLower().Contains(email.ToLower()));

                var clientes = await query.OrderBy(c => c.Nome).ToListAsync();
                var dtos = clientes.Select(c => new ClienteReadDto
                {
                    Id = c.Id,
                    Nome = c.Nome,
                    Cpf = c.Cpf,
                    Email = c.Email
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
                var cliente = await _context.Clientes.FindAsync(id);
                if (cliente == null) return NotFound("Cliente não encontrado.");

                var dto = new ClienteReadDto
                {
                    Id = cliente.Id,
                    Nome = cliente.Nome,
                    Cpf = cliente.Cpf,
                    Email = cliente.Email
                };
                return Ok(dto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ClienteCreateDto dto)
        {
            try
            {
                if (await _context.Clientes.AnyAsync(c => c.Cpf == dto.Cpf || c.Email == dto.Email))
                    return Conflict("Já existe um cliente com este CPF ou Email.");

                var cliente = new Cliente
                {
                    Nome = dto.Nome,
                    Cpf = dto.Cpf,
                    Email = dto.Email
                };

                _context.Clientes.Add(cliente);
                await _context.SaveChangesAsync();

                var readDto = new ClienteReadDto
                {
                    Id = cliente.Id,
                    Nome = cliente.Nome,
                    Cpf = cliente.Cpf,
                    Email = cliente.Email
                };

                return CreatedAtAction(nameof(GetById), new { id = cliente.Id }, readDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ClienteCreateDto dto)
        {
            try
            {
                var cliente = await _context.Clientes.FindAsync(id);
                if (cliente == null) return NotFound("Cliente não encontrado.");

                if (await _context.Clientes.AnyAsync(c => c.Id != id && (c.Cpf == dto.Cpf || c.Email == dto.Email)))
                    return Conflict("Já existe outro cliente com este CPF ou Email.");

                cliente.Nome = dto.Nome;
                cliente.Cpf = dto.Cpf;
                cliente.Email = dto.Email;

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
                var cliente = await _context.Clientes.Include(c => c.Alugueis).FirstOrDefaultAsync(c => c.Id == id);
                if (cliente == null) return NotFound("Cliente não encontrado.");

                if (cliente.Alugueis != null && cliente.Alugueis.Any())
                    return BadRequest("Não é possível excluir um cliente que possui aluguéis.");

                _context.Clientes.Remove(cliente);
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
