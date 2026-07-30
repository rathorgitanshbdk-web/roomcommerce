# Homemade Delights E-Commerce Store

An e-commerce web application for ordering homemade Gujarati snacks, sweets, and savories with Supabase synchronization, admin dashboard, cart management, and bulk wholesale inquiries.

## Features

- **Product Catalog**: Filter by category, view weight/piece pricing, and check Gujarati translation names.
- **Cart & Direct Checkout**: WhatsApp integration and direct checkout with order confirmation numbers.
- **Admin Dashboard**: Manage inventory products, view customer orders, manage wholesale bulk inquiries, and monitor Supabase cloud sync status.
- **Supabase Cloud Sync**: Syncs orders, products, reviews, and bulk inquiries with Supabase PostgreSQL.

## Getting Started

### Prerequisites

- Node.js 18+ installed

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/rathorgitanshbdk-web/homecommerce.git
   cd homecommerce
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_service_or_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Lucide Icons, Motion
- **Backend**: Express, Vite Middleware
- **Database**: Supabase (PostgreSQL) + Local JSON fallback
