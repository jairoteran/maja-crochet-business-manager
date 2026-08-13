# Maja

A simple system for managing a crochet and knitting workshop.

It allows you to track:

- Sales.
- Expenses.
- Customers.
- Yarn inventory.
- Business insights powered by Gemini.

## Requirements

- Node.js.
- A Supabase project.
- A Gemini API key.

## Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/jairoteran/maja-tejido-mvp.git
cd maja-tejido-mvp
npm install
```

Copy `.env.example` to `.env.local` and add your credentials:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.6-flash

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
NEXT_PUBLIC_AUTH_USERNAME=your_username
NEXT_PUBLIC_AUTH_EMAIL=the_users_supabase_email
```

Do not commit `.env.local` to GitHub.

## Supabase setup

Open **Supabase → SQL Editor** and run these files in order:

1. `supabase/migrations/202608130001_create_maja_state.sql`
2. `supabase/migrations/202608130002_secure_with_auth.sql`
3. `supabase/migrations/202608130003_remove_single_record_constraint.sql`

Then open **Authentication → Users** and create or confirm the email specified in `NEXT_PUBLIC_AUTH_EMAIL`. Set the password directly in Supabase.

## Start the application

```bash
npm run dev
```

Open the address shown in the terminal, usually:

```text
http://localhost:5173
```

Sign in with the user configured in Supabase.

## Usage

- **Home:** view income, expenses, and profit.
- **Sales:** record completed orders.
- **Expenses:** record yarn, tools, and other material purchases.
- **Customers:** manage customer information.
- **Inventory:** track yarn and receive low-stock alerts.
- **AI Accountant:** ask questions based on the recorded business data.

Data is stored in Supabase. The browser keeps a local backup.

## Other commands

```bash
npm run build
npm run lint
```

## Deploying to Vercel

Add every variable from `.env.example` in **Vercel → Project Settings → Environment Variables**, then redeploy the application. Local `.env.local` files are not uploaded to GitHub or Vercel.

AI-generated insights are for guidance only and do not replace professional accounting or tax advice.
