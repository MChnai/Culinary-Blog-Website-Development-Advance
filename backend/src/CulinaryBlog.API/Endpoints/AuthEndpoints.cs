using System.Security.Claims;
using CulinaryBlog.Application.Features.Auth.Commands.GoogleLogin;
using CulinaryBlog.Application.Features.Auth.Commands.Login;
using CulinaryBlog.Application.Features.Auth.Commands.Logout;
using CulinaryBlog.Application.Features.Auth.Commands.RefreshToken;
using CulinaryBlog.Application.Features.Auth.Commands.Register;
using CulinaryBlog.Application.Features.Auth.Commands.UpdateProfile;
using CulinaryBlog.Application.Features.Auth.DTOs;
using CulinaryBlog.Application.Features.Auth.Queries.GetCurrentUser;
using MediatR;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace CulinaryBlog.API.Endpoints;

public record LogoutRequest(string? RefreshToken);

public static class AuthEndpoints
{
    public static RouteGroupBuilder MapAuthEndpoints(this RouteGroupBuilder group)
    {
        // FR-AUTH-001: Register
        group.MapPost("/register", Register)
            .WithName("Register")
            .WithSummary("Register new user (FR-AUTH-001) with Author role, auto-login tokens & queued welcome email")
            .Produces<AuthResponseDto>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesValidationProblem(StatusCodes.Status422UnprocessableEntity);

        // FR-AUTH-002: Local Login
        group.MapPost("/login", Login)
            .WithName("Login")
            .WithSummary("Authenticate with email/password (FR-AUTH-002), token rotation & account lockout after 5 attempts")
            .Produces<AuthResponseDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status423Locked);

        // FR-AUTH-003: Google OAuth 2.0 Login
        group.MapPost("/google", GoogleLogin)
            .WithName("GoogleLogin")
            .WithSummary("Authenticate or auto-provision with Google OAuth 2.0 (FR-AUTH-003)")
            .Produces<AuthResponseDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        // FR-AUTH-004: Token Refresh with Rotation & Reuse Detection
        group.MapPost("/refresh", RefreshToken)
            .WithName("RefreshToken")
            .WithSummary("Refresh access token with token rotation & paranoid reuse attack detection (FR-AUTH-004)")
            .Produces<AuthResponseDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        // FR-AUTH-005: Logout / Token Revocation
        group.MapPost("/logout", Logout)
            .WithName("Logout")
            .WithSummary("Revoke refresh token and invalidate session (FR-AUTH-005)")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .RequireAuthorization();

        // FR-AUTH-006: View Profile
        group.MapGet("/me", GetCurrentUser)
            .WithName("GetCurrentUser")
            .WithSummary("Retrieve authenticated user profile (FR-AUTH-006)")
            .Produces<UserProfileDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .RequireAuthorization();

        // FR-AUTH-007: Update Profile (Partial Update)
        group.MapPatch("/me", UpdateProfile)
            .WithName("UpdateProfile")
            .WithSummary("Partially update FullName and/or AvatarUrl (FR-AUTH-007)")
            .Produces<UserProfileDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesValidationProblem(StatusCodes.Status422UnprocessableEntity)
            .RequireAuthorization();

        return group;
    }

    public static async Task<Results<Created<AuthResponseDto>, Conflict<ProblemDetails>, UnprocessableEntity<ProblemDetails>>> Register(
        [FromServices] ISender sender,
        [FromBody] RegisterCommand command)
    {
        var result = await sender.Send(command);

        if (!result.IsSuccess)
        {
            if (result.ErrorCode?.StartsWith("CONFLICT") == true)
            {
                return TypedResults.Conflict(new ProblemDetails
                {
                    Type = "https://tools.ietf.org/html/rfc9110#section-15.5.10",
                    Title = "Account Conflict",
                    Status = StatusCodes.Status409Conflict,
                    Detail = result.ErrorMessage
                });
            }

            return TypedResults.UnprocessableEntity(new ProblemDetails
            {
                Type = "https://tools.ietf.org/html/rfc9110#section-15.5.21",
                Title = "Registration Failed",
                Status = StatusCodes.Status422UnprocessableEntity,
                Detail = result.ErrorMessage
            });
        }

        return TypedResults.Created("/api/v1/auth/me", result.Value!);
    }

    public static async Task<Results<Ok<AuthResponseDto>, UnauthorizedHttpResult, StatusCodeHttpResult>> Login(
        [FromServices] ISender sender,
        [FromBody] LoginCommand command)
    {
        var result = await sender.Send(command);

        if (!result.IsSuccess)
        {
            if (result.ErrorCode == "ACCOUNT_LOCKED")
            {
                // HTTP 423 Locked (RFC 4918)
                return TypedResults.StatusCode(StatusCodes.Status423Locked);
            }

            return TypedResults.Unauthorized();
        }

        return TypedResults.Ok(result.Value!);
    }

    public static async Task<Results<Ok<AuthResponseDto>, BadRequest<ProblemDetails>>> GoogleLogin(
        [FromServices] ISender sender,
        [FromBody] GoogleLoginCommand command)
    {
        var result = await sender.Send(command);

        if (!result.IsSuccess)
        {
            return TypedResults.BadRequest(new ProblemDetails
            {
                Title = "Google Authentication Failed",
                Status = StatusCodes.Status400BadRequest,
                Detail = result.ErrorMessage
            });
        }

        return TypedResults.Ok(result.Value!);
    }

    public static async Task<Results<Ok<AuthResponseDto>, UnauthorizedHttpResult>> RefreshToken(
        [FromServices] ISender sender,
        [FromBody] RefreshTokenCommand command)
    {
        var result = await sender.Send(command);

        if (!result.IsSuccess)
        {
            return TypedResults.Unauthorized();
        }

        return TypedResults.Ok(result.Value!);
    }

    public static async Task<Results<NoContent, UnauthorizedHttpResult>> Logout(
        [FromServices] ISender sender,
        ClaimsPrincipal principal,
        [FromBody] LogoutRequest? request)
    {
        var idStr = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid? userId = Guid.TryParse(idStr, out var parsedId) ? parsedId : null;

        await sender.Send(new LogoutCommand(request?.RefreshToken, userId));

        return TypedResults.NoContent();
    }

    public static async Task<Results<Ok<UserProfileDto>, NotFound<ProblemDetails>, UnauthorizedHttpResult>> GetCurrentUser(
        [FromServices] ISender sender,
        ClaimsPrincipal principal)
    {
        var idStr = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(idStr, out var userId))
        {
            return TypedResults.Unauthorized();
        }

        var result = await sender.Send(new GetCurrentUserQuery(userId));

        if (!result.IsSuccess)
        {
            return TypedResults.NotFound(new ProblemDetails
            {
                Type = "https://tools.ietf.org/html/rfc9110#section-15.5.5",
                Title = "User Not Found",
                Status = StatusCodes.Status404NotFound,
                Detail = result.ErrorMessage
            });
        }

        return TypedResults.Ok(result.Value!);
    }

    public static async Task<Results<Ok<UserProfileDto>, NotFound<ProblemDetails>, UnauthorizedHttpResult>> UpdateProfile(
        [FromServices] ISender sender,
        ClaimsPrincipal principal,
        [FromBody] UpdateProfileRequest request)
    {
        var idStr = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(idStr, out var userId))
        {
            return TypedResults.Unauthorized();
        }

        var result = await sender.Send(new UpdateProfileCommand(userId, request.FullName, request.AvatarUrl));

        if (!result.IsSuccess)
        {
            return TypedResults.NotFound(new ProblemDetails
            {
                Type = "https://tools.ietf.org/html/rfc9110#section-15.5.5",
                Title = "User Not Found",
                Status = StatusCodes.Status404NotFound,
                Detail = result.ErrorMessage
            });
        }

        return TypedResults.Ok(result.Value!);
    }
}
