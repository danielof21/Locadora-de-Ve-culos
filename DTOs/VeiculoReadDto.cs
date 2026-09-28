namespace Locadora.DTOs
{
    public class VeiculoReadDto
    {
        public int Id { get; set; }
        public string Modelo { get; set; } = string.Empty;
        public int AnoFabricacao { get; set; }
        public int QuilometragemAtual { get; set; }
        public int FabricanteId { get; set; }
        public string FabricanteNome { get; set; } = string.Empty;
        public int CategoriaId { get; set; }
        public string CategoriaNome { get; set; } = string.Empty;
    }
}
