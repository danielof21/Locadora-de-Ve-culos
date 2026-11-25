using System;
using System.ComponentModel.DataAnnotations;

namespace Locadora.DTOs
{
    public class AluguelUpdateDto
    {
        public int? ClienteId { get; set; }
        public int? VeiculoId { get; set; }
        public DateTime? DataInicio { get; set; }
        public DateTime? DataPrevistaFim { get; set; }
        public DateTime? DataDevolucao { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "A quilometragem inicial não pode ser negativa.")]
        public int? QuilometragemInicial { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "A quilometragem final não pode ser negativa.")]
        public int? QuilometragemFinal { get; set; }

        [Range(0.01, double.MaxValue, ErrorMessage = "O valor da diária deve ser maior que zero.")]
        public decimal? ValorDiaria { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "O valor total da locação não pode ser negativo.")]
        public decimal? ValorTotalLocacao { get; set; }
    }
}
