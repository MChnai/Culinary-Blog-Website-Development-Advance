using CulinaryBlog.Application.Features.Categories.Commands.CreateCategory;
using CulinaryBlog.Application.Features.Categories.DTOs;
using CulinaryBlog.Application.Features.Categories.Queries.GetCategories;
using MediatR;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace CulinaryBlog.API.Endpoints;

public static class CategoryEndpoints
{
    public static RouteGroupBuilder MapCategoryEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/", GetCategories)
            .WithName("GetCategories")
            .WithSummary("Retrieve all culinary categories with count of published recipes")
            .Produces<List<CategoryDto>>(StatusCodes.Status200OK);

        group.MapPost("/", CreateCategory)
            .WithName("CreateCategory")
            .WithSummary("Create a new culinary category (Admin restricted)")
            .Produces<Guid>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return group;
    }

    public static async Task<Ok<List<CategoryDto>>> GetCategories([FromServices] ISender sender)
    {
        var categories = await sender.Send(new GetCategoriesQuery());
        return TypedResults.Ok(categories);
    }

    public static async Task<Results<Created<Guid>, BadRequest<ProblemDetails>>> CreateCategory(
        [FromServices] ISender sender,
        [FromBody] CreateCategoryCommand command)
    {
        var result = await sender.Send(command);
        if (!result.IsSuccess)
        {
            return TypedResults.BadRequest(new ProblemDetails
            {
                Title = "Failed to Create Category",
                Status = StatusCodes.Status400BadRequest,
                Detail = result.ErrorMessage
            });
        }

        return TypedResults.Created($"/api/v1/categories/{result.Value}", result.Value);
    }
}
