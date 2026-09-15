import { Category, Recipe, ApplicationUser, RecipeStatus, RecipeDifficulty, HangfireJob, SystemLogEntry, ProblemDetails } from '../types';
import { SEED_CATEGORIES, SEED_RECIPES, SEED_USERS } from '../data/seedData';

// Vietnamese unaccent utility simulating PostgreSQL unaccent extension
export function removeVietnameseAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

// Slug generator matching SlugHelper.Generate(title)
export function slugify(text: string): string {
  const unaccented = removeVietnameseAccents(text);
  return unaccented
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const STORAGE_KEY_RECIPES = 'culinary_blog_recipes_v1';
const STORAGE_KEY_CATEGORIES = 'culinary_blog_categories_v1';
const STORAGE_KEY_USERS = 'culinary_blog_users_v1';
const STORAGE_KEY_CURRENT_USER = 'culinary_blog_current_user_v1';
const STORAGE_KEY_JOBS = 'culinary_blog_hangfire_jobs_v1';
const STORAGE_KEY_LOGS = 'culinary_blog_logs_v1';

class DatabaseEngine {
  private recipes: Recipe[] = [];
  private categories: Category[] = [];
  private users: ApplicationUser[] = [];
  private currentUser: ApplicationUser | null = null;
  private jobs: HangfireJob[] = [];
  private logs: SystemLogEntry[] = [];
  private redisCache = new Map<string, { data: any; expiry: number }>();

  constructor() {
    this.init();
  }

  private init() {
    // Load or seed users
    const cachedUsers = localStorage.getItem(STORAGE_KEY_USERS);
    if (cachedUsers) {
      try {
        this.users = JSON.parse(cachedUsers);
      } catch {
        this.users = [...SEED_USERS];
      }
    } else {
      this.users = [...SEED_USERS];
      this.persistUsers();
    }

    // Current user defaults to Admin or Author for demo convenience, stored in localStorage
    const cachedCurrent = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (cachedCurrent) {
      try {
        this.currentUser = JSON.parse(cachedCurrent);
      } catch {
        this.currentUser = this.users[0]; // Admin by default
      }
    } else {
      this.currentUser = this.users[0]; // Admin
      this.persistCurrentUser();
    }

    // Load or seed categories
    const cachedCategories = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (cachedCategories) {
      try {
        this.categories = JSON.parse(cachedCategories);
      } catch {
        this.categories = [...SEED_CATEGORIES];
      }
    } else {
      this.categories = [...SEED_CATEGORIES];
      this.persistCategories();
    }

    // Load or seed recipes
    const cachedRecipes = localStorage.getItem(STORAGE_KEY_RECIPES);
    if (cachedRecipes) {
      try {
        this.recipes = JSON.parse(cachedRecipes);
      } catch {
        this.recipes = [...SEED_RECIPES];
      }
    } else {
      this.recipes = [...SEED_RECIPES];
      this.persistRecipes();
    }

    // Load or seed jobs
    const cachedJobs = localStorage.getItem(STORAGE_KEY_JOBS);
    if (cachedJobs) {
      try {
        this.jobs = JSON.parse(cachedJobs);
      } catch {
        this.initJobs();
      }
    } else {
      this.initJobs();
    }

    // Load logs
    const cachedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
    if (cachedLogs) {
      try {
        this.logs = JSON.parse(cachedLogs);
      } catch {
        this.logs = [];
      }
    }
  }

  private initJobs() {
    this.jobs = [
      {
        id: 'job-001',
        jobName: 'SitemapGenerationJob (FR-JOB-003)',
        type: 'Recurring',
        status: 'Succeeded',
        triggerReason: 'Cron "0 2 * * *" (Hàng ngày lúc 02:00 AM UTC)',
        createdAt: '2026-09-15T02:00:00Z',
        executedAt: '2026-09-15T02:00:05Z',
        retryCount: 0,
        details: 'Đã tạo sitemap.xml với 6 recipes đã publish và 5 categories.',
      },
      {
        id: 'job-002',
        jobName: 'WelcomeEmailJob (FR-JOB-001)',
        type: 'Fire-and-forget',
        status: 'Succeeded',
        triggerReason: 'User registered: chef.nguyen@culinaryblog.vn',
        createdAt: '2026-01-15T10:30:00Z',
        executedAt: '2026-01-15T10:30:02Z',
        retryCount: 0,
        details: 'Gửi email chào mừng kích hoạt tài khoản thành công qua MailKit.',
      },
      {
        id: 'job-003',
        jobName: 'ImageResizeJob (FR-JOB-002)',
        type: 'Fire-and-forget',
        status: 'Succeeded',
        triggerReason: 'Uploaded recipe hero image',
        createdAt: '2026-02-10T09:05:00Z',
        executedAt: '2026-02-10T09:05:03Z',
        retryCount: 0,
        details: 'Sinh 3 phiên bản ảnh (Original, Medium 800x600, Thumbnail 300x300) lưu vào MinIO bucket.',
      },
    ];
    this.persistJobs();
  }

  private persistRecipes() {
    localStorage.setItem(STORAGE_KEY_RECIPES, JSON.stringify(this.recipes));
    this.updateCategoryRecipeCounts();
  }

  private persistCategories() {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(this.categories));
  }

  private persistUsers() {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
  }

  private persistCurrentUser() {
    if (this.currentUser) {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    }
  }

  private persistJobs() {
    localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(this.jobs));
  }

  private persistLogs() {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(this.logs.slice(0, 100)));
  }

  public addLog(method: string, requestPath: string, statusCode: number, elapsedMs: number, message: string) {
    const entry: SystemLogEntry = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      level: statusCode >= 500 ? 'Error' : statusCode >= 400 ? 'Warning' : 'Information',
      correlationId: 'req-' + Math.random().toString(36).substring(2, 10),
      requestPath,
      method,
      statusCode,
      elapsedMs,
      userId: this.currentUser?.id,
      message,
    };
    this.logs.unshift(entry);
    this.persistLogs();
  }

  public getLogs(): SystemLogEntry[] {
    return [...this.logs];
  }

  // Cache operations simulating Redis 7
  public getCached<T>(key: string): T | null {
    const item = this.redisCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.redisCache.delete(key);
      return null;
    }
    return item.data as T;
  }

  public setCache(key: string, data: any, ttlSeconds: number) {
    this.redisCache.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  public evictCachePattern(prefix: string) {
    for (const key of Array.from(this.redisCache.keys())) {
      if (key.startsWith(prefix)) {
        this.redisCache.delete(key);
      }
    }
  }

  // Users & Auth operations (FR-AUTH)
  public getCurrentUser(): ApplicationUser | null {
    return this.currentUser;
  }

  public setCurrentUser(user: ApplicationUser | null) {
    this.currentUser = user;
    this.persistCurrentUser();
  }

  public getAllUsers(): ApplicationUser[] {
    return [...this.users];
  }

  public switchUserRole(role: 'Guest' | 'Author' | 'Admin') {
    if (role === 'Guest') {
      this.setCurrentUser(null);
    } else if (role === 'Admin') {
      const admin = this.users.find(u => u.roles.includes('Admin')) || this.users[0];
      this.setCurrentUser(admin);
    } else {
      const author = this.users.find(u => u.roles.includes('Author') && !u.roles.includes('Admin')) || this.users[1];
      this.setCurrentUser(author);
    }
  }

  public registerUser(fullName: string, email: string, userName: string): { user?: ApplicationUser; error?: ProblemDetails } {
    const existing = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return {
        error: {
          type: 'AUTH_EMAIL_EXISTS',
          title: 'Conflict',
          status: 409,
          detail: `Email '${email}' đã được đăng ký bởi tài khoản khác trong hệ thống.`,
        },
      };
    }

    const newUser: ApplicationUser = {
      id: 'usr-' + Math.random().toString(36).substring(2, 9),
      email,
      userName: userName || email.split('@')[0],
      displayName: fullName,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
      bio: 'Thành viên mới của cộng đồng ẩm thực.',
      isActive: true,
      emailConfirmed: true,
      roles: ['Author'],
      createdAt: new Date().toISOString(),
    };

    this.users.push(newUser);
    this.persistUsers();
    this.setCurrentUser(newUser);

    // Enqueue welcome email job via Hangfire
    this.enqueueJob('WelcomeEmailJob (FR-JOB-001)', 'Fire-and-forget', `Email chào mừng gửi đến ${email}`, `MailKit SMTP gửi email kích hoạt tài khoản cho ${fullName}.`);

    this.addLog('POST', '/api/v1/auth/register', 201, 48, `User registered: ${email}`);
    return { user: newUser };
  }

  public updateUserProfile(data: { displayName?: string; avatarUrl?: string; bio?: string }): ApplicationUser | null {
    if (!this.currentUser) return null;
    const user = this.users.find(u => u.id === this.currentUser!.id);
    if (!user) return null;

    if (data.displayName !== undefined) user.displayName = data.displayName;
    if (data.avatarUrl !== undefined) user.avatarUrl = data.avatarUrl;
    if (data.bio !== undefined) user.bio = data.bio;

    this.currentUser = { ...user };
    this.persistUsers();
    this.persistCurrentUser();
    this.addLog('PATCH', '/api/v1/auth/me', 200, 22, `Profile updated for ${user.email}`);
    return user;
  }

  // Hangfire jobs
  public getJobs(): HangfireJob[] {
    return [...this.jobs];
  }

  public enqueueJob(name: string, type: 'Fire-and-forget' | 'Delayed' | 'Recurring', triggerReason: string, details: string) {
    const job: HangfireJob = {
      id: 'job-' + Math.random().toString(36).substring(2, 9),
      jobName: name,
      type,
      status: 'Succeeded',
      triggerReason,
      createdAt: new Date().toISOString(),
      executedAt: new Date().toISOString(),
      retryCount: 0,
      details,
    };
    this.jobs.unshift(job);
    this.persistJobs();
  }

  // Categories operations (FR-CAT)
  public getCategories(): Category[] {
    const cacheKey = 'categories:all';
    const cached = this.getCached<Category[]>(cacheKey);
    if (cached) return cached;

    const list = this.categories
      .filter(c => !c.isDeleted)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    
    this.setCache(cacheKey, list, 3600); // 1 hour TTL
    return list;
  }

  public getCategoryBySlug(slug: string): Category | null {
    return this.categories.find(c => !c.isDeleted && c.slug === slug) || null;
  }

  public createCategory(name: string, description?: string, imageUrl?: string): { category?: Category; error?: ProblemDetails } {
    const slug = slugify(name);
    if (this.categories.some(c => !c.isDeleted && c.slug === slug)) {
      return {
        error: {
          type: 'CATEGORY_NAME_EXISTS',
          title: 'Conflict',
          status: 409,
          detail: `Danh mục với tên '${name}' hoặc slug '${slug}' đã tồn tại trong hệ thống.`,
        },
      };
    }

    const newCategory: Category = {
      id: 'cat-' + Math.random().toString(36).substring(2, 9),
      name,
      slug,
      description,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80',
      orderIndex: this.categories.length + 1,
      recipeCount: 0,
      createdAt: new Date().toISOString(),
      isDeleted: false,
    };

    this.categories.push(newCategory);
    this.persistCategories();
    this.evictCachePattern('categories:');
    this.addLog('POST', '/api/v1/categories', 201, 35, `Category created: ${name} (${slug})`);
    return { category: newCategory };
  }

  public updateCategory(id: string, name: string, description?: string): { category?: Category; error?: ProblemDetails } {
    const cat = this.categories.find(c => c.id === id && !c.isDeleted);
    if (!cat) {
      return {
        error: {
          type: 'CATEGORY_NOT_FOUND',
          title: 'Not Found',
          status: 404,
          detail: `Không tìm thấy danh mục với ID '${id}'.`,
        },
      };
    }

    cat.name = name;
    if (description !== undefined) cat.description = description;
    cat.updatedAt = new Date().toISOString();

    this.persistCategories();
    this.evictCachePattern('categories:');
    this.addLog('PUT', `/api/v1/categories/${id}`, 200, 28, `Category updated: ${name}`);
    return { category: cat };
  }

  public deleteCategory(id: string): { success: boolean; error?: ProblemDetails } {
    const cat = this.categories.find(c => c.id === id && !c.isDeleted);
    if (!cat) {
      return {
        success: false,
        error: {
          type: 'CATEGORY_NOT_FOUND',
          title: 'Not Found',
          status: 404,
          detail: `Không tìm thấy danh mục với ID '${id}'.`,
        },
      };
    }

    // Business rule: KHÔNG được xóa danh mục còn chứa công thức
    const recipeCount = this.recipes.filter(r => !r.isDeleted && r.categoryId === id).length;
    if (recipeCount > 0) {
      return {
        success: false,
        error: {
          type: 'CATEGORY_DELETE_HAS_RECIPES',
          title: 'Conflict',
          status: 409,
          detail: `Không thể xóa danh mục '${cat.name}' vì đang chứa ${recipeCount} công thức. Vui lòng chuyển công thức sang danh mục khác trước.`,
        },
      };
    }

    cat.isDeleted = true;
    this.persistCategories();
    this.evictCachePattern('categories:');
    this.addLog('DELETE', `/api/v1/categories/${id}`, 204, 30, `Category deleted: ${cat.name}`);
    return { success: true };
  }

  private updateCategoryRecipeCounts() {
    this.categories.forEach(cat => {
      cat.recipeCount = this.recipes.filter(r => !r.isDeleted && r.status === RecipeStatus.Published && r.categoryId === cat.id).length;
    });
  }

  // Recipes operations (FR-RCP & FR-SRCH)
  public getRecipes(params: {
    page?: number;
    pageSize?: number;
    categoryId?: string;
    difficulty?: number;
    maxCookTime?: number;
    status?: RecipeStatus;
    sort?: string;
  }) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 12;

    let list = this.recipes.filter(r => !r.isDeleted);

    // Role filtering: Guest only sees Published; Author sees Published + Draft of self; Admin sees all
    const user = this.currentUser;
    if (!user) {
      list = list.filter(r => r.status === RecipeStatus.Published);
    } else if (user.roles.includes('Admin')) {
      // Admin sees all
      if (params.status !== undefined) {
        list = list.filter(r => r.status === params.status);
      }
    } else {
      // Author
      list = list.filter(r => r.status === RecipeStatus.Published || r.authorId === user.id);
      if (params.status !== undefined) {
        list = list.filter(r => r.status === params.status);
      }
    }

    // Filters
    if (params.categoryId) {
      list = list.filter(r => r.categoryId === params.categoryId);
    }
    if (params.difficulty) {
      list = list.filter(r => r.difficulty === params.difficulty);
    }
    if (params.maxCookTime) {
      list = list.filter(r => r.cookTime <= params.maxCookTime!);
    }

    // Populate category & author objects
    list = list.map(r => ({
      ...r,
      category: this.categories.find(c => c.id === r.categoryId),
      author: this.users.find(u => u.id === r.authorId),
    }));

    // Sorting
    const sortField = params.sort || '-createdAt';
    list.sort((a, b) => {
      if (sortField === '-createdAt') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortField === 'createdAt') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortField === 'title') return a.title.localeCompare(b.title);
      if (sortField === '-cookTime') return b.cookTime - a.cookTime;
      if (sortField === 'cookTime') return a.cookTime - b.cookTime;
      return 0;
    });

    const totalCount = list.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const items = list.slice((page - 1) * pageSize, page * pageSize);

    return {
      items,
      totalCount,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  public getRecipeBySlug(slug: string): { recipe?: Recipe; error?: ProblemDetails } {
    const r = this.recipes.find(rec => !rec.isDeleted && rec.slug === slug);
    if (!r) {
      return {
        error: {
          type: 'RECIPE_NOT_FOUND',
          title: 'Not Found',
          status: 404,
          detail: `Không tìm thấy công thức nấu ăn với slug '${slug}'.`,
        },
      };
    }

    // Permission check for Draft / Archived
    if (r.status !== RecipeStatus.Published) {
      const user = this.currentUser;
      const isOwner = user && user.id === r.authorId;
      const isAdmin = user && user.roles.includes('Admin');
      if (!isOwner && !isAdmin) {
        return {
          error: {
            type: 'RECIPE_FORBIDDEN',
            title: 'Forbidden',
            status: 403,
            detail: 'Bạn không có quyền truy cập công thức đang ở trạng thái Bản thảo hoặc Lưu trữ.',
          },
        };
      }
    }

    const populated: Recipe = {
      ...r,
      category: this.categories.find(c => c.id === r.categoryId),
      author: this.users.find(u => u.id === r.authorId),
    };

    return { recipe: populated };
  }

  // Full-Text Search simulating PostgreSQL tsvector + unaccent + ts_rank (FR-SRCH-001)
  public searchRecipes(keyword: string, categoryId?: string, difficulty?: number) {
    if (!keyword || keyword.trim().length < 2) {
      return { items: [], totalCount: 0 };
    }

    const normalizedQuery = removeVietnameseAccents(keyword);
    const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

    // Only search Published recipes (or author's own drafts if logged in)
    const candidates = this.recipes.filter(r => !r.isDeleted && r.status === RecipeStatus.Published);

    const scored = candidates
      .map(recipe => {
        const titleNorm = removeVietnameseAccents(recipe.title);
        const descNorm = removeVietnameseAccents(recipe.description);
        const ingNorm = recipe.ingredients.map(i => removeVietnameseAccents(i.name)).join(' ');

        let score = 0;
        for (const token of queryTokens) {
          if (titleNorm.includes(token)) score += 5; // higher weight for title
          if (descNorm.includes(token)) score += 2;
          if (ingNorm.includes(token)) score += 1;
        }

        // Exact match boost
        if (titleNorm.includes(normalizedQuery)) score += 10;

        return { recipe, score };
      })
      .filter(item => item.score > 0);

    let filtered = scored;
    if (categoryId) {
      filtered = filtered.filter(item => item.recipe.categoryId === categoryId);
    }
    if (difficulty) {
      filtered = filtered.filter(item => item.recipe.difficulty === difficulty);
    }

    filtered.sort((a, b) => b.score - a.score);

    const populated = filtered.map(item => ({
      ...item.recipe,
      category: this.categories.find(c => c.id === item.recipe.categoryId),
      author: this.users.find(u => u.id === item.recipe.authorId),
      relevanceScore: Math.min(100, Math.round(item.score * 7)),
    }));

    this.addLog('GET', `/api/v1/recipes/search?q=${encodeURIComponent(keyword)}`, 200, 18, `FTS search for '${keyword}': ${populated.length} hits`);
    return {
      items: populated,
      totalCount: populated.length,
    };
  }

  public createRecipe(data: Partial<Recipe>): { recipe?: Recipe; error?: ProblemDetails } {
    const user = this.currentUser;
    if (!user || (!user.roles.includes('Author') && !user.roles.includes('Admin'))) {
      return {
        error: {
          type: 'AUTH_UNAUTHORIZED',
          title: 'Unauthorized',
          status: 401,
          detail: 'Yêu cầu quyền Tác giả (Author) hoặc Quản trị viên (Admin) để tạo công thức.',
        },
      };
    }

    if (!data.title || data.title.length < 5) {
      return {
        error: {
          type: 'VALIDATION_ERROR',
          title: 'Validation Failed',
          status: 422,
          detail: 'Tiêu đề công thức phải có ít nhất 5 ký tự.',
          errors: { Title: ['Tiêu đề công thức phải từ 5 đến 200 ký tự.'] },
        },
      };
    }

    const baseSlug = slugify(data.title);
    let uniqueSlug = baseSlug;
    let suffix = 1;
    while (this.recipes.some(r => !r.isDeleted && r.slug === uniqueSlug)) {
      uniqueSlug = `${baseSlug}-${suffix++}`;
    }

    const recipeId = 'rcp-' + Math.random().toString(36).substring(2, 9);

    const steps = (data.steps || []).map((s, idx) => ({
      ...s,
      id: s.id || `stp-${recipeId}-${idx + 1}`,
      recipeId,
      stepNumber: idx + 1,
    }));

    const ingredients = (data.ingredients || []).map((ing, idx) => ({
      ...ing,
      id: ing.id || `ing-${recipeId}-${idx + 1}`,
      recipeId,
      orderIndex: idx + 1,
    }));

    const images = (data.images && data.images.length > 0)
      ? data.images.map((img, idx) => ({
          ...img,
          id: img.id || `img-${recipeId}-${idx + 1}`,
          recipeId,
          isPrimary: idx === 0,
          orderIndex: idx + 1,
        }))
      : [
          {
            id: `img-${recipeId}-default`,
            recipeId,
            originalUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80',
            isPrimary: true,
            orderIndex: 1,
            altText: data.title,
          },
        ];

    const newRecipe: Recipe = {
      id: recipeId,
      title: data.title,
      slug: uniqueSlug,
      description: data.description || '',
      instructions: data.instructions || '',
      prepTime: data.prepTime || 15,
      cookTime: data.cookTime || 30,
      servings: data.servings || 4,
      difficulty: data.difficulty || RecipeDifficulty.Easy,
      status: RecipeStatus.Draft, // Default is Draft as specified in SRS
      categoryId: data.categoryId || this.categories[0]?.id || 'cat-001',
      authorId: user.id,
      nutrition: data.nutrition,
      steps,
      ingredients,
      images,
      createdAt: new Date().toISOString(),
      isDeleted: false,
      rowVersion: 'AAAAAAAAC' + Math.floor(Math.random() * 100) + '=',
    };

    this.recipes.unshift(newRecipe);
    this.persistRecipes();
    this.evictCachePattern('recipes:');

    // Trigger Hangfire thumbnail generation
    this.enqueueJob('ImageResizeJob (FR-JOB-002)', 'Fire-and-forget', `Uploaded recipe '${data.title}'`, 'Sinh thumbnail 300x300 và medium image 800x600 qua MinIO.');

    this.addLog('POST', '/api/v1/recipes', 201, 64, `Created draft recipe: ${newRecipe.title}`);
    return { recipe: newRecipe };
  }

  public updateRecipe(id: string, data: Partial<Recipe>, ifMatchRowVersion?: string): { recipe?: Recipe; error?: ProblemDetails } {
    const r = this.recipes.find(rec => rec.id === id && !rec.isDeleted);
    if (!r) {
      return {
        error: {
          type: 'RECIPE_NOT_FOUND',
          title: 'Not Found',
          status: 404,
          detail: `Không tìm thấy công thức với ID '${id}'.`,
        },
      };
    }

    const user = this.currentUser;
    if (!user) {
      return {
        error: {
          type: 'AUTH_UNAUTHORIZED',
          title: 'Unauthorized',
          status: 401,
          detail: 'Vui lòng đăng nhập để cập nhật công thức.',
        },
      };
    }

    // Resource-Based Authorization
    const isOwner = r.authorId === user.id;
    const isAdmin = user.roles.includes('Admin');
    if (!isOwner && !isAdmin) {
      return {
        error: {
          type: 'RECIPE_FORBIDDEN',
          title: 'Forbidden',
          status: 403,
          detail: 'Bạn không có quyền chỉnh sửa công thức của tác giả khác.',
        },
      };
    }

    // Concurrency check (RowVersion)
    if (ifMatchRowVersion && ifMatchRowVersion !== r.rowVersion) {
      return {
        error: {
          type: 'RECIPE_CONCURRENCY_CONFLICT',
          title: 'Precondition Failed',
          status: 422,
          detail: 'Dữ liệu đã bị thay đổi bởi một yêu cầu khác. Vui lòng tải lại trang.',
        },
      };
    }

    if (data.title !== undefined) r.title = data.title;
    if (data.description !== undefined) r.description = data.description;
    if (data.instructions !== undefined) r.instructions = data.instructions;
    if (data.prepTime !== undefined) r.prepTime = data.prepTime;
    if (data.cookTime !== undefined) r.cookTime = data.cookTime;
    if (data.servings !== undefined) r.servings = data.servings;
    if (data.difficulty !== undefined) r.difficulty = data.difficulty;
    if (data.categoryId !== undefined) r.categoryId = data.categoryId;
    if (data.nutrition !== undefined) r.nutrition = data.nutrition;
    if (data.steps !== undefined) r.steps = data.steps;
    if (data.ingredients !== undefined) r.ingredients = data.ingredients;
    if (data.images !== undefined) r.images = data.images;

    r.updatedAt = new Date().toISOString();
    r.rowVersion = 'AAAAAAAAC' + Math.floor(Math.random() * 1000) + '=';

    this.persistRecipes();
    this.evictCachePattern('recipes:');
    this.addLog('PUT', `/api/v1/recipes/${id}`, 200, 42, `Updated recipe: ${r.title}`);
    return { recipe: r };
  }

  public publishRecipe(id: string, publish: boolean): { recipe?: Recipe; error?: ProblemDetails } {
    const r = this.recipes.find(rec => rec.id === id && !rec.isDeleted);
    if (!r) {
      return {
        error: {
          type: 'RECIPE_NOT_FOUND',
          title: 'Not Found',
          status: 404,
          detail: `Không tìm thấy công thức với ID '${id}'.`,
        },
      };
    }

    const user = this.currentUser;
    const isOwner = user && r.authorId === user.id;
    const isAdmin = user && user.roles.includes('Admin');
    if (!isOwner && !isAdmin) {
      return {
        error: {
          type: 'RECIPE_FORBIDDEN',
          title: 'Forbidden',
          status: 403,
          detail: 'Bạn không có quyền thay đổi trạng thái công thức này.',
        },
      };
    }

    // Business rule: Không thể publish nếu thiếu steps hoặc ingredients
    if (publish) {
      if (!r.steps || r.steps.length === 0) {
        return {
          error: {
            type: 'RECIPE_PUBLISH_INCOMPLETE',
            title: 'Business Rule Violation',
            status: 400,
            detail: 'Công thức phải có ít nhất 1 bước thực hiện trước khi xuất bản.',
          },
        };
      }
      if (!r.ingredients || r.ingredients.length === 0) {
        return {
          error: {
            type: 'RECIPE_PUBLISH_INCOMPLETE',
            title: 'Business Rule Violation',
            status: 400,
            detail: 'Công thức phải có ít nhất 1 nguyên liệu trước khi xuất bản.',
          },
        };
      }
    }

    r.status = publish ? RecipeStatus.Published : RecipeStatus.Draft;
    r.publishedAt = publish ? new Date().toISOString() : undefined;
    r.updatedAt = new Date().toISOString();

    this.persistRecipes();
    this.evictCachePattern('recipes:');
    this.addLog('PATCH', `/api/v1/recipes/${id}/${publish ? 'publish' : 'unpublish'}`, 200, 25, `${publish ? 'Published' : 'Unpublished'}: ${r.title}`);
    return { recipe: r };
  }

  public archiveRecipe(id: string): { recipe?: Recipe; error?: ProblemDetails } {
    const r = this.recipes.find(rec => rec.id === id && !rec.isDeleted);
    if (!r) {
      return {
        error: {
          type: 'RECIPE_NOT_FOUND',
          title: 'Not Found',
          status: 404,
          detail: `Không tìm thấy công thức với ID '${id}'.`,
        },
      };
    }

    const user = this.currentUser;
    const isOwner = user && r.authorId === user.id;
    const isAdmin = user && user.roles.includes('Admin');
    if (!isOwner && !isAdmin) {
      return {
        error: {
          type: 'RECIPE_FORBIDDEN',
          title: 'Forbidden',
          status: 403,
          detail: 'Bạn không có quyền lưu trữ công thức này.',
        },
      };
    }

    r.status = r.status === RecipeStatus.Archived ? RecipeStatus.Draft : RecipeStatus.Archived;
    r.updatedAt = new Date().toISOString();

    this.persistRecipes();
    this.evictCachePattern('recipes:');
    this.addLog('PATCH', `/api/v1/recipes/${id}/archive`, 200, 20, `Toggled archive status: ${r.title}`);
    return { recipe: r };
  }

  public deleteRecipe(id: string): { success: boolean; error?: ProblemDetails } {
    const r = this.recipes.find(rec => rec.id === id && !rec.isDeleted);
    if (!r) {
      return {
        success: false,
        error: {
          type: 'RECIPE_NOT_FOUND',
          title: 'Not Found',
          status: 404,
          detail: `Không tìm thấy công thức với ID '${id}'.`,
        },
      };
    }

    const user = this.currentUser;
    const isOwner = user && r.authorId === user.id;
    const isAdmin = user && user.roles.includes('Admin');
    if (!isOwner && !isAdmin) {
      return {
        success: false,
        error: {
          type: 'RECIPE_FORBIDDEN',
          title: 'Forbidden',
          status: 403,
          detail: 'Bạn không có quyền xóa công thức này.',
        },
      };
    }

    // Soft delete flag in PostgreSQL
    r.isDeleted = true;
    this.persistRecipes();
    this.evictCachePattern('recipes:');

    // Hangfire async delete images from MinIO
    this.enqueueJob('MinIOFileDeletionJob', 'Fire-and-forget', `Xóa ảnh của công thức '${r.title}'`, `Xóa ${r.images.length} file ảnh trên MinIO S3 bucket.`);

    this.addLog('DELETE', `/api/v1/recipes/${id}`, 204, 32, `Recipe soft-deleted: ${r.title}`);
    return { success: true };
  }

  public resetToSeed() {
    localStorage.removeItem(STORAGE_KEY_RECIPES);
    localStorage.removeItem(STORAGE_KEY_CATEGORIES);
    localStorage.removeItem(STORAGE_KEY_USERS);
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    localStorage.removeItem(STORAGE_KEY_JOBS);
    localStorage.removeItem(STORAGE_KEY_LOGS);
    this.init();
    this.addLog('POST', '/api/v1/admin/reset-seed', 200, 12, 'Reset database to initial Bogus seed data');
  }
}

export const db = new DatabaseEngine();
