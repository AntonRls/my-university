FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["HacatonMax.Auth/HacatonMax.Auth.csproj", "HacatonMax.Auth/"]
COPY ["HacatonMax.Common/HacatonMax.Common.csproj", "HacatonMax.Common/"]
RUN dotnet restore "HacatonMax.Auth/HacatonMax.Auth.csproj"
COPY . .
WORKDIR "/src/HacatonMax.Auth"
RUN dotnet build "./HacatonMax.Auth.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./HacatonMax.Auth.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "HacatonMax.Auth.dll"]
