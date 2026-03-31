begin;

create table if not exists public.workspaces (
  id bigserial primary key,
  owner_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_workspaces_owner_id
  on public.workspaces (owner_id);

alter table public.boards
  add column if not exists workspace_id bigint references public.workspaces (id) on delete set null;

create table if not exists public.workspace_members (
  id bigserial primary key,
  workspace_id bigint not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null default 'Member',
  joined_at timestamptz not null default now(),
  constraint workspace_members_workspace_user_unique unique (workspace_id, user_id)
);

create index if not exists idx_workspace_members_workspace_id
  on public.workspace_members (workspace_id);

create index if not exists idx_workspace_members_user_id
  on public.workspace_members (user_id);

insert into public.workspaces (owner_id, name)
select distinct b.owner_id, concat('Workspace ', b.owner_id::text)
from public.boards b
where b.owner_id is not null
on conflict (owner_id) do nothing;

update public.boards b
set workspace_id = w.id
from public.workspaces w
where w.owner_id = b.owner_id
  and b.workspace_id is null;

insert into public.workspace_members (workspace_id, user_id, role)
select distinct b.workspace_id, b.owner_id, 'Owner'
from public.boards b
where b.workspace_id is not null
  and b.owner_id is not null
on conflict (workspace_id, user_id) do update set role = excluded.role;

insert into public.workspace_members (workspace_id, user_id, role)
select distinct b.workspace_id, bm.user_id, 'Member'
from public.board_members bm
join public.boards b on b.id = bm.board_id
where b.workspace_id is not null
on conflict (workspace_id, user_id) do nothing;

commit;
