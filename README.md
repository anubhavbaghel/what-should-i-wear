# What Should I Wear? (v2) - AI Wardrobe & Outfit Stylist

A modern, mobile-first AI Wardrobe Assistant and Outfit Recommendation app built on a clean, feature-driven, decoupled architecture.

## 🚀 Features

- 👗 **Smart Closet Management**: Upload clothing items, isolate backgrounds automatically, tag garments, and organize by category/color.
- 🤖 **AI-Powered Categorization & Background Removal**: AI vision model identifies garments, color palette, category, and cuts out backgrounds.
- 🎨 **Outfit Generator**: AI outfit recommendation engine matches items by weather, occasion, style profile, and color harmony.
- 🎯 **Onboarding & Personal Style**: Personalized style profiles, vibe preferences, and occasion matching.
- 🔒 **Authentication & Sync**: Supabase Auth with RLS-protected database storage.
- 🔌 **Plug & Play AI Infrastructure**: Includes fully functional **Mock AI Fallback** so you can run and test everything out-of-the-box without configuring API keys.

---

## 🏗️ Architecture Overview

The codebase is organized into clean, isolated layers:

```
src/
├── domain/            # Pure TypeScript types, schemas (Zod), and domain interfaces
├── services/          # Infrastructure API adapters (Supabase Repositories, AI Services)
├── features/          # Modular feature components (Closet, Outfits, Onboarding, Auth, Profile)
├── components/        # Reusable UI primitives (Tailwind CSS v4 + Radix UI + Motion)
└── routes/            # Main App Routing & Compositions
```

---

## 🛠️ Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment (Optional)

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

If no keys are provided, the app will automatically run in **Local Demo / Mock Mode** with full interactivity!

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🗄️ Database Setup (Supabase)

To connect your real Supabase backend, run the migration file provided in `supabase/migrations/001_initial_schema.sql` against your Supabase SQL Editor.
