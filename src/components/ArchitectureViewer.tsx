import React, { useState } from 'react';
import { Database, Layers, Copy, Check, Server, Shield, FileCode, CheckCircle } from 'lucide-react';
import { CSHARP_CLEAN_ARCHITECTURE_SNIPPETS } from '../lib/apiDocs';

export const ArchitectureViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'domain' | 'application' | 'presentation' | 'postgres'>('domain');
  const [copied, setCopied] = useState(false);

  const getActiveCode = () => {
    switch (activeTab) {
      case 'domain':
        return CSHARP_CLEAN_ARCHITECTURE_SNIPPETS.domainRecipe;
      case 'application':
        return CSHARP_CLEAN_ARCHITECTURE_SNIPPETS.applicationMediatr;
      case 'presentation':
        return CSHARP_CLEAN_ARCHITECTURE_SNIPPETS.presentationMinimalApi;
      case 'postgres':
        return CSHARP_CLEAN_ARCHITECTURE_SNIPPETS.postgresSchemaDdl;
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Layers className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold font-serif text-stone-900">
                System Architecture: .NET 10 & PostgreSQL 16
              </h1>
              <p className="text-xs sm:text-sm text-stone-500">
                Adhering to Clean Architecture (Robert C. Martin), CQRS MediatR & EF Core 10 Code-First
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
            CONS-001: 4 Decoupled Layers
          </span>
          <span className="px-2.5 py-1 rounded-md bg-sky-50 text-sky-800 border border-sky-200 font-medium">
            CONS-002: CQRS + MediatR
          </span>
          <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium">
            CONS-006: PostgreSQL 16 DBMS
          </span>
        </div>
      </div>

      {/* 4 Clean Architecture Layers Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('domain')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'domain'
              ? 'bg-amber-50 border-amber-400 shadow-sm'
              : 'bg-white border-stone-200 hover:bg-stone-50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900 uppercase">1. Domain Layer</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Core</span>
          </div>
          <h4 className="font-semibold text-stone-900 text-sm">CulinaryBlog.Domain</h4>
          <p className="text-xs text-stone-500 mt-1">
            Entities (Recipe, Category), Value Objects, Enums, Owned Entity RecipeNutrition. Zero external dependencies.
          </p>
        </div>

        <div
          onClick={() => setActiveTab('application')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'application'
              ? 'bg-amber-50 border-amber-400 shadow-sm'
              : 'bg-white border-stone-200 hover:bg-stone-50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900 uppercase">2. Application Layer</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">CQRS</span>
          </div>
          <h4 className="font-semibold text-stone-900 text-sm">CulinaryBlog.Application</h4>
          <p className="text-xs text-stone-500 mt-1">
            MediatR Commands/Queries, FluentValidation Pipeline Behaviors, DTOs & Service Interfaces.
          </p>
        </div>

        <div
          onClick={() => setActiveTab('presentation')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'presentation'
              ? 'bg-amber-50 border-amber-400 shadow-sm'
              : 'bg-white border-stone-200 hover:bg-stone-50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900 uppercase">3. Presentation Layer</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">Minimal API</span>
          </div>
          <h4 className="font-semibold text-stone-900 text-sm">CulinaryBlog.API</h4>
          <p className="text-xs text-stone-500 mt-1">
            ASP.NET 10 Minimal APIs MapGroup, RFC 7807 Exception Middleware, RateLimiter & Scalar UI.
          </p>
        </div>

        <div
          onClick={() => setActiveTab('postgres')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'postgres'
              ? 'bg-amber-50 border-amber-400 shadow-sm'
              : 'bg-white border-stone-200 hover:bg-stone-50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900 uppercase">4. Database & DDL</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">Postgres 16</span>
          </div>
          <h4 className="font-semibold text-stone-900 text-sm">PostgreSQL 16 Engine</h4>
          <p className="text-xs text-stone-500 mt-1">
            Full-Text Search tsvector trigger, unaccent collation, GIN index, soft delete & RowVersion.
          </p>
        </div>
      </div>

      {/* Code Viewer Box */}
      <div className="bg-stone-900 rounded-2xl border border-stone-800 shadow-xl overflow-hidden">
        <div className="px-6 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileCode className="w-5 h-5 text-amber-400" />
            <span className="font-mono text-xs sm:text-sm font-semibold text-stone-200">
              {activeTab === 'domain' && 'CulinaryBlog.Domain/Entities/Recipe.cs (C# .NET 10)'}
              {activeTab === 'application' && 'CulinaryBlog.Application/Features/Recipes/Commands/CreateRecipeCommand.cs (MediatR CQRS)'}
              {activeTab === 'presentation' && 'CulinaryBlog.API/Endpoints/RecipesEndpoints.cs (Minimal APIs MapGroup)'}
              {activeTab === 'postgres' && 'scripts/init_postgresql16_schema.sql (PostgreSQL 16 DDL + FTS Trigger)'}
            </span>
          </div>

          <button
            onClick={copyCode}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        <pre className="p-6 text-xs sm:text-sm font-mono text-emerald-400 overflow-x-auto max-h-[550px] leading-relaxed">
          {getActiveCode()}
        </pre>
      </div>
    </div>
  );
};
