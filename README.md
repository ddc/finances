# finances


## Create DJANGO_SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(50))"


## Create finances user and database
CREATE USER finances WITH PASSWORD 'finances';
CREATE DATABASE finances OWNER finances;
GRANT ALL PRIVILEGES ON DATABASE finances TO finances;
\q


## Create admin user
docker compose exec backend uv run --frozen --no-sync python manage.py seed_data
That creates:
- Username: admin
- Password: admin123

Or create one manually:
docker compose exec backend uv run --frozen --no-sync python manage.py createsuperuser
