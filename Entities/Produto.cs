namespace Locadora.Entities;

public class Produto
{
    public int Id { get; set; }
    public string Nome { get; set; } = null!;
    public string Codigo { get; set; } = null!;
    public decimal Preco { get; set; }
    public string? Descricao { get; set; }
    public int QuantidadeEstoque { get; set; }
    public decimal Avaliacao { get; set; }
    public string Categoria { get; set; } = null!;
}
