using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Locadora.Data;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Locadora.Controllers
{
    [ApiController]
    [Route("api/filtros")]
    public class FiltrosController : ControllerBase
    {
        private readonly LocadoraContext _context;

        public FiltrosController(LocadoraContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Filtra veículos por nome do fabricante.
        /// </summary>
        [HttpGet("veiculos-por-fabricante")]
        public async Task<IActionResult> GetVeiculosPorFabricante([FromQuery] string fabricanteNome)
        {
            try
            {
                var query = from v in _context.Veiculos
                            // INNER JOIN
                            join f in _context.Fabricantes on v.FabricanteId equals f.Id
                            // INNER JOIN
                            join c in _context.Categorias on v.CategoriaId equals c.Id
                            where string.IsNullOrEmpty(fabricanteNome) || f.Nome.ToLower().Contains(fabricanteNome.ToLower())
                            select new
                            {
                                v.Id,
                                v.Modelo,
                                v.AnoFabricacao,
                                v.QuilometragemAtual,
                                FabricanteNome = f.Nome,
                                CategoriaNome = c.Nome
                            };

                var result = await query.ToListAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro interno do servidor.", detail = ex.Message });
            }
        }

        /// <summary>
        /// Filtra aluguéis por nome do cliente.
        /// </summary>
        [HttpGet("alugueis-por-cliente")]
        public async Task<IActionResult> GetAlugueisPorCliente([FromQuery] string clienteNome)
        {
            try
            {
                var query = from a in _context.Alugueis
                            // INNER JOIN
                            join c in _context.Clientes on a.ClienteId equals c.Id
                            // INNER JOIN
                            join v in _context.Veiculos on a.VeiculoId equals v.Id
                            where string.IsNullOrEmpty(clienteNome) || c.Nome.ToLower().Contains(clienteNome.ToLower())
                            select new
                            {
                                AluguelId = a.Id,
                                a.DataInicio,
                                a.DataPrevistaFim,
                                a.DataDevolucao,
                                a.ValorDiaria,
                                ClienteNome = c.Nome,
                                VeiculoModelo = v.Modelo
                            };

                var result = await query.ToListAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro interno do servidor.", detail = ex.Message });
            }
        }

        /// <summary>
        /// Retorna todos os fabricantes e a quantidade de veículos que possuem.
        /// </summary>
        [HttpGet("fabricantes-com-veiculos")]
        public async Task<IActionResult> GetFabricantesComVeiculos()
        {
            try
            {
                var query = from f in _context.Fabricantes
                            // LEFT JOIN
                            join v in _context.Veiculos on f.Id equals v.FabricanteId into veiculosGroup
                            from vg in veiculosGroup.DefaultIfEmpty()
                            group vg by new { f.Id, f.Nome } into g
                            select new
                            {
                                FabricanteId = g.Key.Id,
                                FabricanteNome = g.Key.Nome,
                                QuantidadeVeiculos = g.Count(x => x != null)
                            };

                var result = await query.ToListAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro interno do servidor.", detail = ex.Message });
            }
        }

        /// <summary>
        /// Retorna todos os clientes e a quantidade de aluguéis ativos.
        /// </summary>
        [HttpGet("clientes-com-alugueis-ativos")]
        public async Task<IActionResult> GetClientesComAlugueisAtivos()
        {
            try
            {
                var query = from c in _context.Clientes
                            // LEFT JOIN
                            join a in _context.Alugueis on c.Id equals a.ClienteId into alugueisGroup
                            from ag in alugueisGroup.DefaultIfEmpty()
                            group ag by new { c.Id, c.Nome, c.Cpf } into g
                            select new
                            {
                                ClienteId = g.Key.Id,
                                ClienteNome = g.Key.Nome,
                                ClienteCpf = g.Key.Cpf,
                                QuantidadeAlugueisAtivos = g.Count(x => x != null && x.DataDevolucao == null)
                            };

                var result = await query.ToListAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro interno do servidor.", detail = ex.Message });
            }
        }

        /// <summary>
        /// Retorna veículos disponíveis filtrados por categoria e ano mínimo.
        /// </summary>
        [HttpGet("veiculos-disponiveis")]
        public async Task<IActionResult> GetVeiculosDisponiveis([FromQuery] int? categoriaId, [FromQuery] int? anoMinimo)
        {
            try
            {
                var query = from v in _context.Veiculos
                            // INNER JOIN
                            join c in _context.Categorias on v.CategoriaId equals c.Id
                            // INNER JOIN
                            join f in _context.Fabricantes on v.FabricanteId equals f.Id
                            // LEFT JOIN
                            join a in _context.Alugueis.Where(x => x.DataDevolucao == null) on v.Id equals a.VeiculoId into alugueisGroup
                            from ag in alugueisGroup.DefaultIfEmpty()
                            where (!categoriaId.HasValue || v.CategoriaId == categoriaId.Value) &&
                                  (!anoMinimo.HasValue || v.AnoFabricacao >= anoMinimo.Value) &&
                                  ag == null
                            select new
                            {
                                VeiculoId = v.Id,
                                v.Modelo,
                                v.AnoFabricacao,
                                v.QuilometragemAtual,
                                FabricanteNome = f.Nome,
                                CategoriaNome = c.Nome,
                                Disponivel = true
                            };

                var result = await query.ToListAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro interno do servidor.", detail = ex.Message });
            }
        }
    }
}
