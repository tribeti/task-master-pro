begin;

create table if not exists public.task_assignees (
  id bigserial primary key,
  task_id integer not null references public.tasks (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  constraint task_assignees_task_user_unique unique (task_id, user_id)
);

create index if not exists idx_task_assignees_task_id
  on public.task_assignees (task_id);

create index if not exists idx_task_assignees_user_id
  on public.task_assignees (user_id);

insert into public.task_assignees (task_id, user_id)
select t.id, t.assignee_id
from public.tasks t
where t.assignee_id is not null
on conflict (task_id, user_id) do nothing;

commit;
