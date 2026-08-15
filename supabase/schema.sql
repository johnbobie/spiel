-- Schätzduell – Datenbankschema für Supabase.
--
-- Einmal komplett in den SQL Editor von Supabase einfügen und ausführen.
-- Das Skript darf gefahrlos mehrfach laufen; bestehende Spiele bleiben erhalten.

-- ---------------------------------------------------------------- Tabellen

create table if not exists public.games (
  code         text        primary key,
  question_ids text[]      not null,
  p1_id        text        not null,
  p1_name      text        not null,
  p2_id        text,
  p2_name      text,
  p1_progress  integer     not null default 0,
  p2_progress  integer     not null default 0,
  rematch      text,
  created_at   timestamptz not null default now()
);

-- Jede Schätzung steht in einer eigenen Zeile. Dadurch können beide Geräte
-- gleichzeitig schreiben, ohne sich gegenseitig zu überschreiben.
create table if not exists public.answers (
  code    text             not null references public.games(code) on delete cascade,
  q_index integer          not null,
  slot    text             not null check (slot in ('p1', 'p2')),
  value   double precision not null,
  primary key (code, q_index, slot)
);

-- ------------------------------------------------------------- Zugriffsrechte
--
-- Gespielt wird ohne Benutzerkonten: Wer den vierstelligen Spielcode hat,
-- darf mitspielen. Entsprechend darf die anonyme Rolle auf beide Tabellen
-- zugreifen. Ohne Code kommt man an nichts Persönliches – in der Datenbank
-- stehen nur Vornamen, Zahlen und Spielstände.

alter table public.games   enable row level security;
alter table public.answers enable row level security;

drop policy if exists "spiel_games" on public.games;
create policy "spiel_games" on public.games
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "spiel_answers" on public.answers;
create policy "spiel_answers" on public.answers
  for all to anon, authenticated using (true) with check (true);

-- --------------------------------------------------------------- Live-Updates
--
-- Damit das andere Gerät sofort mitbekommt, wenn geschätzt wurde.

alter table public.games   replica identity full;
alter table public.answers replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.games;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.answers;
exception
  when duplicate_object then null;
end $$;

-- ----------------------------------------------------------------- Aufräumen
--
-- Optional: alte Spiele löschen. Einfach gelegentlich von Hand ausführen,
-- oder unter Database -> Cron als wiederkehrende Aufgabe einrichten.
--
--   delete from public.games where created_at < now() - interval '90 days';
