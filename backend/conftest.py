import os

# Force SQLite for all tests (no PostgreSQL server needed)
os.environ.setdefault("USE_SQLITE", "True")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
