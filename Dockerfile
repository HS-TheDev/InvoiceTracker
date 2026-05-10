FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src
COPY ["InvoiceTracker.API/InvoiceTracker.API.csproj", "InvoiceTracker.API/"]
RUN dotnet restore "InvoiceTracker.API/InvoiceTracker.API.csproj"
COPY InvoiceTracker.API/ InvoiceTracker.API/
WORKDIR "/src/InvoiceTracker.API"
RUN dotnet publish "InvoiceTracker.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "InvoiceTracker.API.dll"]
