create table if not exists public.searches (
  id text primary key,
  query text not null,
  location text,
  category text,
  mode text,
  max_price numeric,
  year integer,
  result_count integer,
  median numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id text primary key,
  query text not null,
  location text,
  category text,
  mode text,
  max_price numeric,
  year integer,
  email text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.searches enable row level security;
alter table public.alerts enable row level security;
