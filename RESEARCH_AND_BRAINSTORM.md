# ArtisanMu Research and Brainstorm

## Research Signals

- Search must support natural problem language, not only exact trade names. Baymard's search UX research highlights that users submit many query types and need guidance through search, results, and filtering.
  Source: https://baymard.com/ecommerce-search
- Admin dashboards should reduce scanning cost, keep data light, and use progressive disclosure. The admin console should surface the next decision first: validate, pause, approve, publish, or review.
  Source: https://www.nielsen.com/insights/2019/7-key-features-of-a-marketing-kpi-dashboard/
- Mobile navigation should keep primary destinations reachable and stable. For ArtisanMu, public users need Search, Request, and Artisan access; operators need Review, Ads, Jobs, and Rules.
  Sources: https://developer.apple.com/design/human-interface-guidelines/tab-bars and https://m2.material.io/components/navigation-drawer
- Touch targets must be large enough and spaced enough for mobile use. Use 44px-ish controls where practical and never rely on tiny icon-only controls for core actions.
  Source: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- Ads should be native, labelled, and placed in the content flow without surprising users. Avoid sticky ad blocks beside primary action buttons.
  Source: https://admob.google.com/home/resources/native-ads-playbook/
- Supabase writes cannot be done safely from the browser until grants and RLS are fixed. Exposed schemas need RLS, minimum grants, and server-owned administrative mutations.
  Sources: https://supabase.com/docs/guides/database/postgres/row-level-security and https://supabase.com/docs/guides/api/securing-your-api

## Brainstorm Direction

### Public Marketplace

- Keep the first screen search-first.
- Accept problem-language aliases: leak, wiring, AC, lock, cabinet, paint.
- Show the most actionable match first: available, verified, close, reviewed.
- Keep sponsor placements small, labelled, and away from accidental tap zones.
- Use bottom mobile actions because the app may become a mobile app shell.

### Admin Console

- Keep it discreet at `/admin`, not in public navigation.
- First task is always the approval queue.
- Artisan approval should combine:
  - verification checks
  - risk level
  - badge choice
  - WhatsApp contact
  - approve/pause
- Ads should be easy to manage by surface:
  - search result card
  - request panel
  - artisan dashboard
- Each ad needs status, budget, date window, sponsor, copy, and preview.

### Artisan Dashboard

- Make availability impossible to miss.
- Jobs should show price, distance, timing, and one primary action.
- Profile quality should be visual but not gamified too much.
- Badges should be visible and requestable, but granting remains admin-only.
- Sponsored offers for artisans can exist, but should sit below work actions.

## Product Rules

- No anonymous browser writes to core tables.
- No admin controls in the public navbar.
- No unlabeled ads.
- No ad next to a primary job/request tap target.
- No mobile control below 44px height for important actions.
- No artisan badge without audit trail.
