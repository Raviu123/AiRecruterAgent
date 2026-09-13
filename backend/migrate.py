"""Apply the SQL files in backend/migrations to the Supabase Postgres database.

Usage (from the backend/ folder, with the virtualenv active):
    python migrate.py            apply pending migrations
    python migrate.py --status   show applied and pending migrations

Requires SUPABASE_DB_URL in backend/.env (Supabase dashboard -> Connect -> Session pooler).
Each migration runs in its own transaction and is recorded in public.schema_migrations,
so running the command again only applies new files.
"""

import argparse
import logging
import sys
from pathlib import Path

import psycopg

from app.config import BACKEND_DIR, get_settings

MIGRATIONS_DIR = BACKEND_DIR / "migrations"

logging.basicConfig(level=logging.INFO, format="%(levelname)-7s %(message)s")
logger = logging.getLogger("migrate")

CREATE_MIGRATIONS_TABLE = """
create table if not exists public.schema_migrations (
  version     text primary key,
  applied_at  timestamptz not null default now()
);
alter table public.schema_migrations enable row level security;
"""


def discover_migrations(directory: Path = MIGRATIONS_DIR) -> list[Path]:
    return sorted(directory.glob("*.sql"))


def applied_versions(conn: psycopg.Connection) -> set[str]:
    return {row[0] for row in conn.execute("select version from public.schema_migrations")}


def apply_migration(conn: psycopg.Connection, path: Path) -> None:
    with conn.transaction():
        # No parameters -> simple query protocol, so a file may contain many statements.
        conn.execute(path.read_text(encoding="utf-8"))
        conn.execute("insert into public.schema_migrations (version) values (%s)", (path.stem,))


def run(database_url: str, status_only: bool, directory: Path = MIGRATIONS_DIR) -> int:
    migrations = discover_migrations(directory)
    if not migrations:
        logger.warning("No migration files found in %s", directory)
        return 0

    try:
        conn = psycopg.connect(database_url, autocommit=True, prepare_threshold=None, connect_timeout=15)
    except psycopg.OperationalError as exc:
        logger.error("Could not connect to the database: %s", str(exc).strip())
        logger.error(
            "Check SUPABASE_DB_URL and the password. If you used the 'Direct connection' string, "
            "try the 'Session pooler' string instead (the direct host is IPv6-only)."
        )
        return 1

    with conn:
        logger.info("Connected to %s (database %s)", conn.info.host, conn.info.dbname)
        conn.execute(CREATE_MIGRATIONS_TABLE)
        done = applied_versions(conn)
        pending = [path for path in migrations if path.stem not in done]

        for path in migrations:
            logger.info("  [%s] %s", "applied" if path.stem in done else "pending", path.name)

        if status_only:
            return 0
        if not pending:
            logger.info("Database is up to date.")
            return 0

        for path in pending:
            logger.info("Applying %s ...", path.name)
            try:
                apply_migration(conn, path)
            except psycopg.Error as exc:
                logger.error("Failed on %s (rolled back): %s", path.name, str(exc).strip())
                return 1
            logger.info("Applied %s", path.name)

        # Make the Supabase REST API pick up the new tables immediately.
        conn.execute("notify pgrst, 'reload schema'")
        logger.info("Applied %d migration(s). Restart the backend to re-run the startup checks.", len(pending))
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--status", action="store_true", help="show applied and pending migrations without applying")
    args = parser.parse_args()

    database_url = get_settings().supabase_db_url
    if not database_url:
        logger.error(
            "SUPABASE_DB_URL is not set in backend/.env. In the Supabase dashboard click 'Connect', "
            "copy the 'Session pooler' connection string and replace [YOUR-PASSWORD] with your database password."
        )
        return 1
    return run(database_url, status_only=args.status)


if __name__ == "__main__":
    sys.exit(main())
