using System.ComponentModel.DataAnnotations;

namespace Locadora.DTOs
{
    public class CategoriaCreateDto
    {
        [Required(ErrorMessage = "O nome da categoria é obrigatório.")]
        [StringLength(80, ErrorMessage = "O nome da categoria deve ter no máximo 80 caracteres.")]
        public string Nome { get; set; } = string.Empty;

        [StringLength(300, ErrorMessage = "A descrição deve ter no máximo 300 caracteres.")]
        public string? Descricao { get; set; }
    }
}
