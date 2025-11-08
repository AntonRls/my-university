FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["HacatonMax.WebHost/HacatonMax.WebHost.csproj", "HacatonMax.WebHost/"]
COPY ["HacatonMax.Bot/HacatonMax.Bot.csproj", "HacatonMax.Bot/"]
COPY ["HacatonMax.MaxClient/HacatonMax.MaxClient.csproj", "HacatonMax.MaxClient/"]
COPY ["HacatonMax.University.StudentsProject/HacatonMax.University.StudentsProject.csproj", "HacatonMax.University.StudentsProject/"]
COPY ["HacatonMax.University.Events/HacatonMax.University.Events.csproj", "HacatonMax.University.Events/"]
RUN dotnet restore "HacatonMax.WebHost/HacatonMax.WebHost.csproj"
COPY . .
WORKDIR "/src/HacatonMax.WebHost"
RUN dotnet build "./HacatonMax.WebHost.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./HacatonMax.WebHost.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "HacatonMax.WebHost.dll"]
