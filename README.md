# LUXE Marketplace 市 ✦
> The New Standard in Luxury Commerce. A highly curated, full-stack digital storefront ecosystem engineered for those who demand more.

[![Ecosystem Status](https://img.shields.io/badge/Ecosystem-Prototype_Sandbox-C9A96E?style=flat-square)](#)
[![Stack](https://img.shields.io/badge/Built_With-React_|_Vite_|_Supabase-000000?style=flat-square)](#)
[![Currency](https://img.shields.io/badge/Currency-INR_(₹)-C9A96E?style=flat-square)](#)

LUXE Marketplace is an ambient, high-end design prototype sandbox running a completely live data-driven storefront. It seamlessly bridges a minimal, dark-mode boutique aesthetic with a cloud-synchronized asset and relational ledger database architecture.

---

## ✦ Core Master Layout Showcase

### 1. Dynamic Hero Showcase
* **Real Cloud Assets:** Dynamically pulls public image URLs directly from Supabase Storage rows based on custom tagged variables.
* **Intelligent Fallbacks:** Gracefully falls back to high-resolution, professional design mockups if the cloud database matrix is unpopulated.

### 2. Tactical Micro-Interactions & Movable Visuals
* **Dual-Layer Fluid Cursor:** A responsive metallic pointer tracking system featuring a custom gold dot and a trailing circle outline that dynamically scales and adjusts on clickable elements.
* **Tactile Cart Feedback:** A CSS keyframe-driven bounce micro-animation that triggers on the navigation bar's shopping bag badge (`🛍`) every time an item is successfully added.
* **Ambient Input Fog Shadow Glows:** Replaces harsh default browser outlines with soft, radiating gold fog highlights (`box-shadow`) upon focus fields.

### 3. State & Data Orchestration
* **Skeleton Shimmer Loading:** Replaces plain layout blocks with animated, moving sweep-gradient placeholder cards while asynchronously fetching remote rows.
* **Minimalist Showroom Empty States:** Features a custom inline linear SVG vector illustration of a locked luxury display glass cabinet when queries yield zero matches.
* **Canvas Confetti Engine:** A lightweight, math-driven geometric particle canvas pipeline that spawns a golden metallic confetti shower upon reaching the final step of checkout.

---

## 🛠 Architectural Blueprint & Tech Stack

* **Frontend Engine:** React.js via Vite (Optimized production asset compilation)
* **Cloud Database Framework:** Supabase (Relational PostgreSQL ledger layers)
* **Object Cloud Storage:** Supabase Buckets (Secure multi-image storage streaming)
* **State Management:** Reactive Browser LocalStorage synchronization arrays (Cart & Wishlist persistence matrices)
* **Localization Matrix:** Standardised `en-IN` domestic numeric formatting configuration (`₹`)

---

## 📁 Repository Structure

```text
├── src/
│   ├── assets/           # High-resolution vector layers and design assets
│   ├── AdminPanel.jsx    # Real-time catalog, badge configuration, and inventory layout
│   ├── App.jsx           # Core application core context, micro-interactions, and cursor hook engines
│   ├── Checkout.jsx      # Multi-step transactional wizard, review generator, and canvas engine
│   ├── SupportModals.jsx # Concierge helpdesk overlays and support return port layout systems
│   ├── supabaseClient.js # Global initialization point for the Supabase backend configuration
│   ├── index.css         # Main styles, layout grids, blur overlays, and custom keyframes
│   └── main.jsx          # DOM rendering entry root matrix
├── .gitignore            # Protected environment configuration patterns
├── package.json          # Dependency build matrices
└── README.md             # Ecosystem system summary documentation