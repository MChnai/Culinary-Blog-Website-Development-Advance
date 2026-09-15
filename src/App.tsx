import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  Info,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { Header } from './components/Header';
import { RecipeCard } from './components/RecipeCard';
import { RecipeDetailModal } from './components/RecipeDetailModal';
import { RecipeWizardModal } from './components/RecipeWizardModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { SearchModal } from './components/SearchModal';
import { ApiExplorer } from './components/ApiExplorer';
import { ArchitectureViewer } from './components/ArchitectureViewer';
import { SystemMonitor } from './components/SystemMonitor';
import { Dashboard } from './components/Dashboard';
import { db } from './lib/storage';
import { Recipe, Category, ApplicationUser, UserRole, RecipeDifficulty, RecipeStatus } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'explore' | 'dashboard' | 'api' | 'architecture' | 'monitor'>('explore');
  const [currentUser, setCurrentUser] = useState<ApplicationUser | null>(db.getCurrentUser());
  const [categories, setCategories] = useState<Category[]>(db.getCategories());
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  // Explore filtering & pagination states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('-createdAt');
  const [maxCookTime, setMaxCookTime] = useState<number>(240);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Modals state
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = () => {
    setCategories(db.getCategories());
    const res = db.getRecipes({
      page: currentPage,
      pageSize,
      categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
      difficulty: selectedDifficulty !== 'all' ? Number(selectedDifficulty) : undefined,
      maxCookTime: maxCookTime < 240 ? maxCookTime : undefined,
      sort: sortField,
    });
    setRecipes(res.items);
    setTotalCount(res.totalCount);
    setTotalPages(res.totalPages);
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedDifficulty, sortField, maxCookTime, currentPage, currentUser]);

  // Keyboard shortcut cmd+k / ctrl+k for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSwitchRole = (role: UserRole) => {
    db.switchUserRole(role);
    setCurrentUser(db.getCurrentUser());
    showToast(`Đã chuyển sang vai trò: ${role === 'Admin' ? 'Quản trị viên (Admin)' : role === 'Author' ? 'Tác giả (Author)' : 'Khách (Guest)'}`, 'info');
  };

  const handleSaveRecipe = (data: Partial<Recipe>, publishImmediately?: boolean) => {
    if (recipeToEdit) {
      const res = db.updateRecipe(recipeToEdit.id, data);
      if (res.error) {
        showToast(res.error.detail, 'error');
        return;
      }
      if (publishImmediately) {
        db.publishRecipe(recipeToEdit.id, true);
      }
      showToast(`Đã cập nhật công thức '${res.recipe?.title}' thành công.`);
    } else {
      const res = db.createRecipe(data);
      if (res.error) {
        showToast(res.error.detail, 'error');
        return;
      }
      if (publishImmediately && res.recipe) {
        const pubRes = db.publishRecipe(res.recipe.id, true);
        if (pubRes.error) {
          showToast(`Đã tạo bản thảo nhưng chưa thể xuất bản: ${pubRes.error.detail}`, 'error');
        } else {
          showToast(`Đã tạo và xuất bản công thức '${res.recipe.title}'.`);
        }
      } else {
        showToast(`Đã lưu công thức '${res.recipe?.title}' ở trạng thái Bản thảo (Draft).`);
      }
    }

    setIsWizardOpen(false);
    setRecipeToEdit(null);
    loadData();
  };

  const handlePublishToggle = (recipe: Recipe) => {
    const willPublish = recipe.status !== RecipeStatus.Published;
    const res = db.publishRecipe(recipe.id, willPublish);
    if (res.error) {
      showToast(res.error.detail, 'error');
    } else {
      showToast(
        willPublish
          ? `Đã xuất bản công thức '${recipe.title}' lên trang chủ.`
          : `Đã đưa công thức '${recipe.title}' về trạng thái Bản thảo.`
      );
      loadData();
      if (selectedRecipe && selectedRecipe.id === recipe.id) {
        setSelectedRecipe(res.recipe || null);
      }
    }
  };

  const handleArchiveToggle = (recipe: Recipe) => {
    const res = db.archiveRecipe(recipe.id);
    if (res.error) {
      showToast(res.error.detail, 'error');
    } else {
      showToast(`Đã cập nhật trạng thái lưu trữ của '${recipe.title}'.`);
      loadData();
      if (selectedRecipe && selectedRecipe.id === recipe.id) {
        setSelectedRecipe(res.recipe || null);
      }
    }
  };

  const handleDeleteRecipe = (recipe: Recipe) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa công thức '${recipe.title}'?`)) return;
    const res = db.deleteRecipe(recipe.id);
    if (!res.success && res.error) {
      showToast(res.error.detail, 'error');
    } else {
      showToast(`Đã xóa công thức '${recipe.title}'.`);
      setSelectedRecipe(null);
      loadData();
    }
  };

  const handleResetSeed = () => {
    if (window.confirm('Khôi phục toàn bộ dữ liệu mẫu ban đầu của PostgreSQL 16 và MinIO?')) {
      db.resetToSeed();
      setCurrentUser(db.getCurrentUser());
      loadData();
      showToast('Đã khôi phục dữ liệu mẫu Bogus thành công.');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col selection:bg-amber-100 selection:text-amber-900">
      {/* Toast Notification Bar */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs sm:text-sm font-medium ${
              toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-800'
                : toast.type === 'info'
                ? 'bg-sky-900 text-white border-sky-800'
                : 'bg-emerald-900 text-white border-emerald-800'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Global Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
        onOpenNewRecipe={() => {
          setRecipeToEdit(null);
          setIsWizardOpen(true);
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        searchTerm=""
      />

      {/* Main Body Content based on Active Tab */}
      <main className="flex-1 pb-16">
        {activeTab === 'explore' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Hero Banner with system highlights */}
            <div className="relative rounded-3xl bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white overflow-hidden p-8 sm:p-12 shadow-xl border border-stone-800">
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Culinary Blog & Recipe Platform V1.0</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-bold font-serif leading-tight">
                  Khám phá tinh hoa ẩm thực truyền thống
                </h1>

                <p className="text-sm sm:text-base text-stone-300 leading-relaxed">
                  Hệ thống quản lý công thức và sản phẩm ẩm thực xây dựng với{' '}
                  <strong className="text-amber-300 font-semibold">.NET 10 Minimal APIs</strong>,{' '}
                  <strong className="text-amber-300 font-semibold">PostgreSQL 16</strong> và{' '}
                  <strong className="text-amber-300 font-semibold">Next.js App Router</strong>.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs sm:text-sm shadow-md transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>Tìm kiếm FTS tiếng Việt</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('api')}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs sm:text-sm border border-white/20 transition-colors cursor-pointer"
                  >
                    Xem REST API Spec (/scalar)
                  </button>
                </div>
              </div>

              {/* Ambient decoration */}
              <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none hidden md:block">
                <img
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80"
                  alt="Food artwork"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Category Chips Carousel (FR-CAT-001) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-serif text-stone-900">
                  Danh mục món ăn ({categories.length})
                </h2>
                {currentUser?.roles.includes('Admin') && (
                  <button
                    onClick={() => setIsCategoryManagerOpen(true)}
                    className="text-xs text-amber-700 hover:text-amber-800 font-semibold cursor-pointer"
                  >
                    + Quản lý danh mục
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
                    selectedCategory === 'all'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  Tất cả món ăn
                </button>

                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-2 ${
                      selectedCategory === cat.id
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span
                      className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                        selectedCategory === cat.id
                          ? 'bg-amber-700 text-white'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {cat.recipeCount || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filter & Sorting Bar (FR-RCP-001 & FR-SRCH-002/003) */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-stone-500 font-medium">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-stone-400" />
                  <span>Bộ lọc:</span>
                </div>

                {/* Difficulty Filter */}
                <select
                  value={selectedDifficulty}
                  onChange={e => {
                    setSelectedDifficulty(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-700 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="all">Độ khó: Tất cả</option>
                  <option value={RecipeDifficulty.Easy}>Dễ làm (Easy)</option>
                  <option value={RecipeDifficulty.Medium}>Trung bình (Medium)</option>
                  <option value={RecipeDifficulty.Hard}>Nâng cao (Hard)</option>
                  <option value={RecipeDifficulty.Expert}>Chuyên nghiệp (Expert)</option>
                </select>

                {/* Max cook time filter */}
                <div className="flex items-center gap-2 bg-stone-50 px-3 py-1 border border-stone-200 rounded-lg">
                  <span className="text-stone-500">Thời gian nấu ≤</span>
                  <input
                    type="range"
                    min="15"
                    max="240"
                    step="15"
                    value={maxCookTime}
                    onChange={e => {
                      setMaxCookTime(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="w-20 accent-amber-600"
                  />
                  <span className="font-mono font-semibold text-stone-800">
                    {maxCookTime >= 240 ? 'Tất cả' : `${maxCookTime}p`}
                  </span>
                </div>
              </div>

              {/* Sorting Filter (FR-SRCH-003) */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-stone-500">Sắp xếp:</span>
                <select
                  value={sortField}
                  onChange={e => setSortField(e.target.value)}
                  className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-700 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="-createdAt">Mới nhất (-createdAt)</option>
                  <option value="createdAt">Cũ nhất (createdAt)</option>
                  <option value="title">Tên A-Z (title)</option>
                  <option value="cookTime">Thời gian nấu tăng dần</option>
                  <option value="-cookTime">Thời gian nấu giảm dần</option>
                </select>
              </div>
            </div>

            {/* Recipes Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>
                  Hiển thị <strong className="text-stone-900">{recipes.length}</strong> trên tổng số{' '}
                  <strong className="text-stone-900">{totalCount}</strong> công thức
                </span>
                <span className="font-mono text-[11px] text-stone-400">
                  OFFSET-LIMIT Pagination • Trang {currentPage}/{totalPages}
                </span>
              </div>

              {recipes.length === 0 ? (
                <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
                  <BookOpen className="w-10 h-10 text-stone-300 mx-auto" />
                  <h3 className="font-bold text-stone-800 text-base">Không tìm thấy công thức nào</h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Thử thay đổi bộ lọc danh mục hoặc thời gian nấu để tìm thêm nhiều món ngon.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedDifficulty('all');
                      setMaxCookTime(240);
                    }}
                    className="mt-2 px-4 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer"
                  >
                    Xóa toàn bộ bộ lọc
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recipes.map(recipe => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onSelect={r => setSelectedRecipe(r)}
                    />
                  ))}
                </div>
              )}

              {/* Pagination Controls (FR-SRCH-004) */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-2 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 text-stone-600" />
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-amber-600 text-white'
                            : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="p-2 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4 text-stone-600" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            currentUser={currentUser}
            categories={categories}
            recipes={recipes}
            onSelectRecipe={r => setSelectedRecipe(r)}
            onOpenNewRecipe={() => {
              setRecipeToEdit(null);
              setIsWizardOpen(true);
            }}
            onEditRecipe={r => {
              setRecipeToEdit(r);
              setIsWizardOpen(true);
            }}
            onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
            onPublishToggle={handlePublishToggle}
            onArchiveToggle={handleArchiveToggle}
            onDeleteRecipe={handleDeleteRecipe}
            onResetSeed={handleResetSeed}
          />
        )}

        {activeTab === 'api' && <ApiExplorer />}

        {activeTab === 'architecture' && <ArchitectureViewer />}

        {activeTab === 'monitor' && <SystemMonitor />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-8 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-stone-800">
              Culinary Blog – Nền tảng Giáo trình Phát triển Ứng dụng Web Nâng cao V4
            </p>
            <p className="text-stone-400 mt-0.5">
              Tuân thủ chuẩn IEEE 830 / ISO/IEC/IEEE 29148:2018 • .NET 10 Minimal APIs & PostgreSQL 16
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('api')}
              className="text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              Scalar OpenAPI
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('architecture')}
              className="text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              Clean Architecture C#
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('monitor')}
              className="text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              Health & Jobs
            </button>
          </div>
        </div>
      </footer>

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          currentUser={currentUser}
          onClose={() => setSelectedRecipe(null)}
          onEdit={r => {
            setSelectedRecipe(null);
            setRecipeToEdit(r);
            setIsWizardOpen(true);
          }}
          onPublishToggle={handlePublishToggle}
          onArchiveToggle={handleArchiveToggle}
          onDelete={handleDeleteRecipe}
        />
      )}

      {/* Recipe Wizard / Editor Modal */}
      {isWizardOpen && (
        <RecipeWizardModal
          recipeToEdit={recipeToEdit}
          categories={categories}
          onClose={() => {
            setIsWizardOpen(false);
            setRecipeToEdit(null);
          }}
          onSave={handleSaveRecipe}
        />
      )}

      {/* Category Manager Modal (Admin only) */}
      {isCategoryManagerOpen && (
        <CategoryManagerModal
          categories={categories}
          onClose={() => {
            setIsCategoryManagerOpen(false);
            loadData();
          }}
          onCreateCategory={(name, desc, img) => {
            const res = db.createCategory(name, desc, img);
            loadData();
            return res;
          }}
          onUpdateCategory={(id, name, desc) => {
            const res = db.updateCategory(id, name, desc);
            loadData();
            return res;
          }}
          onDeleteCategory={id => {
            const res = db.deleteCategory(id);
            loadData();
            return res;
          }}
        />
      )}

      {/* Search Modal */}
      {isSearchOpen && (
        <SearchModal
          categories={categories}
          onClose={() => setIsSearchOpen(false)}
          onSelectRecipe={r => setSelectedRecipe(r)}
        />
      )}
    </div>
  );
}
