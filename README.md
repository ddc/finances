# finances




CREATE USER finances WITH PASSWORD 'finances';
CREATE DATABASE finances OWNER finances;
GRANT ALL PRIVILEGES ON DATABASE finances TO finances;
\q



docker compose exec backend uv run --frozen --no-sync python manage.py seed_data

That creates:
- Username: admin
- Password: admin123

Or create one manually:

docker compose exec backend uv run --frozen --no-sync python manage.py createsuperuser
