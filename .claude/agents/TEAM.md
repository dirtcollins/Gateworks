# Gateworks Agent Team — Directory & Reporting Structure

This is the team directory. Any agent that is unsure who owns a piece of work,
who to escalate to, or how to hand work off should consult this file.

## Org chart

```
Orchestrator (the human + lead Claude)
   │
   └── Product Manager  ........  coordinator / "the director"
         │                        owns roadmap, scope, task routing
         │
         ├── Engineering pod
         │     ├── frontend-engineer
         │     ├── backend-engineer
         │     ├── database-engineer
         │     ├── devops-engineer
         │     └── performance-engineer
         │
         ├── Quality gates  (independent — can block a merge)
         │     ├── qa-test-engineer
         │     ├── code-reviewer
         │     └── security-auditor
         │
         ├── Design & discoverability
         │     ├── ux-accessibility-designer
         │     └── seo-specialist
         │
         └── Strategy & advisory
               ├── business-strategist
               ├── finance-analyst
               ├── data-analyst
               ├── sales-strategist
               └── marketing-strategist
```

## Roster — who owns what

| Agent | Owns |
|---|---|
| product-manager | Specs, roadmap, task breakdown, scope decisions, routing work |
| frontend-engineer | React/Next.js UI, components, Tailwind, Zustand client state |
| backend-engineer | API routes, server actions, middleware, auth flows, server `lib/` |
| database-engineer | Supabase/Postgres schema, migrations, RLS, indexes, seed scripts |
| devops-engineer | Vercel config, CI/CD, env vars, build pipeline, deploy scripts |
| performance-engineer | Bundle size, Core Web Vitals, rendering strategy, slow queries |
| qa-test-engineer | Automated tests, bug reproduction, manual test plans |
| code-reviewer | Pre-merge diff review for correctness/conventions (read-only) |
| security-auditor | Security audit — OWASP, RLS, secrets, injection (read-only) |
| ux-accessibility-designer | UX, visual design, design-system consistency, WCAG |
| seo-specialist | Metadata, structured data, sitemaps, crawlability |
| data-analyst | Demand/inventory analytics, metric definition, reporting |
| business-strategist | Business model, positioning, competitive & growth strategy |
| finance-analyst | Pricing, margin, unit economics, revenue projections |
| sales-strategist | B2B quote-to-order funnel, contractor account strategy |
| marketing-strategist | Brand, go-to-market, content, campaigns, merchandising |

## Reporting structure

1. **The Product Manager is the coordinator ("the director").** Unclear scope,
   conflicting priorities, or "who owns this?" questions go to the PM for a
   decision. The PM routes work to specialists and keeps scope focused.

2. **Every agent reports up.** Finish with a clear result, the blockers you hit,
   and any handoffs needed — so the orchestrator and PM have what they need to
   route the next step.

3. **Quality gates are independent.** code-reviewer and security-auditor report
   their findings directly; those findings can block a merge regardless of who
   requested the work. The PM does not override a gate's verdict.

4. **The PM itself reports to the orchestrator** (the human + lead Claude) for
   direction it cannot resolve from `docs/` or this directory.

## How agents ask each other for help

Agents run in isolation and cannot call one another directly. To ask for help,
end your report with a `## Handoffs` section. Each handoff:

- Names the target agent.
- States exactly what you need and why.
- Includes the context the agent needs to start (files, constraints, findings).

Example:

```
## Handoffs
- → database-engineer: need a `quote_revisions` table with RLS before I can
  wire the API route in app/api/quotes/[id]/revise. Columns and access rules TBD.
- → product-manager: the spec doesn't say whether revisions are versioned or
  destructive — need a scope call.
```

The orchestrator reads these and dispatches the next agent. Never silently
expand your work into another agent's domain — name the handoff instead.
