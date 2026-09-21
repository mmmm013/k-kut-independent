-- ─────────────────────────────────────────────────────────────────────────────
-- K-KUT — read-only current-state audit
--
-- Paste into the Supabase SQL editor for project vwlzubxshjjonabpeagd.
-- STRICTLY READ-ONLY: every statement is a SELECT. No DDL, no DML, no grants.
-- Safe under the ACTIVE_OWNER_AUTHORIZED_FREEZE, which permits read-only
-- audits and reports.
--
-- Run the blocks in order and paste the output back. Together they answer the
-- questions that currently block any further work.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1 ── Does the schema this repo's code queries actually exist, and how big?
--     Answers whether our migrations would have collided, and with what.
select c.relname                             as object,
       case c.relkind when 'r' then 'table'
                      when 'v' then 'view'
                      when 'm' then 'matview'
                      else c.relkind::text end as kind,
       c.relrowsecurity                      as rls_on,
       (select count(*) from pg_policies p
         where p.schemaname='public' and p.tablename=c.relname) as policies,
       c.reltuples::bigint                   as approx_rows
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r','v','m')
order by c.relkind, c.relname;

-- 2 ── The security defect: which public tables have RLS OFF, or a policy
--     that lets anon read everything? (The delta packet reported six.)
select c.relname as table_name,
       c.relrowsecurity as rls_on,
       coalesce(string_agg(p.policyname || ' [' || p.cmd || '] ' ||
                coalesce(p.qual,'(no using)'), ' ; '), '(no policies)') as policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p on p.schemaname='public' and p.tablename=c.relname
where n.nspname='public' and c.relkind='r'
group by c.relname, c.relrowsecurity
having c.relrowsecurity = false
    or coalesce(string_agg(coalesce(p.qual,''), ' '), '') ilike '%true%'
order by c.relrowsecurity, c.relname;

-- 3 ── Find the semantic vocabulary tables (38 Themes / 74 sentiment keys)
--     without guessing their names.
select table_name, column_name, data_type
from information_schema.columns
where table_schema='public'
  and (column_name ilike '%theme%'
    or column_name ilike '%sentiment%'
    or column_name ilike '%ii_key%'
    or column_name ilike '%placement%'
    or column_name ilike '%mgs%')
order by table_name, ordinal_position;

-- 4 ── What an II actually is: the placement key and its cardinality.
--     Replace <placement_table> with whatever block 3 reveals, then run.
-- select platform, count(*) as placements,
--        count(distinct ii_key) as distinct_iis,
--        count(distinct theme_id) as themes,
--        count(distinct sentiment_key) as sentiment_keys
-- from public.<placement_table>
-- group by platform order by placements desc;

-- 5 ── Current governed eligibility: how many records reach STAGE?
--     Looks for any status-bearing column carrying the controlled vocabulary.
select table_name, column_name
from information_schema.columns
where table_schema='public'
  and (column_name ilike '%stage%' or column_name ilike '%triage%'
    or column_name ilike '%hold%'  or column_name ilike '%release_state%'
    or column_name ilike '%status%')
order by table_name, column_name;

-- 6 ── Storage reality: buckets, public flag, object counts.
select b.name as bucket, b.public,
       (select count(*) from storage.objects o where o.bucket_id = b.id) as objects
from storage.buckets b
order by b.public desc, objects desc;

-- 7 ── Does anything still reference the buckets our code hardcodes?
select b.name as bucket, count(o.id) as objects,
       min(o.created_at) as first_object, max(o.created_at) as last_object
from storage.buckets b
left join storage.objects o on o.bucket_id = b.id
where b.name in ('tracks','kuts','ii-delivery','mk-products','audiostore')
group by b.name order by b.name;
