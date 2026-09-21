namespace Locadora.Entities;

public class Aluguel
{
    public int Id { get; set; }
    public DateTime DataInicio { get; set; }
    public DateTime DataPrevistaFim { get; set; }
    public DateTime? DataDevolucao { get; set; }
    public int QuilometragemInicial { get; set; }
    public int? QuilometragemFinal { get; set; }
    public decimal ValorDiaria { get; set; }
    public decimal? ValorTotalLocacao { get; set; }

    public int ClienteId { get; set; }
    public Cliente Cliente { get; set; } = null!;

    public int VeiculoId { get; set; }
    public Veiculo Veiculo { get; set; } = null!;
}
