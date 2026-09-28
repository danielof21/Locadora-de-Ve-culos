using System.ComponentModel.DataAnnotations;

namespace Locadora.DTOs
{
    public class VeiculoCreateDto
    {
        [Required(ErrorMessage = "O modelo é obrigatório.")]
        [StringLength(120, ErrorMessage = "O modelo deve ter no máximo 120 caracteres.")]
        public string Modelo { get; set; } = string.Empty;

        [Required(ErrorMessage = "O ano de fabricação é obrigatório.")]
        [Range(1886, 9999, ErrorMessage = "O ano de fabricação deve estar entre 1886 e 9999.")]
        public int AnoFabricacao { get; set; }

        [Required(ErrorMessage = "A quilometragem atual é obrigatória.")]
        [Range(0, int.MaxValue, ErrorMessage = "A quilometragem atual não pode ser negativa.")]
        public int QuilometragemAtual { get; set; }

        [Required(ErrorMessage = "O fabricante é obrigatório.")]
        public int FabricanteId { get; set; }

        [Required(ErrorMessage = "A categoria é obrigatória.")]
        public int CategoriaId { get; set; }
    }
}
