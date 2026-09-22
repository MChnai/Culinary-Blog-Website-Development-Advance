# CulinaryBlog Backend - ASP.NET 10 Core Minimal APIs & PostgreSQL 16

Production-ready backend implementation conforming to IEEE 830 SRS Specification, Clean Architecture (Robert C. Martin), CQRS with MediatR, and EF Core 10.

## Architecture Highlights
- **Framework**: .NET 10.0 (C# 14 / Minimal APIs)
- **Database**: PostgreSQL 16 with tsvector Full-Text Search, GIN Index, and unaccent
- **Patterns**: Clean Architecture, CQRS (MediatR), Pipeline Validation (FluentValidation), RFC 7807 Problem Details
- **API Documentation**: Scalar Interactive OpenAPI 3.1 (`/scalar/v1`) & Native OpenAPI (`/openapi/v1.json`)
- **Authentication**: JWT Bearer Tokens with Role-Based Access Control (`Admin`, `Author`, `Guest`)

## Project Structure
```text
backend/
├── CulinaryBlog.sln
├── docker-compose.yml
├── scripts/
│   └── init_postgresql16_schema.sql
└── src/
    ├── CulinaryBlog.Domain/         # Zero-dependency Core Entities, Enums & Value Objects
    ├── CulinaryBlog.Application/    # CQRS Handlers, MediatR Behaviors, DTOs & Validation
    ├── CulinaryBlog.Infrastructure/ # EF Core 10 DbContext, Npgsql PostgreSQL 16 Configurations
    └── CulinaryBlog.API/            # ASP.NET 10 Minimal APIs MapGroup, Middleware & Scalar UI
```

## Quick Start (Docker Compose)
To spin up both PostgreSQL 16 and the ASP.NET 10 Minimal API service in containers:
```bash
cd backend
docker compose up --build
```
- API Endpoint: `http://localhost:5000`
- Scalar API Reference UI: `http://localhost:5000/scalar/v1`
- OpenAPI Specification: `http://localhost:5000/openapi/v1.json`
- Health Check: `http://localhost:5000/health`

## Local Development (dotnet CLI)
1. Ensure PostgreSQL 16 is running on `localhost:5432` and run `scripts/init_postgresql16_schema.sql`.
2. Navigate to the API project and launch:
```bash
cd backend/src/CulinaryBlog.API
dotnet run
```
