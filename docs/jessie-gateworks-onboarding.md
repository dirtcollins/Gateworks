# Gateworks App: Jessie Onboarding Guide

Prepared for: Jessie  
Project owner: Brendan Collins, Bakersfield, California  
Collaborator: Jessie, Iowa  
Date: May 15, 2026

## 1. What This Project Is

Gateworks is a contractor supply and operating-system web app for ornamental iron, gate hardware, metal supply, warehouse, quoting, inventory, and admin workflows.

The current app is not just a marketing website. It is a working ecommerce/admin platform with:

- Product catalog pages
- Product detail pages
- Search
- Cart
- Quote/list workflows
- Admin operations dashboard
- Inventory, orders, customers, warehouse, quotes, demand, and catalog admin sections
- Supabase-backed auth and database wiring
- Vercel preview deployments for testing before production

Brendan and Jessie will use Codex to help build, debug, review, and ship changes.

## 2. The Correct Local Project Folder

The correct local folder on Brendan's Mac is:

```text
/Users/brendan-macpro/Documents/Gateworks Shopping App
```

Do not work in:

```text
/Users/brendan-macpro/Documents/Gateworks
```

That folder name is similar, but it is not the working project folder Brendan is using for this app.

## 3. GitHub Repo

The source code lives on GitHub:

```text
https://github.com/dirtcollins/Gateworks
```

GitHub is the source of truth for code. Do not use Dropbox as the place where code is edited or merged.

Dropbox is fine for:

- Vendor PDFs
- Product photos
- Brand files
- Reference spreadsheets
- Notes
- Non-code assets

But code changes should happen through GitHub branches and pull requests.

## 4. Main Dev Stack

The app uses:

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Zustand for browser state
- Supabase for Auth and database
- Vercel for deployments and previews
- GitHub for source control
- Codex for coding assistance

Important package scripts:

```bash
npm install
npm run dev
npm run build
npm run lint
npm run typecheck
npm run supabase:verify
```

Local dev server:

```bash
npm run dev
```

Then open:

```text
http://127.0.0.1:3001
```

## 5. Environment Variables

The app needs Supabase environment variables to work.

Required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ijxnzqxxgmprcwdfsihh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_REQUIRE_AUTH=true
```

What each variable does:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL. This is safe to expose.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Browser/client Supabase key. This is expected to be public in a Supabase app.
- `SUPABASE_SERVICE_ROLE_KEY`: Private server-only key. Never put this in frontend code, screenshots, GitHub, Dropbox, or chat.
- `ADMIN_REQUIRE_AUTH`: Must be `true` in deployed environments.

Do not commit `.env.local`.

Vercel Preview and Production must both have the required env vars configured in the Vercel dashboard.

## 6. Current Supabase Project

Supabase project ref:

```text
ijxnzqxxgmprcwdfsihh
```

Supabase URL:

```text
https://ijxnzqxxgmprcwdfsihh.supabase.co
```

The admin login uses Supabase Auth. There is no built-in default login in the code.

Admin access requires:

1. A Supabase Auth user
2. A matching row in `public.admin_profiles`
3. An allowed admin role

Allowed admin roles:

```text
owner
admin
merchandiser
inventory_manager
content_editor
```

The first admin user currently created:

```text
Email: brendangcollins@gmail.com
Role: owner
```

Do not share passwords casually. If Jessie needs access, create Jessie his own Supabase Auth user and an `admin_profiles` row instead of sharing Brendan's login.

## 7. Vercel Project

Vercel project:

```text
gateworks
```

Team:

```text
dirtcollins-2775's projects
```

Important Preview branch alias:

```text
https://gateworks-git-codex-phase-2-a-fa9136-dirtcollins-2775s-projects.vercel.app
```

Vercel Preview is how we test work before it becomes production.

Normal flow:

```text
GitHub branch -> Pull Request -> Vercel Preview -> review -> merge -> production deploy
```

Do not judge a change only by reading code. Open the Vercel Preview and test it in the browser.

## 8. How Jessie Gets the Repo

Brendan should invite Jessie to the GitHub repo:

1. Open `https://github.com/dirtcollins/Gateworks`
2. Go to Settings
3. Go to Collaborators and teams
4. Add Jessie's GitHub username or email
5. Give Jessie Write access

Recommended access:

- Write access for normal coding
- Avoid Admin access unless truly needed
- Protect `main` so nobody pushes directly to production

Jessie clones the repo:

```bash
git clone https://github.com/dirtcollins/Gateworks.git
cd Gateworks
npm install
npm run dev
```

## 9. How We Work With Branches

Never work directly on `main`.

For every task:

```bash
git checkout main
git pull
git checkout -b jessie/task-name
```

Examples:

```bash
git checkout -b jessie/fix-cart-quantity
git checkout -b jessie/admin-customer-notes
git checkout -b jessie/catalog-image-cleanup
```

After making changes:

```bash
npm run typecheck
npm run lint
git status
git add .
git commit -m "Describe the change"
git push origin jessie/task-name
```

Then open a Pull Request on GitHub.

## 10. Pull Request Rules

Every Pull Request should include:

- What changed
- Why it changed
- How to test it
- Vercel Preview link
- Screenshots for UI work
- Any known issues

Do not merge a PR until:

- It builds
- The Vercel Preview works
- The relevant workflow has been tested
- Any database changes are understood

## 11. How To Use Codex Safely

Codex is useful, but it needs clear boundaries.

Good Codex prompt:

```text
Work only inside the Gateworks repo.
Do not change unrelated files.
Inspect the existing pattern first.
Fix the cart quantity bug.
Run typecheck and lint.
Report exact files changed and how you verified it.
```

Bad Codex prompt:

```text
Make the app better.
```

Every Codex task should say:

- What folder/repo to work in
- What problem to solve
- What not to touch
- Whether code changes are allowed
- What verification to run
- What final report should include

If Codex says it changed files, always check:

```bash
git status
git diff
```

## 12. Important Codex Guardrails

Use these rules when asking Codex to work on Gateworks:

- Work only inside the correct repo folder.
- Do not rebuild auth from scratch.
- Do not rewrite major systems unless asked.
- Do not commit secrets.
- Do not edit `.env.local` unless the task is specifically env setup.
- Do not push directly to `main`.
- Do not delete user work.
- Prefer small, reviewable changes.
- Run verification before reporting success.
- For frontend work, open the app and visually test the page.

## 13. Admin Login Context

Recently fixed issue:

```text
/admin showed "Supabase Auth is not configured."
```

Root cause:

```text
Vercel project had no Supabase environment variables configured.
```

Fix:

```text
Added required Supabase env vars to Vercel Production and Preview, then redeployed Preview.
```

Current expected behavior:

- Visiting `/admin` when logged out redirects to `/admin/login`
- Valid Supabase admin user can sign in
- Signed-in admin lands on `Operations | Gateworks`
- Signed-in user without admin role goes to `/admin/access-denied`

## 14. Database Change Rules

Be careful with Supabase.

Before changing database schema:

- Understand which table is being changed
- Check if RLS policies are involved
- Make a SQL migration or documented SQL change
- Test against Preview/staging if possible
- Avoid changing production data casually

Never expose:

- `SUPABASE_SERVICE_ROLE_KEY`
- Supabase database password
- Vercel auth token
- Private user passwords

## 15. Recommended Team Workflow

For each feature:

1. Brendan creates a small GitHub Issue.
2. Jessie creates a branch from latest `main`.
3. Jessie uses Codex locally to implement the task.
4. Jessie runs verification.
5. Jessie pushes the branch.
6. GitHub opens a PR.
7. Vercel creates a Preview.
8. Brendan and Jessie test the Preview.
9. Fixes happen on the same branch.
10. PR is merged only after review.

## 16. Example Task Format For Jessie

Copy this format into Codex:

```text
Project: Gateworks
Repo folder: /path/to/Gateworks

Task:
Fix [specific issue].

Rules:
- Work only in this repo.
- Do not touch auth, env vars, or database schema unless needed.
- Follow existing code patterns.
- Keep the change small.

Verification:
- Run npm run typecheck.
- Run npm run lint if code style changed.
- Start the app with npm run dev and test the page.

Final report:
- Root cause
- Files changed
- Commands run
- Preview/test result
```

## 17. What To Ask Brendan Before Doing

Jessie should ask before:

- Changing database schema
- Editing auth behavior
- Adding new dependencies
- Changing deployment settings
- Touching Vercel environment variables
- Touching Supabase service role keys
- Reworking large UI sections
- Deleting files
- Merging PRs

## 18. What Jessie Can Usually Do Without Asking

Jessie can usually proceed with:

- UI bug fixes
- Small component edits
- Product card improvements
- Admin page layout fixes
- TypeScript cleanup
- Adding focused tests
- Fixing obvious lint/type errors
- Improving copy in normal UI
- Adding screenshots to PRs

## 19. Minimum Verification Checklist

Before saying a task is done:

```bash
npm run typecheck
npm run lint
npm run build
```

For UI work:

- Open local app at `http://127.0.0.1:3001`
- Test desktop
- Test mobile/narrow viewport
- Check browser console
- Confirm no broken layout

For deployed work:

- Open the Vercel Preview
- Test the exact route changed
- Include Preview URL in the PR

## 20. Summary

GitHub is where code lives. Vercel is where previews and production deploy. Supabase is the backend. Codex is the coding assistant. Dropbox is only for supporting assets, not source code.

The team should work in small branches, open pull requests, review Vercel previews, and keep secrets out of GitHub and chat.

