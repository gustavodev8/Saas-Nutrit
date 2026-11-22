# Candidate migrations

The versioned migration and matching pgTAP file in this directory are review
artifacts; neither is discovered by the Supabase CLI. Do not execute them
directly or copy them into CLI directories during ordinary local development.

## Controlled promotion

Promote a candidate only in a separately reviewed release change:

1. Confirm every earlier migration version is already applied to the target
   environment and inventory all later local migrations.
2. Confirm the candidate is the only intended pending version for that target;
   `supabase db push` applies every pending migration, not just a selected file.
3. Move the reviewed migration unchanged into `supabase/migrations/` and its
   matching `.test.sql` unchanged into `supabase/tests/`. Preserve the migration
   timestamp and filename. Check `supabase migration list` before any apply.
4. Apply only after an explicit environment/scope authorization and independent
   review of the planned migration set.

Until that promotion change exists, normal CLI migration and test commands do
not discover either candidate file, and the migration ledger sequence remains
unchanged.

## Public-release gate for access requests

The access-request form records affirmative consent for review and contact
about the SaaS. This does not establish legal compliance. Do not publicly
promote or activate this intake until the applicable privacy notice, data-use
purpose, contact channel, and retention/deletion period have been defined and
reviewed. No retention period is currently asserted by this candidate.
