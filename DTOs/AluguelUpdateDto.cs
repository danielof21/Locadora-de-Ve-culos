using System;
using System.ComponentModel.DataAnnotations;

namespace Locadora.DTOs
{
    public class AluguelUpdateDto
    {
        public DateTime? DataDevolucao { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "A quilometragem final não pode ser negativa.")]
        public int? QuilometragemFinal { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "O valor total da locação não pode ser negativo.")]
        public decimal? ValorTotalLocacao { get; set; }
    }
}
