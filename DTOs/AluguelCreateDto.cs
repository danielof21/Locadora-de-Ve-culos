using System;
using System.ComponentModel.DataAnnotations;

namespace Locadora.DTOs
{
    public class AluguelCreateDto
    {
        [Required(ErrorMessage = "A data de início é obrigatória.")]
        public DateTime DataInicio { get; set; }

        [Required(ErrorMessage = "A data prevista de fim é obrigatória.")]
        public DateTime DataPrevistaFim { get; set; }

        [Required(ErrorMessage = "A quilometragem inicial é obrigatória.")]
        [Range(0, int.MaxValue, ErrorMessage = "A quilometragem inicial não pode ser negativa.")]
        public int QuilometragemInicial { get; set; }

        [Required(ErrorMessage = "O valor da diária é obrigatório.")]
        [Range(0.01, double.MaxValue, ErrorMessage = "O valor da diária deve ser maior que zero.")]
        public decimal ValorDiaria { get; set; }

        [Required(ErrorMessage = "O cliente é obrigatório.")]
        public int ClienteId { get; set; }

        [Required(ErrorMessage = "O veículo é obrigatório.")]
        public int VeiculoId { get; set; }
    }
}
