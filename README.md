# Hardware Management System

A full-stack web app for tracking hardware components, their classification/count,
and the complete history of who owns what — with admin-approved user accounts.

**Stack (100% free tier):**
- **Next.js 14** (App Router, TypeScript, Tailwind) — the web app
- **Supabase** (free tier) — Postgres database + built-in authentication
- **Vercel** (free/hobby tier) — hosting

## Features

- Email/password authentication (Supabase Auth)
- New signups start as **pending** and cannot access the dashboard until an
  admin approves them
- Admins can approve/reject users, promote/demote admins, or directly invite
  a new user by email
- Dashboard with live stats: total components, in-stock / assigned / retired
  counts, and a breakdown by classification (category)
- Full component inventory with filtering by category/status
- Ownership transfer tracking: every transfer is logged with who it went
  from, who it went to, who authorized it, and when — full audit trail per
  component and system-wide
- Row Level Security enforced at the database level (not just in the UI)

## 1. Create your free Supabase project

1. Go to https://supabase.com → **New project** (free tier).
2. Once created, open **SQL Editor** → **New query**, paste the entire
   contents of `supabase/schema.sql`, and run it. This creates all tables,
   the auto-profile trigger, and the security policies.
3. Go to **Authentication → Providers** and make sure **Email** is enabled.
   For quicker testing you can turn off "Confirm email" under
   **Authentication → Settings**, but for production leave it on.
4. Go to **Project Settings → API** and copy:
   - `Project URL`
   - `anon public` key
   - `service_role` key (keep this secret!)

## 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the three values from step 1:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 3. Run locally

```bash
npm install
npm run dev
```

Visit http://localhost:3000, click **Create an account**, and sign up with
the email you want to be the first admin.

## 4. Make yourself admin (one-time bootstrap)

The very first account has no admin to approve it, so promote yourself
directly in Supabase: **SQL Editor** → run:

```sql
update profiles set role = 'admin', status = 'approved'
where email = 'you@example.com';
```

Now log in — you'll land on the dashboard and see the **Users** section,
where you can approve everyone else who signs up (or invite them directly).

## 5. Deploy to Vercel (free tier)

1. Push this project to a GitHub repo.
2. Go to https://vercel.com → **New Project** → import the repo.
3. In **Environment Variables**, add the same three variables from step 2.
4. Deploy. Vercel auto-detects Next.js — no extra config needed.

That's it — you have a live, free-tier hardware management system.

## Project structure

```
app/
  login/              login page
  signup/             self-signup (goes to "pending" status)
  pending-approval/   shown to users awaiting admin approval
  dashboard/
    page.tsx            overview: stats + classification breakdown
    components/         inventory list, add, and detail/transfer pages
    transfers/          system-wide ownership transfer history
    admin/users/        approve/reject/promote users, invite by email
lib/
  supabase/           browser, server, and admin (service-role) clients
  types.ts            shared TypeScript types
supabase/
  schema.sql          full DB schema + Row Level Security policies
middleware.ts         session refresh + route protection
```

## Notes & next steps

- `next.config.js` has `eslint.ignoreDuringBuilds = true` so a first deploy
  isn't blocked by lint warnings — safe to remove once you've run `npm run
  build` locally and confirmed it's clean.
- Every table has Row Level Security enabled: regular users can only read
  data (once approved); only admins can write components, log transfers, or
  change user roles/status. This is enforced by Postgres itself, not just
  the UI.
- To add more classifications, just type a new category name when adding a
  component — there's no fixed list to edit.
- To extend: attachments/photos per component, CSV export, or email
  notifications on approval can all be added with Supabase Storage / a
  transactional email provider (e.g. Resend, also free tier).
