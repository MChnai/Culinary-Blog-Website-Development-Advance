export interface ApiEndpointDoc {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  module: 'Authentication' | 'Categories' | 'Recipes' | 'Health & System';
  summary: string;
  authRequired: boolean;
  requiredRole?: string;
  requestSample?: string;
  responseSample: string;
  statusCodes: { code: number; desc: string }[];
}

export const API_ENDPOINTS: ApiEndpointDoc[] = [
  // Authentication
  {
    method: 'POST',
    path: '/api/v1/auth/register',
    module: 'Authentication',
    summary: 'Đăng ký tài khoản mới (FR-AUTH-001) - Tự động gán role Author, cấp JWT & kích hoạt WelcomeEmailJob qua Hangfire',
    authRequired: false,
    requestSample: JSON.stringify(
      {
        fullName: 'Nguyễn Văn Minh',
        email: 'minh.chef@culinaryblog.vn',
        userName: 'minhchef',
        password: 'Password123@#',
      },
      null,
      2
    ),
    responseSample: JSON.stringify(
      {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'dGhpc19pc19hX3JhbmRvbV81MTJiaXRfdG9rZW4...',
        expiresAt: '2026-09-15T10:05:00Z',
        user: {
          id: 'usr-8a9d12f',
          fullName: 'Nguyễn Văn Minh',
          email: 'minh.chef@culinaryblog.vn',
          userName: 'minhchef',
          roles: ['Author'],
        },
      },
      null,
      2
    ),
    statusCodes: [
      { code: 201, desc: 'Đăng ký thành công và tự động cấp JWT' },
      { code: 409, desc: 'AUTH_EMAIL_EXISTS - Email đã được đăng ký trước đó' },
      { code: 422, desc: 'VALIDATION_ERROR - Mật khẩu hoặc dữ liệu đầu vào không hợp lệ' },
    ],
  },
  {
    method: 'POST',
    path: '/api/v1/auth/login',
    module: 'Authentication',
    summary: 'Đăng nhập bằng Email/Password (FR-AUTH-002) - Token rotation, chống user enumeration',
    authRequired: false,
    requestSample: JSON.stringify(
      {
        email: 'admin@culinaryblog.vn',
        password: 'AdminPassword123!',
      },
      null,
      2
    ),
    responseSample: JSON.stringify(
      {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: '4f90a8c2... (7 days valid)',
        expiresIn: 900,
        user: {
          id: 'usr-admin-001',
          displayName: 'Bếp Trưởng Quản Trị (Admin)',
          roles: ['Admin', 'Author'],
        },
      },
      null,
      2
    ),
    statusCodes: [
      { code: 200, desc: 'Đăng nhập thành công' },
      { code: 401, desc: 'AUTH_INVALID_CREDENTIALS - Sai email hoặc mật khẩu' },
      { code: 423, desc: 'LOCKED - Tài khoản tạm thời bị khóa do nhập sai 5 lần' },
    ],
  },
  {
    method: 'GET',
    path: '/api/v1/auth/me',
    module: 'Authentication',
    summary: 'Lấy thông tin hồ sơ người dùng hiện tại (FR-AUTH-006)',
    authRequired: true,
    responseSample: JSON.stringify(
      {
        id: 'usr-admin-001',
        email: 'admin@culinaryblog.vn',
        displayName: 'Bếp Trưởng Quản Trị (Admin)',
        avatarUrl: 'https://images.unsplash.com/...',
        bio: 'Bếp trưởng với 15 năm kinh nghiệm...',
        roles: ['Admin', 'Author'],
        emailConfirmed: true,
      },
      null,
      2
    ),
    statusCodes: [
      { code: 200, desc: 'Thành công' },
      { code: 401, desc: 'Chưa xác thực hoặc token hết hạn' },
    ],
  },

  // Categories
  {
    method: 'GET',
    path: '/api/v1/categories',
    module: 'Categories',
    summary: 'Xem danh sách danh mục (FR-CAT-001) - Cache IMemoryCache TTL 60m',
    authRequired: false,
    responseSample: JSON.stringify(
      [
        {
          id: 'cat-001',
          name: 'Món chính',
          slug: 'mon-chinh',
          description: 'Các món ăn no cho bữa cơm gia đình.',
          recipeCount: 3,
        },
        {
          id: 'cat-003',
          name: 'Bún & Phở',
          slug: 'bun-va-pho',
          description: 'Tinh hoa nước dùng và sợi truyền thống.',
          recipeCount: 2,
        },
      ],
      null,
      2
    ),
    statusCodes: [{ code: 200, desc: 'Thành công' }],
  },
  {
    method: 'POST',
    path: '/api/v1/categories',
    module: 'Categories',
    summary: 'Tạo danh mục mới (FR-CAT-003) - Quyền Admin, tự động sinh slug tiếng Việt',
    authRequired: true,
    requiredRole: 'Admin',
    requestSample: JSON.stringify(
      {
        name: 'Món Chay Thanh Đạm',
        description: 'Tổng hợp các món chay thanh tịnh tốt cho sức khỏe.',
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
      },
      null,
      2
    ),
    responseSample: JSON.stringify(
      {
        id: 'cat-9b2f44',
        name: 'Món Chay Thanh Đạm',
        slug: 'mon-chay-thanh-dam',
        description: 'Tổng hợp các món chay thanh tịnh tốt cho sức khỏe.',
        recipeCount: 0,
      },
      null,
      2
    ),
    statusCodes: [
      { code: 201, desc: 'Tạo thành công, cache invalidated' },
      { code: 403, desc: 'Forbidden - Chỉ Admin mới có quyền' },
      { code: 409, desc: 'CATEGORY_NAME_EXISTS - Tên danh mục đã tồn tại' },
    ],
  },
  {
    method: 'DELETE',
    path: '/api/v1/categories/{id}',
    module: 'Categories',
    summary: 'Xóa danh mục (FR-CAT-005) - Soft constraint: không cho xóa nếu còn công thức',
    authRequired: true,
    requiredRole: 'Admin',
    responseSample: '{} (204 No Content)',
    statusCodes: [
      { code: 204, desc: 'Xóa danh mục thành công' },
      { code: 409, desc: 'CATEGORY_DELETE_HAS_RECIPES - Danh mục còn chứa công thức' },
      { code: 404, desc: 'CATEGORY_NOT_FOUND' },
    ],
  },

  // Recipes
  {
    method: 'GET',
    path: '/api/v1/recipes',
    module: 'Recipes',
    summary: 'Danh sách công thức phân trang, lọc & sắp xếp (FR-RCP-001)',
    authRequired: false,
    responseSample: JSON.stringify(
      {
        items: [
          {
            id: 'rcp-001',
            title: 'Phở Bò Tái Lăn Hà Nội Chuẩn Vị',
            slug: 'pho-bo-tai-lan-ha-noi-chuan-vi',
            prepTime: 40,
            cookTime: 180,
            difficulty: 3,
            status: 1,
            categoryName: 'Bún & Phở',
            authorName: 'Nguyễn Văn Hùng',
          },
        ],
        totalCount: 6,
        page: 1,
        pageSize: 12,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
      null,
      2
    ),
    statusCodes: [
      { code: 200, desc: 'Thành công' },
      { code: 422, desc: 'Tham số phân trang hoặc lọc không hợp lệ' },
    ],
  },
  {
    method: 'GET',
    path: '/api/v1/recipes/search?q={keyword}',
    module: 'Recipes',
    summary: 'Full-Text Search PostgreSQL tsvector + unaccent tiếng Việt (FR-SRCH-001)',
    authRequired: false,
    responseSample: JSON.stringify(
      {
        items: [
          {
            id: 'rcp-001',
            title: 'Phở Bò Tái Lăn Hà Nội Chuẩn Vị',
            relevanceScore: 85,
            slug: 'pho-bo-tai-lan-ha-noi-chuan-vi',
          },
        ],
        totalCount: 1,
      },
      null,
      2
    ),
    statusCodes: [
      { code: 200, desc: 'Thành công' },
      { code: 422, desc: 'Từ khóa tìm kiếm quá ngắn (< 2 ký tự)' },
    ],
  },
  {
    method: 'GET',
    path: '/api/v1/recipes/{slug}',
    module: 'Recipes',
    summary: 'Chi tiết công thức theo Slug (FR-RCP-002) - Eager loading steps, ingredients, nutrition, author',
    authRequired: false,
    responseSample: JSON.stringify(
      {
        id: 'rcp-001',
        title: 'Phở Bò Tái Lăn Hà Nội Chuẩn Vị',
        slug: 'pho-bo-tai-lan-ha-noi-chuan-vi',
        prepTime: 40,
        cookTime: 180,
        servings: 4,
        nutrition: { calories: 520, protein: 34, carbohydrates: 62, fat: 14 },
        steps: [{ stepNumber: 1, title: 'Sơ chế xương bò', timerMinutes: 10 }],
        ingredients: [{ name: 'Bánh phở tươi', quantity: 600, unit: 'gram' }],
        rowVersion: 'AAAAAAAAB9A=',
      },
      null,
      2
    ),
    statusCodes: [
      { code: 200, desc: 'Thành công' },
      { code: 404, desc: 'RECIPE_NOT_FOUND' },
      { code: 403, desc: 'RECIPE_FORBIDDEN - Công thức Draft chỉ tác giả sở hữu hoặc Admin mới xem được' },
    ],
  },
  {
    method: 'POST',
    path: '/api/v1/recipes',
    module: 'Recipes',
    summary: 'Tạo công thức mới (FR-RCP-003) - Trạng thái mặc định Draft, auto slug, dispatch MediatR CreateRecipeCommand',
    authRequired: true,
    requiredRole: 'Author',
    requestSample: JSON.stringify(
      {
        title: 'Bánh Cuốn Nóng Tráng Tay Hà Nội',
        description: 'Bánh cuốn tráng mỏng mềm mướt cuộn nhân mộc nhĩ thịt nạc băm thơm ngậy hành phi.',
        categoryId: 'cat-003',
        prepTime: 30,
        cookTime: 20,
        servings: 4,
        difficulty: 2,
        steps: [
          { stepNumber: 1, title: 'Pha bột bánh', description: 'Trộn bột gạo tẻ và bột năng với nước và dầu ăn.' },
        ],
        ingredients: [
          { name: 'Bột gạo tẻ', quantity: 200, unit: 'gram' },
        ],
      },
      null,
      2
    ),
    responseSample: JSON.stringify(
      {
        id: 'rcp-72fa91',
        title: 'Bánh Cuốn Nóng Tráng Tay Hà Nội',
        slug: 'banh-cuon-nong-trang-tay-ha-noi',
        status: 0, // Draft
      },
      null,
      2
    ),
    statusCodes: [
      { code: 201, desc: 'Tạo công thức thành công (Draft)' },
      { code: 401, desc: 'Unauthorized' },
      { code: 422, desc: 'VALIDATION_ERROR' },
    ],
  },
  {
    method: 'PATCH',
    path: '/api/v1/recipes/{id}/publish',
    module: 'Recipes',
    summary: 'Xuất bản công thức (FR-RCP-005) - Kiểm tra ít nhất 1 step & 1 ingredient',
    authRequired: true,
    requiredRole: 'Owner / Admin',
    responseSample: JSON.stringify({ status: 1, publishedAt: '2026-09-15T09:40:00Z' }, null, 2),
    statusCodes: [
      { code: 200, desc: 'Xuất bản thành công' },
      { code: 400, desc: 'RECIPE_PUBLISH_INCOMPLETE - Thiếu bước hoặc nguyên liệu' },
      { code: 403, desc: 'RECIPE_FORBIDDEN - Không phải tác giả sở hữu hoặc Admin' },
    ],
  },

  // Health
  {
    method: 'GET',
    path: '/health',
    module: 'Health & System',
    summary: 'Health check tổng thể (FR-OBS-001) - Kiểm tra PostgreSQL 16, Redis 7, MinIO S3',
    authRequired: false,
    responseSample: JSON.stringify(
      {
        status: 'Healthy',
        totalDuration: '00:00:00.0123512',
        entries: {
          npgsql: { status: 'Healthy', description: 'PostgreSQL 16 active on port 5432' },
          redis: { status: 'Healthy', description: 'Redis 7 ping OK on port 6379' },
          minio: { status: 'Healthy', description: 'MinIO S3 bucket culinary-blog accessible' },
        },
      },
      null,
      2
    ),
    statusCodes: [
      { code: 200, desc: 'Healthy' },
      { code: 503, desc: 'Unhealthy' },
    ],
  },
];

export const CSHARP_CLEAN_ARCHITECTURE_SNIPPETS = {
  domainRecipe: `// ==========================================
// 1. DOMAIN LAYER: CulinaryBlog.Domain/Entities/Recipe.cs
// Không phụ thuộc bất kỳ NuGet package nào ngoài .NET BCL
// ==========================================
namespace CulinaryBlog.Domain.Entities;

public class Recipe : BaseEntity
{
    public string Title { get; private set; } = null!;
    public string Slug { get; private set; } = null!;
    public string Description { get; private set; } = null!;
    public string Instructions { get; private set; } = null!;
    public int PrepTime { get; private set; } // minutes
    public int CookTime { get; private set; } // minutes
    public int Servings { get; private set; }
    public RecipeDifficulty Difficulty { get; private set; }
    public RecipeStatus Status { get; private set; }
    public DateTime? PublishedAt { get; private set; }

    // Foreign Keys & Navigations
    public Guid CategoryId { get; private set; }
    public virtual Category Category { get; private set; } = null!;
    public string AuthorId { get; private set; } = null!;
    public virtual ApplicationUser Author { get; private set; } = null!;

    // Owned Entity (Cột trong bảng Recipes)
    public RecipeNutrition? Nutrition { get; private set; }

    // Collections
    public virtual ICollection<RecipeStep> Steps { get; private set; } = new List<RecipeStep>();
    public virtual ICollection<RecipeIngredient> Ingredients { get; private set; } = new List<RecipeIngredient>();
    public virtual ICollection<RecipeImage> Images { get; private set; } = new List<RecipeImage>();

    // PostgreSQL tsvector computed column
    public NpgsqlTypes.NpgsqlTsVector? SearchVector { get; private set; }

    public static Recipe Create(string title, string description, Guid categoryId, string authorId,
        int prepTime, int cookTime, int servings, RecipeDifficulty difficulty)
    {
        return new Recipe
        {
            Id = Guid.NewGuid(),
            Title = title,
            Slug = SlugHelper.Generate(title),
            Description = description,
            CategoryId = categoryId,
            AuthorId = authorId,
            PrepTime = prepTime,
            CookTime = cookTime,
            Servings = servings,
            Difficulty = difficulty,
            Status = RecipeStatus.Draft, // Mặc định Draft theo FR-RCP-003
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Publish()
    {
        if (!Steps.Any() || !Ingredients.Any())
            throw new DomainException("Công thức phải có ít nhất 1 bước thực hiện và 1 nguyên liệu trước khi xuất bản.");

        Status = RecipeStatus.Published;
        PublishedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }
}`,

  applicationMediatr: `// ==========================================
// 2. APPLICATION LAYER: CulinaryBlog.Application/Features/Recipes/Commands/CreateRecipeCommand.cs
// CQRS Pattern với MediatR + FluentValidation
// ==========================================
namespace CulinaryBlog.Application.Features.Recipes.Commands;

public record CreateRecipeCommand(
    string Title,
    string Description,
    Guid CategoryId,
    int PrepTimeMinutes,
    int CookTimeMinutes,
    int Servings,
    RecipeDifficulty Difficulty,
    List<CreateRecipeStepDto>? Steps,
    List<CreateRecipeIngredientDto>? Ingredients
) : IRequest<RecipeDto>, ICacheInvalidator;

public class CreateRecipeCommandValidator : AbstractValidator<CreateRecipeCommand>
{
    public CreateRecipeCommandValidator()
    {
        RuleFor(x => x.Title).NotEmpty().Length(5, 200);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.PrepTimeMinutes).GreaterThan(0);
        RuleFor(x => x.CookTimeMinutes).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Servings).GreaterThan(0);
        RuleFor(x => x.CategoryId).NotEmpty();
    }
}

public class CreateRecipeCommandHandler : IRequestHandler<CreateRecipeCommand, RecipeDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;
    private readonly IBackgroundJobClient _backgroundJobs;

    public CreateRecipeCommandHandler(IUnitOfWork uow, ICurrentUser user, IBackgroundJobClient jobs)
    {
        _unitOfWork = uow;
        _currentUser = user;
        _backgroundJobs = jobs;
    }

    public async Task<RecipeDto> Handle(CreateRecipeCommand request, CancellationToken ct)
    {
        var category = await _unitOfWork.Categories.GetByIdAsync(request.CategoryId, ct)
            ?? throw new NotFoundException($"Danh mục {request.CategoryId} không tồn tại.");

        var recipe = Recipe.Create(
            request.Title, request.Description, request.CategoryId,
            _currentUser.UserId!, request.PrepTimeMinutes,
            request.CookTimeMinutes, request.Servings, request.Difficulty);

        await _unitOfWork.Recipes.AddAsync(recipe, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        // Kích hoạt background job Hangfire để xử lý ảnh & index
        _backgroundJobs.Enqueue<IFileStorageService>(s => s.OptimizeRecipeAssetsAsync(recipe.Id));

        return recipe.ToDto();
    }
}`,

  presentationMinimalApi: `// ==========================================
// 3. PRESENTATION LAYER: CulinaryBlog.API/Endpoints/RecipesEndpoints.cs
// ASP.NET 10 Core Minimal APIs với MapGroup & TypedResults
// ==========================================
namespace CulinaryBlog.API.Endpoints;

public static class RecipesEndpoints
{
    public static RouteGroupBuilder MapRecipesEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/", async (
            [AsParameters] RecipeQueryParams query,
            IMediator mediator) =>
        {
            var result = await mediator.Send(new GetRecipesQuery(query));
            return TypedResults.Ok(result);
        })
        .WithName("GetRecipes")
        .CacheOutput("RecipeList"); // .NET 10 Output Cache

        group.MapGet("/{slug}", async (string slug, IMediator mediator) =>
        {
            var recipe = await mediator.Send(new GetRecipeBySlugQuery(slug));
            return TypedResults.Ok(recipe);
        })
        .WithName("GetRecipeBySlug")
        .CacheOutput("RecipeDetail");

        group.MapGet("/search", async (
            [FromQuery] string q,
            [FromQuery] int page,
            [FromQuery] int pageSize,
            IMediator mediator) =>
        {
            var results = await mediator.Send(new SearchRecipesQuery(q, page, pageSize));
            return TypedResults.Ok(results);
        })
        .WithName("SearchRecipes");

        group.MapPost("/", async (
            CreateRecipeCommand command,
            IMediator mediator) =>
        {
            var created = await mediator.Send(command);
            return TypedResults.Created($"/api/v1/recipes/{created.Slug}", created);
        })
        .RequireAuthorization("AuthorPolicy") // RBAC
        .AddEndpointFilter<ValidationFilter<CreateRecipeCommand>>();

        group.MapPatch("/{id:guid}/publish", async (
            Guid id,
            IMediator mediator) =>
        {
            var result = await mediator.Send(new PublishRecipeCommand(id, IsPublish: true));
            return TypedResults.Ok(result);
        })
        .RequireAuthorization("AuthorPolicy");

        return group;
    }
}`,

  postgresSchemaDdl: `-- =========================================================
-- 4. DATABASE: PostgreSQL 16 Schema với DDL, tsvector & triggers
-- Database: culinary_blog_db (PostgreSQL 16)
-- =========================================================

-- Kích hoạt extensions bắt buộc theo CONS-006 & FR-SRCH-001
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Bảng Danh mục (Categories)
CREATE TABLE "Categories" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name" VARCHAR(100) NOT NULL,
    "Slug" VARCHAR(120) NOT NULL UNIQUE,
    "Description" TEXT NULL,
    "ImageUrl" VARCHAR(500) NULL,
    "OrderIndex" INT NOT NULL DEFAULT 0,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMPTZ NULL,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "RowVersion" BYTEA NOT NULL DEFAULT decode('00000000', 'hex')
);
CREATE UNIQUE INDEX "IDX_Category_Slug" ON "Categories"("Slug") WHERE "IsDeleted" = FALSE;

-- Bảng Công thức (Recipes) với Owned Entity Nutrition & tsvector
CREATE TABLE "Recipes" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Title" VARCHAR(200) NOT NULL,
    "Slug" VARCHAR(220) NOT NULL UNIQUE,
    "Description" TEXT NOT NULL,
    "Instructions" TEXT NOT NULL,
    "PrepTime" INT NOT NULL CHECK ("PrepTime" > 0),
    "CookTime" INT NOT NULL CHECK ("CookTime" >= 0),
    "Servings" INT NOT NULL CHECK ("Servings" > 0),
    "Difficulty" SMALLINT NOT NULL DEFAULT 1, -- 1: Easy, 2: Medium, 3: Hard, 4: Expert
    "Status" SMALLINT NOT NULL DEFAULT 0,     -- 0: Draft, 1: Published, 2: Archived
    "PublishedAt" TIMESTAMPTZ NULL,
    "CategoryId" UUID NOT NULL REFERENCES "Categories"("Id") ON DELETE RESTRICT,
    "AuthorId" VARCHAR(450) NOT NULL REFERENCES "AspNetUsers"("Id"),
    
    -- Owned Entity: RecipeNutrition (nhúng trực tiếp)
    "Nutrition_Calories" DECIMAL(8,2) NULL,
    "Nutrition_Protein" DECIMAL(8,2) NULL,
    "Nutrition_Carbohydrates" DECIMAL(8,2) NULL,
    "Nutrition_Fat" DECIMAL(8,2) NULL,
    "Nutrition_Fiber" DECIMAL(8,2) NULL,
    "Nutrition_Sodium" DECIMAL(8,2) NULL,

    -- Full-Text Search tsvector
    "SearchVector" TSVECTOR NULL,

    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMPTZ NULL,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "RowVersion" BYTEA NOT NULL
);

-- Chỉ mục Full-Text Search GIN
CREATE INDEX "IDX_Recipe_Search" ON "Recipes" USING GIN("SearchVector");
CREATE INDEX "IDX_Recipe_Slug" ON "Recipes"("Slug") WHERE "IsDeleted" = FALSE;
CREATE INDEX "IDX_Recipe_CategoryId" ON "Recipes"("CategoryId");
CREATE INDEX "IDX_Recipe_AuthorId" ON "Recipes"("AuthorId");

-- PostgreSQL Trigger tự động cập nhật SearchVector bằng unaccent tiếng Việt
CREATE OR REPLACE FUNCTION recipes_search_vector_trigger() RETURNS trigger AS $$
BEGIN
  new."SearchVector" :=
     setweight(to_tsvector('vietnamese', unaccent(coalesce(new."Title", ''))), 'A') ||
     setweight(to_tsvector('vietnamese', unaccent(coalesce(new."Description", ''))), 'B');
  return new;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recipes_update_search_vector
BEFORE INSERT OR UPDATE ON "Recipes"
FOR EACH ROW EXECUTE FUNCTION recipes_search_vector_trigger();`,
};
