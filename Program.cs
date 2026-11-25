using Locadora.Data;
using Locadora.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Server=NOTEDANIEL;Database=LocadoraDB;Trusted_Connection=True;TrustServerCertificate=True;";

builder.Services.AddDbContext<LocadoraContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseMiddleware<Locadora.Middleware.ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

var frontendPath = Path.Combine(builder.Environment.ContentRootPath, "frontend");
if (Directory.Exists(frontendPath))
{
    var fileProvider = new PhysicalFileProvider(frontendPath);
    app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = fileProvider });
    app.UseStaticFiles(new StaticFileOptions { FileProvider = fileProvider });
}

app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<LocadoraContext>();
    context.Database.EnsureCreated();

    if (!context.Fabricantes.Any())
    {
        context.Fabricantes.AddRange(
            new Fabricante { Nome = "Toyota" },
            new Fabricante { Nome = "Volkswagen" },
            new Fabricante { Nome = "Chevrolet" },
            new Fabricante { Nome = "Fiat" },
            new Fabricante { Nome = "Hyundai" },
            new Fabricante { Nome = "BYD" }
        );
        context.SaveChanges();
    }

    if (!context.Categorias.Any())
    {
        context.Categorias.AddRange(
            new Categoria { Nome = "Sedan Executivo", Descricao = "Veículos sedan confortáveis com amplo porta-malas e ar digital" },
            new Categoria { Nome = "SUV Compacto", Descricao = "Utilitários esportivos com posição elevada e ótimo espaço interno" },
            new Categoria { Nome = "Hatch Econômico", Descricao = "Veículos ágeis e econômicos ideais para uso urbano diário" },
            new Categoria { Nome = "Picape Cabine Dupla", Descricao = "Picapes robustas para carga leve e viagens em qualquer terreno" },
            new Categoria { Nome = "Elétrico / Híbrido", Descricao = "Veículos de propulsão elétrica ou híbrida com zero emissão urbana" }
        );
        context.SaveChanges();
    }

    if (!context.Clientes.Any())
    {
        context.Clientes.AddRange(
            new Cliente { Nome = "Daniel Silva Oliveira", Cpf = "12345678901", Email = "daniel.oliveira@sga.pucminas.br" },
            new Cliente { Nome = "Mariana Costa Souza", Cpf = "23456789012", Email = "mariana.souza@empresa.com.br" },
            new Cliente { Nome = "Carlos Eduardo Mendes", Cpf = "34567890123", Email = "carlos.mendes@gmail.com" },
            new Cliente { Nome = "Fernanda Lima Almeida", Cpf = "45678901234", Email = "fernanda.almeida@outlook.com" },
            new Cliente { Nome = "Rafael Ribeiro Santos", Cpf = "56789012345", Email = "rafael.santos@pucminas.br" }
        );
        context.SaveChanges();
    }

    if (!context.Veiculos.Any())
    {
        var fabToyota = context.Fabricantes.First(f => f.Nome == "Toyota").Id;
        var fabVw = context.Fabricantes.First(f => f.Nome == "Volkswagen").Id;
        var fabChev = context.Fabricantes.First(f => f.Nome == "Chevrolet").Id;
        var fabFiat = context.Fabricantes.First(f => f.Nome == "Fiat").Id;
        var fabHyundai = context.Fabricantes.First(f => f.Nome == "Hyundai").Id;

        var catSedan = context.Categorias.First(c => c.Nome == "Sedan Executivo").Id;
        var catSuv = context.Categorias.First(c => c.Nome == "SUV Compacto").Id;
        var catHatch = context.Categorias.First(c => c.Nome == "Hatch Econômico").Id;
        var catPicape = context.Categorias.First(c => c.Nome == "Picape Cabine Dupla").Id;

        context.Veiculos.AddRange(
            new Veiculo { Modelo = "Corolla XEi 2.0", AnoFabricacao = 2024, QuilometragemAtual = 12400, FabricanteId = fabToyota, CategoriaId = catSedan },
            new Veiculo { Modelo = "T-Cross Highline 250 TSI", AnoFabricacao = 2024, QuilometragemAtual = 8900, FabricanteId = fabVw, CategoriaId = catSuv },
            new Veiculo { Modelo = "Onix Plus Premier 1.0 Turbo", AnoFabricacao = 2023, QuilometragemAtual = 25300, FabricanteId = fabChev, CategoriaId = catSedan },
            new Veiculo { Modelo = "Toro Volcano Turbo 270", AnoFabricacao = 2024, QuilometragemAtual = 14200, FabricanteId = fabFiat, CategoriaId = catPicape },
            new Veiculo { Modelo = "HB20 Platinum Plus 1.0 TGDI", AnoFabricacao = 2023, QuilometragemAtual = 31000, FabricanteId = fabHyundai, CategoriaId = catHatch },
            new Veiculo { Modelo = "Hilux SRX 2.8 4x4 Diesel", AnoFabricacao = 2025, QuilometragemAtual = 4500, FabricanteId = fabToyota, CategoriaId = catPicape }
        );
        context.SaveChanges();
    }

    if (!context.Alugueis.Any())
    {
        var cli1 = context.Clientes.OrderBy(c => c.Id).First().Id;
        var cli2 = context.Clientes.OrderBy(c => c.Id).Skip(1).First().Id;
        var cli3 = context.Clientes.OrderBy(c => c.Id).Skip(2).First().Id;

        var vei1 = context.Veiculos.OrderBy(v => v.Id).First().Id;
        var vei2 = context.Veiculos.OrderBy(v => v.Id).Skip(1).First().Id;
        var vei3 = context.Veiculos.OrderBy(v => v.Id).Skip(2).First().Id;

        context.Alugueis.AddRange(
            new Aluguel
            {
                ClienteId = cli1,
                VeiculoId = vei1,
                DataInicio = DateTime.Today.AddDays(-5),
                DataPrevistaFim = DateTime.Today.AddDays(2),
                DataDevolucao = null,
                QuilometragemInicial = 12000,
                QuilometragemFinal = null,
                ValorDiaria = 240.00m,
                ValorTotalLocacao = null
            },
            new Aluguel
            {
                ClienteId = cli2,
                VeiculoId = vei2,
                DataInicio = DateTime.Today.AddDays(-12),
                DataPrevistaFim = DateTime.Today.AddDays(-7),
                DataDevolucao = DateTime.Today.AddDays(-7),
                QuilometragemInicial = 8100,
                QuilometragemFinal = 8900,
                ValorDiaria = 280.00m,
                ValorTotalLocacao = 1400.00m
            },
            new Aluguel
            {
                ClienteId = cli3,
                VeiculoId = vei3,
                DataInicio = DateTime.Today.AddDays(-2),
                DataPrevistaFim = DateTime.Today.AddDays(4),
                DataDevolucao = null,
                QuilometragemInicial = 25000,
                QuilometragemFinal = null,
                ValorDiaria = 175.00m,
                ValorTotalLocacao = null
            }
        );
        context.SaveChanges();
    }

    if (!context.Produtos.Any())
    {
        context.Produtos.AddRange(
            new Produto
            {
                Nome = "GPS Automotivo Garmin DriveSmart 65",
                Codigo = "ACESS-GPS-001",
                Preco = 1190.00m,
                Descricao = "Navegador GPS veicular com tela de 6.95 polegadas e alertas de trânsito em tempo real",
                QuantidadeEstoque = 18,
                Avaliacao = 4.9m,
                Categoria = "Acessorios"
            },
            new Produto
            {
                Nome = "Cadeirinha Infantil ISOFIX 0 a 36kg",
                Codigo = "SEG-CAD-002",
                Preco = 849.90m,
                Descricao = "Assento de segurança infantil homologado pelo INMETRO com rotação 360 graus",
                QuantidadeEstoque = 25,
                Avaliacao = 4.8m,
                Categoria = "Seguranca"
            },
            new Produto
            {
                Nome = "Câmera Veicular Dashcam Dual Full HD",
                Codigo = "ELE-CAM-003",
                Preco = 429.90m,
                Descricao = "Câmera frontal e traseira com gravação contínua para monitoramento de frota",
                QuantidadeEstoque = 30,
                Avaliacao = 4.7m,
                Categoria = "Eletronicos"
            }
        );
        context.SaveChanges();
    }
}

app.MapControllers();

app.Run();
