namespace Locadora.DTOs
{
    public class CategoriaReadDto
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
    }
}
