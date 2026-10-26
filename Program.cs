using Locadora.Data;
using Locadora.Entities;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = "C:\\Users\\danie\\OneDrive\\Desktop\\Locadora"
});

// Add services to the container.
builder.Services.AddControllers();

// Configure Entity Framework Core with SQL Server
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=NOTEDANIEL;Database=LocadoraDB;Trusted_Connection=True;TrustServerCertificate=True;";

builder.Services.AddDbContext<LocadoraContext>(options =>
    options.UseSqlServer(connectionString));

// Configure Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(); 

// Configure CORS
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

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

app.UseAuthorization();

// Garantir que as tabelas existam no SQL Server e semear produtos iniciais
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<LocadoraContext>();
    context.Database.EnsureCreated();

    if (!context.Produtos.Any())
    {
        context.Produtos.AddRange(
            new Produto
            {
                Nome = "Notebook Dell Inspiron 15",
                Codigo = "NOTE-DELL-001",
                Preco = 3899.90m,
                Descricao = "Notebook com processador Intel Core i7, 16GB RAM e SSD 512GB",
                QuantidadeEstoque = 15,
                Avaliacao = 4.8m,
                Categoria = "Informatica"
            },
            new Produto
            {
                Nome = "Mouse Gamer Sem Fio RGB",
                Codigo = "PERIF-MOUSE-002",
                Preco = 189.90m,
                Descricao = "Mouse óptico de alta precisão 16000 DPI com bateria recarregável",
                QuantidadeEstoque = 45,
                Avaliacao = 4.6m,
                Categoria = "Perifericos"
            },
            new Produto
            {
                Nome = "Monitor UltraWide 29 Polegadas",
                Codigo = "MON-LG-003",
                Preco = 1249.00m,
                Descricao = "Monitor IPS Full HD com suporte HDR10 e taxa de 75Hz",
                QuantidadeEstoque = 20,
                Avaliacao = 4.7m,
                Categoria = "Informatica"
            }
        );
        context.SaveChanges();
    }
}

app.MapControllers();

app.Run();
