FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["NexClone.Backend.csproj", "./"]
RUN dotnet restore "NexClone.Backend.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "NexClone.Backend.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "NexClone.Backend.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "NexClone.Backend.dll"]
