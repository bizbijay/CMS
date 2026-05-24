# syntax=docker/dockerfile:1
#
# Multi-stage Dockerfile for the CMS .NET 8 Web API.
# Used by Render (and any other Docker-based PaaS).
#
# Build context: this folder (backend/CMS.Api).

# --- build stage ---------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Restore dependencies first to leverage Docker layer caching.
COPY CMS.Api.csproj ./
RUN dotnet restore CMS.Api.csproj

# Copy the rest and publish.
COPY . ./
RUN dotnet publish CMS.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# --- runtime stage -------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish ./

# Render sets the PORT env var at runtime; Program.cs picks it up.
# Expose a default for local Docker runs.
EXPOSE 8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "CMS.Api.dll"]
