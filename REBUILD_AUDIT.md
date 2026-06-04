# ArtisanMu Rebuild Audit

## Product Direction

ArtisanMu should behave less like a directory and more like a dispatch app:

- A visitor searches by trade, location, urgency, and problem.
- The app ranks verified artisans by availability, distance/ETA, rating, and trade fit.
- The visitor sends one clean job brief instead of calling many numbers.
- The system rotates stale requests, reminds artisans, expires dead leads, and asks for a review after the job.

## Current Backend Findings

- `artisans`, `job_requests`, `invoices`, `invoice_items`, and `products` exist in Supabase.
- The live `artisans` table should drive public profiles. Fake fallback accounts have been removed so empty datasets show setup states instead of invented artisans.
- Row Level Security is enabled, but several public policies and grants are too broad for production:
  - anon can update/manage main tables.
  - anon storage uploads are allowed.
  - public portfolio deletion is allowed.
- No backend automation is currently present. There are no public functions or edge functions for reminders, matching, request expiry, validation, or review collection.

## Quick Rebuild Scope

The local Next.js rebuild is intentionally frontend-first:

- Next.js App Router with server-side Supabase reads.
- Search-first, mobile-first marketplace UI.
- Artisan result ranking and selection in the client.
- WhatsApp-ready request handoff.
- Compact sponsored placement area without blocking search.
- Footer contact set to `hello@octolabs.app`.

## Backend Work Before Production

- Replace broad anon write access with server-owned mutations.
- Add request creation through an API route or Supabase Edge Function.
- Keep public reads narrow: verified artisans only, approved public profile fields only.
- Add a private admin workflow for verification, job status changes, and abuse handling.
- Add automation for stale request expiry, artisan reminders, review prompts, and suspicious upload cleanup.
- Move uploads behind signed URLs and storage validation.

## Recommended MVP Milestone

1. Validate the new search and request UI locally.
2. Lock Supabase RLS and grants.
3. Add safe request creation.
4. Add artisan claim/availability workflow.
5. Push to GitHub and deploy to Vercel.
