using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NexClone.Backend.Models;
using Serilog;
using System;
using System.Text;
using Minio;
using Scalar.AspNetCore;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/system.log", rollingInterval: RollingInterval.Day, shared: true)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container.
builder.Services.AddControllersWithViews();

// Setup CORS for Next.js
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextjs", builder =>
    {
        builder.SetIsOriginAllowed(origin => true)
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});

// Setup PostgreSQL Database (Identity)
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Setup Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole<Guid>>(options => {
    options.SignIn.RequireConfirmedAccount = false;
    options.Password.RequireDigit = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequiredLength = 6;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Register custom password hasher for Django PBKDF2 backwards compatibility
builder.Services.AddScoped<IPasswordHasher<ApplicationUser>, NexClone.Backend.Services.DjangoPasswordHasher>();

// Setup JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not found");
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"]
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            if (context.Request.Cookies.ContainsKey("jwt"))
            {
                context.Token = context.Request.Cookies["jwt"];
            }
            return Task.CompletedTask;
        }
    };
});

// Setup HttpClient for AI Microservices
builder.Services.AddHttpClient("AIGateway", client =>
{
    // The base address could be a docker service name or localhost depending on deployment
    client.BaseAddress = new Uri("http://localhost:5000"); // Example port for Flask apps
});

builder.Services.AddScoped<NexClone.Backend.Services.AI.ITtsService, NexClone.Backend.Services.AI.TtsService>();
builder.Services.AddScoped<NexClone.Backend.Services.AI.ISttService, NexClone.Backend.Services.AI.SttService>();


// Register Media Service
builder.Services.AddScoped<NexClone.Backend.Services.IMediaService, NexClone.Backend.Services.MinioMediaService>();

// Register Email Service
builder.Services.AddScoped<NexClone.Backend.Services.IEmailService, NexClone.Backend.Services.BrevoEmailService>();

// Register Payment Service
builder.Services.AddHttpClient();
builder.Services.AddScoped<NexClone.Backend.Services.Payments.IPaymentService, NexClone.Backend.Services.Payments.PaymobPaymentService>();

// Register Credit Manager
builder.Services.AddScoped<NexClone.Backend.Services.CreditManagerService>();

// Register Usage Policy Service
builder.Services.AddScoped<NexClone.Backend.Services.UsagePolicyService>();

// Add Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("ApiPolicy", opt =>
    {
        opt.PermitLimit = 100;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0;
    });
});

// Add Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    dbContext.Database.Migrate();

    // Seed Default Settings
    var defaultSettings = new List<NexClone.Backend.Models.AppSetting>
    {
        new NexClone.Backend.Models.AppSetting { Key = "Site.MaintenanceMode", Value = "false", Description = "Global maintenance mode toggle (true/false)" },
        new NexClone.Backend.Models.AppSetting { Key = "Site.MaintenanceEndDate", Value = "", Description = "Optional end date for maintenance (ISO 8601 string)" },
        new NexClone.Backend.Models.AppSetting { Key = "Origin.AllowedOrigins", Value = "http://localhost:3000,http://localhost:3001,https://nexclone.com", Description = "Comma-separated list of allowed origins for CORS" },
        new NexClone.Backend.Models.AppSetting { Key = "Minio.Endpoint", Value = "minio:9000", Description = "Minio endpoint address" },
        new NexClone.Backend.Models.AppSetting { Key = "Minio.AccessKey", Value = "minioadmin", Description = "Minio access key" },
        new NexClone.Backend.Models.AppSetting { Key = "Minio.SecretKey", Value = "minioadmin", Description = "Minio secret key" },
        new NexClone.Backend.Models.AppSetting { Key = "Minio.BucketName", Value = "nexmedia", Description = "Minio bucket name" }
    };

    foreach (var setting in defaultSettings)
    {
        if (!dbContext.AppSettings.Any(s => s.Key == setting.Key))
        {
            dbContext.AppSettings.Add(setting);
        }
    }
    dbContext.SaveChanges();
}

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.MapOpenApi();
app.MapScalarApiReference();

app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("AllowNextjs");
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapStaticAssets();

app.MapControllerRoute(
    name: "areas",
    pattern: "{area:exists}/{controller=Home}/{action=Index}/{id?}");

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();

app.Run();
