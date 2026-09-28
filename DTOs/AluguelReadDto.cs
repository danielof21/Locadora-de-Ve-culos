using System;

namespace Locadora.DTOs
{
    public class AluguelReadDto
    {
        public int Id { get; set; }
        public DateTime DataInicio { get; set; }
        public DateTime DataPrevistaFim { get; set; }
        public DateTime? DataDevolucao { get; set; }
        public int QuilometragemInicial { get; set; }
        public int? QuilometragemFinal { get; set; }
        public decimal ValorDiaria { get; set; }
        public decimal? ValorTotalLocacao { get; set; }
        public int ClienteId { get; set; }
        public string ClienteNome { get; set; } = string.Empty;
        public int VeiculoId { get; set; }
        public string VeiculoModelo { get; set; } = string.Empty;
    }
}
