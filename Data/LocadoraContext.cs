using Locadora.Entities;
using Microsoft.EntityFrameworkCore;

namespace Locadora.Data;

public class LocadoraContext : DbContext
{
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Fabricante> Fabricantes => Set<Fabricante>();
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Veiculo> Veiculos => Set<Veiculo>();
    public DbSet<Aluguel> Alugueis => Set<Aluguel>();
    public DbSet<Produto> Produtos => Set<Produto>();

    public LocadoraContext(DbContextOptions<LocadoraContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Cliente>(entity =>
        {
            entity.ToTable("Clientes");
            entity.HasKey(cliente => cliente.Id);
            entity.Property(cliente => cliente.Nome).HasMaxLength(150).IsRequired();
            entity.Property(cliente => cliente.Cpf).HasMaxLength(11).IsRequired();
            entity.Property(cliente => cliente.Email).HasMaxLength(254).IsRequired();
            entity.HasIndex(cliente => cliente.Cpf).IsUnique();
            entity.HasIndex(cliente => cliente.Email).IsUnique();
        });

        modelBuilder.Entity<Fabricante>(entity =>
        {
            entity.ToTable("Fabricantes");
            entity.HasKey(fabricante => fabricante.Id);
            entity.Property(fabricante => fabricante.Nome).HasMaxLength(100).IsRequired();
            entity.HasIndex(fabricante => fabricante.Nome).IsUnique();
        });

        modelBuilder.Entity<Categoria>(entity =>
        {
            entity.ToTable("Categorias");
            entity.HasKey(categoria => categoria.Id);
            entity.Property(categoria => categoria.Nome).HasMaxLength(80).IsRequired();
            entity.Property(categoria => categoria.Descricao).HasMaxLength(300);
            entity.HasIndex(categoria => categoria.Nome).IsUnique();
        });

        modelBuilder.Entity<Veiculo>(entity =>
        {
            entity.ToTable("Veiculos", table =>
            {
                table.HasCheckConstraint("CK_Veiculos_AnoFabricacao", "[AnoFabricacao] BETWEEN 1886 AND 9999");
                table.HasCheckConstraint("CK_Veiculos_QuilometragemAtual", "[QuilometragemAtual] >= 0");
            });
            entity.HasKey(veiculo => veiculo.Id);
            entity.Property(veiculo => veiculo.Modelo).HasMaxLength(120).IsRequired();
            entity.Property(veiculo => veiculo.AnoFabricacao).IsRequired();
            entity.Property(veiculo => veiculo.QuilometragemAtual).IsRequired();

            entity.HasOne(veiculo => veiculo.Fabricante)
                .WithMany(fabricante => fabricante.Veiculos)
                .HasForeignKey(veiculo => veiculo.FabricanteId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired();

            entity.HasOne(veiculo => veiculo.Categoria)
                .WithMany(categoria => categoria.Veiculos)
                .HasForeignKey(veiculo => veiculo.CategoriaId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired();
        });

        modelBuilder.Entity<Aluguel>(entity =>
        {
            entity.ToTable("Alugueis", table =>
            {
                table.HasCheckConstraint("CK_Alugueis_Datas", "[DataPrevistaFim] >= [DataInicio] AND ([DataDevolucao] IS NULL OR [DataDevolucao] >= [DataInicio])");
                table.HasCheckConstraint("CK_Alugueis_Quilometragens", "[QuilometragemInicial] >= 0 AND ([QuilometragemFinal] IS NULL OR [QuilometragemFinal] >= [QuilometragemInicial])");
                table.HasCheckConstraint("CK_Alugueis_Valores", "[ValorDiaria] > 0 AND ([ValorTotalLocacao] IS NULL OR [ValorTotalLocacao] >= 0)");
            });
            entity.HasKey(aluguel => aluguel.Id);
            entity.Property(aluguel => aluguel.DataInicio).IsRequired();
            entity.Property(aluguel => aluguel.DataPrevistaFim).IsRequired();
            entity.Property(aluguel => aluguel.QuilometragemInicial).IsRequired();
            entity.Property(aluguel => aluguel.ValorDiaria).HasPrecision(10, 2).IsRequired();
            entity.Property(aluguel => aluguel.ValorTotalLocacao).HasPrecision(12, 2);

            entity.HasOne(aluguel => aluguel.Cliente)
                .WithMany(cliente => cliente.Alugueis)
                .HasForeignKey(aluguel => aluguel.ClienteId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired();

            entity.HasOne(aluguel => aluguel.Veiculo)
                .WithMany(veiculo => veiculo.Alugueis)
                .HasForeignKey(aluguel => aluguel.VeiculoId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired();
        });

        modelBuilder.Entity<Produto>(entity =>
        {
            entity.ToTable("Produtos");
            entity.HasKey(produto => produto.Id);
            entity.Property(produto => produto.Nome).HasMaxLength(150).IsRequired();
            entity.Property(produto => produto.Codigo).HasMaxLength(50).IsRequired();
            entity.Property(produto => produto.Preco).HasPrecision(18, 2).IsRequired();
            entity.Property(produto => produto.Descricao).HasMaxLength(500);
            entity.Property(produto => produto.QuantidadeEstoque).IsRequired();
            entity.Property(produto => produto.Avaliacao).HasPrecision(3, 2).IsRequired();
            entity.Property(produto => produto.Categoria).HasMaxLength(100).IsRequired();
            entity.HasIndex(produto => produto.Codigo).IsUnique();
        });
    }
}
