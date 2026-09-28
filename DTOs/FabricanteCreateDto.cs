using System.ComponentModel.DataAnnotations;

namespace Locadora.DTOs
{
    public class FabricanteCreateDto
    {
        [Required(ErrorMessage = "O nome do fabricante é obrigatório.")]
        [StringLength(100, ErrorMessage = "O nome do fabricante deve ter no máximo 100 caracteres.")]
        public string Nome { get; set; } = string.Empty;
    }
}
