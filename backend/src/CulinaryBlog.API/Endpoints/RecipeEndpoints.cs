using CulinaryBlog.Application.Common.Models;
using CulinaryBlog.Application.Features.Recipes.Commands.CreateRecipe;
using CulinaryBlog.Application.Features.Recipes.Commands.PublishRecipe;
using CulinaryBlog.Application.Features.Recipes.DTOs;
using CulinaryBlog.Application.Features.Recipes.Queries.GetRecipeById;
using CulinaryBlog.Application.Features.Recipes.Queries.GetRecipes;
using CulinaryBlog.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace CulinaryBlog.API.Endpoints;

public static class RecipeEndpoints
{
    public static RouteGroupBuilder MapRecipeEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/", GetRecipes)
            .WithName("GetRecipes")
            .WithSummary("Get paginated list of recipes with multi-criteria filtering and full-text search")
            .Produces<PaginatedList<RecipeDto>>(StatusCodes.Status200OK);

        group.MapGet("/{id:guid}", GetRecipeById)
            .WithName("GetRecipeById")
            .WithSummary("Get detailed single recipe by unique Guid")
            .Produces<RecipeDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/", CreateRecipe)
            .WithName("CreateRecipe")
            .WithSummary("Create a new recipe with nested ingredients, steps, and nutrition")
            .Produces<Guid>(StatusCodes.Status201Created)
            .ProducesValidationProblem(StatusCodes.Status422UnprocessableEntity);

        group.MapPatch("/{id:guid}/publish", PublishRecipe)
            .WithName("PublishRecipe")
            .WithSummary("Transition recipe lifecycle state to Published")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound);

        return group;
    }

    public static async Task<Ok<PaginatedList<RecipeDto>>> GetRecipes(
        [FromServices] ISender sender,
        [FromQuery] string? search,
        [FromQuery] string? category,
        [FromQuery] RecipeDifficulty? difficulty,
        [FromQuery] int? maxCookTime,
        [FromQuery] RecipeStatus? status,
        [FromQuery] string? sortBy,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        var query = new GetRecipesQuery
        {
            Search = search,
            CategorySlug = category,
            Difficulty = difficulty,
            MaxCookTimeMinutes = maxCookTime,
            Status = status ?? RecipeStatus.Published,
            SortBy = sortBy,
            PageNumber = page,
            PageSize = pageSize
        };

        var result = await sender.Send(query);
        return TypedResults.Ok(result);
    }

    public static async Task<Results<Ok<RecipeDto>, NotFound<ProblemDetails>>> GetRecipeById(
        [FromServices] ISender sender,
        Guid id)
    {
        var recipe = await sender.Send(new GetRecipeByIdQuery(id));
        if (recipe == null)
        {
            return TypedResults.NotFound(new ProblemDetails
            {
                Title = "Recipe Not Found",
                Status = StatusCodes.Status404NotFound,
                Detail = $"Recipe with ID '{id}' was not found in the database."
            });
        }

        return TypedResults.Ok(recipe);
    }

    public static async Task<Results<Created<Guid>, UnprocessableEntity<ProblemDetails>>> CreateRecipe(
        [FromServices] ISender sender,
        [FromBody] CreateRecipeCommand command)
    {
        var result = await sender.Send(command);
        if (!result.IsSuccess)
        {
            return TypedResults.UnprocessableEntity(new ProblemDetails
            {
                Title = "Failed to Create Recipe",
                Status = StatusCodes.Status422UnprocessableEntity,
                Detail = result.ErrorMessage
            });
        }

        return TypedResults.Created($"/api/v1/recipes/{result.Value}", result.Value);
    }

    public static async Task<Results<NoContent, NotFound<ProblemDetails>>> PublishRecipe(
        [FromServices] ISender sender,
        Guid id)
    {
        var result = await sender.Send(new PublishRecipeCommand(id));
        if (!result.IsSuccess)
        {
            return TypedResults.NotFound(new ProblemDetails
            {
                Title = "Recipe Not Found",
                Status = StatusCodes.Status404NotFound,
                Detail = result.ErrorMessage
            });
        }

        return TypedResults.NoContent();
    }
}
