namespace Locadora.Entities;

public class Cliente
{
    public int Id { get; set; }
    public string Nome { get; set; } = null!;
    public string Cpf { get; set; } = null!;
    public string Email { get; set; } = null!;

    public ICollection<Aluguel> Alugueis { get; set; } = new List<Aluguel>();
}
