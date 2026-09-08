-- Frieda care app — initial schema
-- Run this in the Supabase SQL editor (or `supabase db push`) on a fresh project.

-- ─────────────────────────────────────────────────────────────
-- Access control: only emails listed here may read/write anything.
-- Add your brother's email here once you have it (see bottom of file).
-- ─────────────────────────────────────────────────────────────
create table if not exists allowed_users (
  email text primary key
);

insert into allowed_users (email) values
  ('agop.pro@gmail.com')
on conflict (email) do nothing;

-- RLS on, no policies: no client (anon or authenticated) can read/write this
-- table directly via the API. Only is_allowed_user() below can see it, since
-- it's security definer.
alter table allowed_users enable row level security;

-- Helper used by every RLS policy below. security definer so it can read
-- allowed_users even though clients themselves can't.
create or replace function is_allowed_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from allowed_users
    where email = auth.jwt() ->> 'email'
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- Shopping list
-- ─────────────────────────────────────────────────────────────
create table if not exists shopping_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  notes text,
  done boolean not null default false,
  created_by text,
  created_at timestamptz not null default now()
);

alter table shopping_items enable row level security;
create policy "allowed users full access" on shopping_items
  for all using (is_allowed_user()) with check (is_allowed_user());

insert into shopping_items (title, notes, done) values
  ('Ballerina shoes — size 36', null, false),
  ('Open-toe shoes', 'From Bakakos pharmacy', false),
  ('Ράντσο (bed rail/cot) for Aster', 'Next to mother''s bed — dimensions TBD', false),
  ('Oven', 'Mother''s current one broke. Likely second-hand ~190€ from sankenourgio.gr (Piraeus). Brand/dimensions TBD.', false)
on conflict do nothing;

-- ─────────────────────────────────────────────────────────────
-- Expenses
-- ─────────────────────────────────────────────────────────────
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  amount numeric(10,2) not null,
  category text,
  paid_by text,
  expense_date date not null default current_date,
  receipt_url text,
  created_at timestamptz not null default now()
);

alter table expenses enable row level security;
create policy "allowed users full access" on expenses
  for all using (is_allowed_user()) with check (is_allowed_user());

insert into expenses (description, amount, category, paid_by, expense_date)
select 'Market In (groceries) — Νέα Φιλοθέη, Μπάκου 35', 27.01, 'Groceries', 'agop.pro@gmail.com', '2026-09-08'
where not exists (select 1 from expenses where description like 'Market In%' and expense_date = '2026-09-08');

-- ─────────────────────────────────────────────────────────────
-- Medications
-- ─────────────────────────────────────────────────────────────
create table if not exists medications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  dose text,
  schedule text,
  notes text,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table medications enable row level security;
create policy "allowed users full access" on medications
  for all using (is_allowed_user()) with check (is_allowed_user());

insert into medications (name, dose, schedule, notes) values
  ('Accu Thyrox', '2.5ml (from end of Sept — was 0.5→1→2→2.5ml titration through Aug/Sept)', 'Before breakfast, empty stomach', 'Thyroid, liquid drops. Endocrinologist appt end of Sept to reassess dose.'),
  ('Exelon', 'per patch', 'Change every morning, alternate sides day to day (right/left)', 'Patch'),
  ('Lasix', '½ tablet', 'Morning, dissolved in orangeade', 'Diuretic — for leg/foot swelling, increases urination'),
  ('Omalin', '1 + 1', 'Morning and evening', null),
  ('Ebixa', '20mg (10mg AM + 10mg PM, from 21/9 onward)', 'Mixed into coffee — see titration schedule in notes', 'Titration: 5mg AM only (20-30/8) → 10mg (31/8-9/9, 5+5) → 15mg (10-20/9, 10+5) → 20mg (from 21/9, 10+10)'),
  ('Filicine', '1/day', 'Daily, for 2 months', 'Confirm start date so end date is known'),
  ('Daktarin', 'apply to 2 affected fingers', 'Morning and/or evening', 'Fungal infection, topical')
on conflict do nothing;

-- ─────────────────────────────────────────────────────────────
-- ΚΕΠΑ procedure
-- ─────────────────────────────────────────────────────────────
create table if not exists kepa_steps (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  due_date date,
  created_at timestamptz not null default now()
);

alter table kepa_steps enable row level security;
create policy "allowed users full access" on kepa_steps
  for all using (is_allowed_user()) with check (is_allowed_user());

insert into kepa_steps (title, content, status) values
  ('Correct earlier certification error', 'Past paperwork incorrectly stated mother can use the toilet unassisted — this hurts approval odds for the attendance allowance and needs correcting.', 'todo'),
  ('Every new medical certificate must state 24hr supervision need', 'Neurologist, psychologist, etc. — explicitly state she needs 24-hour supervision/attendance due to disability, to support the επίδομα συνόδου (attendance allowance = 50% of disability pension).', 'todo')
on conflict do nothing;

-- ─────────────────────────────────────────────────────────────
-- Σύνταξη & Επίδομα (pension & allowance notes)
-- ─────────────────────────────────────────────────────────────
create table if not exists pension_notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  amount numeric(10,2),
  created_at timestamptz not null default now()
);

alter table pension_notes enable row level security;
create policy "allowed users full access" on pension_notes
  for all using (is_allowed_user()) with check (is_allowed_user());

insert into pension_notes (title, content, amount) values
  ('Pension (monthly)', 'Base pension income', 1700),
  ('Επίδομα συνόδου (attendance allowance)', '50% of disability pension. Requires neurologist certification explicitly stating 24hr supervision need — see ΚΕΠΑ procedure page. Not yet approved.', null)
on conflict do nothing;

-- ─────────────────────────────────────────────────────────────
-- Medical exams
-- ─────────────────────────────────────────────────────────────
create table if not exists medical_exams (
  id uuid primary key default gen_random_uuid(),
  exam_date date not null,
  doctor text not null,
  place text,
  notes text,
  follow_up_date date,
  image_url text,
  created_at timestamptz not null default now()
);

alter table medical_exams enable row level security;
create policy "allowed users full access" on medical_exams
  for all using (is_allowed_user()) with check (is_allowed_user());

-- ─────────────────────────────────────────────────────────────
-- IMPORTANT: add your brother's email before he tries to log in.
--   insert into allowed_users (email) values ('brother@example.com');
-- ─────────────────────────────────────────────────────────────
