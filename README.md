<h1 align="center">
  <img src="https://raw.githubusercontent.com/ddc/finances/refs/heads/main/frontend/public/favicon.svg" alt="finances" width="150">
  <br>
  Personal finance management app
</h1>

<p align="center">
    <a href="https://github.com/sponsors/ddc"><img src="https://img.shields.io/static/v1?style=plastic&label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=ff69b4" alt="Sponsor"/></a>
    <br>
    <a href="https://ko-fi.com/ddc"><img src="https://img.shields.io/badge/Ko--fi-ddc-FF5E5B?style=plastic&logo=kofi&logoColor=white&color=brightgreen" alt="Ko-fi"/></a>
    <a href="https://www.paypal.com/ncp/payment/6G9Z78QHUD4RJ"><img src="https://img.shields.io/badge/Donate-PayPal-brightgreen.svg?style=plastic&logo=paypal&logoColor=white" alt="Donate"/></a>
    <br>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=plastic&logo=creativecommons&logoColor=FFFFFF" alt="License: MIT"/></a>
    <a href="https://github.com/ddc/finances/releases/latest"><img src="https://img.shields.io/github/v/release/ddc/finances?style=plastic&logo=github&logoColor=white" alt="Release"/></a>
    <br>
    <a href="https://www.python.org/downloads"><img src="https://img.shields.io/badge/python-3.14-blue.svg?style=plastic&logo=python&logoColor=3776AB" alt="Python"/></a>
    <a href="https://www.djangoproject.com"><img src="https://img.shields.io/badge/Django-6.0-092E20.svg?style=plastic&logo=django&logoColor=white" alt="Django"/></a>
    <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-61DAFB.svg?style=plastic&logo=react&logoColor=white" alt="React"/></a>
    <a href="https://bun.sh"><img src="https://img.shields.io/badge/Bun-1.3-fbf0df.svg?style=plastic&logo=bun&logoColor=white" alt="Bun"/></a>
    <a href="https://github.com/astral-sh/uv"><img src="https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/uv/main/assets/badge/v0.json&style=plastic" alt="uv"/></a>
    <a href="https://github.com/astral-sh/ruff"><img src="https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json&style=plastic" alt="Ruff"/></a>
    <br>
    <a href="https://github.com/ddc/finances/issues"><img src="https://img.shields.io/github/issues/ddc/finances?style=plastic&logo=github&logoColor=white" alt="issues"/></a>
    <a href="https://codecov.io/gh/ddc/finances"><img src="https://img.shields.io/codecov/c/github/ddc/finances?token=Y43wp9vain&style=plastic&logo=codecov" alt="codecov"/></a>
    <a href="https://sonarcloud.io/component_measures?id=ddc_finances&metric=coverage"><img src="https://sonarcloud.io/api/project_badges/measure?project=ddc_finances&metric=coverage" alt="SonarCloud Coverage"/></a>
    <a href="https://sonarcloud.io/dashboard?id=ddc_finances"><img src="https://img.shields.io/sonar/quality_gate/ddc_finances?server=https%3A%2F%2Fsonarcloud.io&style=plastic&logo=sonarqubecloud&logoColor=white" alt="Quality Gate Status"/></a>
    <a href="https://sonarcloud.io/component_measures?id=ddc_finances&metric=Security"><img src="https://sonarcloud.io/api/project_badges/measure?project=ddc_finances&metric=security_rating" alt="Security Rating"/></a>
    <a href="https://github.com/ddc/finances/actions/workflows/workflow.yml"><img src="https://img.shields.io/github/actions/workflow/status/ddc/finances/workflow.yml?style=plastic&logo=github&logoColor=white&label=CI%2FCD%20Pipeline" alt="CI/CD Pipeline"/></a>
    <a href="https://actions-badge.atrox.dev/ddc/finances/goto?ref=main"><img src="https://img.shields.io/endpoint.svg?url=https%3A//actions-badge.atrox.dev/ddc/finances/badge?ref=main&label=build&logo=github&style=plastic" alt="Build Status"/></a>
</p>

## Table of Contents

- [Stack](#stack)
- [Timezone Handling](#timezone-handling)
- [API Endpoints](#api-endpoints)
- [Setup](#setup)
- [Development](#development)
- [Running Tests](#running-tests)
- [Deployment](#deployment)
- [Local Development with Database](#local-development-with-database)
- [License](#license)
- [Support](#support)

---

## Stack

| Layer           | Technology                                           |
|-----------------|------------------------------------------------------|
| Backend         | Django 6.0 + Django REST Framework                   |
| Frontend        | React 19 + Vite + MUI + Recharts                     |
| Database        | PostgreSQL (data + file storage)                     |
| Auth            | httpOnly cookie + token expiration                   |
| SSL             | TLSv1.3 self-signed certificates                     |
| i18n            | EN-US, PT-BR (locale-aware number formatting)        |
| File Storage    | PDF files stored in PostgreSQL (BinaryField)         |
| Package Manager | uv (backend), bun (frontend)                         |
| Linting         | ruff (backend), eslint (frontend)                    |
| Testing         | pytest + testcontainers (backend), vitest (frontend) |
| Deploy          | Docker Compose with HTTPS                            |

## Timezone Handling

| Layer              | Timezone                                                        |
|--------------------|-----------------------------------------------------------------|
| **Database**       | UTC (always)                                                    |
| **Django API**     | Returns UTC strings                                             |
| **React frontend** | Converts to browser's local timezone via `toLocaleDateString()` |
| **Django admin**   | Uses `DJANGO_TIME_ZONE` from `.env`                             |

Timestamps are always stored in UTC. The frontend displays them in the user's browser timezone automatically. The
`DJANGO_TIME_ZONE` env var only affects the Django admin panel.

## API Endpoints

Base URL: `/api/v1/`

### Authentication

| Method | Endpoint      | Description                    | Auth     |
|--------|---------------|--------------------------------|----------|
| POST   | /auth/login/  | Login, returns httpOnly cookie | Public   |
| POST   | /auth/logout/ | Logout, clears cookie          | Required |
| GET    | /auth/me/     | Current user info + role       | Required |

### Dashboard

| Method | Endpoint    | Description                                     | Auth     |
|--------|-------------|-------------------------------------------------|----------|
| GET    | /dashboard/ | Aggregated data (year, month, currency filters) | Required |

### CRUD Endpoints

| Method         | Endpoint           | Description               | Auth                    |
|----------------|--------------------|---------------------------|-------------------------|
| GET/POST       | /expenses/         | List / Create expenses    | Read: all, Write: admin |
| GET/PUT/DELETE | /expenses/{id}/    | Detail / Update / Delete  | Read: all, Write: admin |
| GET/POST       | /deposits/         | List / Create deposits    | Read: all, Write: admin |
| GET/PUT/DELETE | /deposits/{id}/    | Detail / Update / Delete  | Read: all, Write: admin |
| GET/POST       | /transfers/        | List / Create transfers   | Read: all, Write: admin |
| GET/PUT/DELETE | /transfers/{id}/   | Detail / Update / Delete  | Read: all, Write: admin |
| GET/POST       | /nfe-samples/      | List / Create NFE samples | Read: all, Write: admin |
| GET/PUT/DELETE | /nfe-samples/{id}/ | Detail / Update / Delete  | Read: all, Write: admin |

### File Downloads (PDF stored in PostgreSQL)

| Method | Endpoint                     | Description           | Auth     |
|--------|------------------------------|-----------------------|----------|
| GET    | /deposits/{id}/file/nfe/     | Download NFE PDF      | Required |
| GET    | /deposits/{id}/file/invoice/ | Download Invoice PDF  | Required |
| GET    | /transfers/{id}/file/        | Download Transfer PDF | Required |

### Lookup Tables (read-only)

| Method | Endpoint             | Description             | Auth     |
|--------|----------------------|-------------------------|----------|
| GET    | /expense-categories/ | List expense categories | Required |
| GET    | /currencies/         | List currencies         | Required |
| GET    | /companies/          | List companies          | Required |
| GET    | /banks/              | List banks              | Required |

## Setup

### 1. Create database user and database

```sql
SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
 WHERE datname = 'finances'
   AND pid <> pg_backend_pid();
DROP
DATABASE IF EXISTS finances;
DROP ROLE if EXISTS finances;
CREATE
USER finances WITH PASSWORD 'finances';
CREATE
DATABASE finances OWNER finances;
GRANT ALL PRIVILEGES ON DATABASE
finances TO finances;
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

Generate a secret key:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

### 3. Generate SSL certificates

```bash
./utilities/create_ssl_certs.sh
```

Import `certs/finances_ca.crt` into your browser's trusted certificate authorities.

### 4. Start the application

```bash
docker compose up -d --build
```

On startup, the backend automatically:

- Runs database migrations
- Clears all auth tokens (forces re-login)
- Seeds lookup data (categories, currencies, companies, banks) and creates the admin user
- Collects static files
- Starts gunicorn

### 5. Seed data

Seed data runs automatically on every deploy. To run it manually:

```bash
docker compose exec backend uv run --frozen --no-sync python manage.py seed_data
```

This creates (if not already existing):

- **Admin user** — credentials from `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `.env`
- **Expense categories** — from `SEED_CATEGORIES` in `.env`
- **Currencies** — from `SEED_CURRENCIES` in `.env`
- **Companies** — from `SEED_COMPANIES` in `.env`
- **Banks** — from `SEED_BANKS` in `.env`

Or create a user manually:

```bash
docker compose exec backend uv run --frozen --no-sync python manage.py createsuperuser
```

### 6. Managing lookup tables

Expense categories, currencies, companies, and banks can be added, edited, or removed via the Django admin panel at
`/admin/`. The frontend dropdowns update automatically from the database — no code changes needed.

## Development

### Backend

Requires [UV](https://docs.astral.sh/uv/getting-started/installation/) to be installed.

```bash
cd backend
uv sync --all-groups
```

### Frontend

Requires [Bun](https://bun.sh/) to be installed.

```bash
cd frontend
bun install
bun run dev
```

### Running tests

From the `backend/` directory:

```bash
# All tests
uv run poe tests

# Backend only
uv run poe test-backend              # unit tests + coverage
uv run poe test-backend-integration  # integration tests (testcontainers)
uv run poe test-backend-docker       # docker tests (hadolint, compose)

# Frontend only
uv run poe test-frontend             # unit tests
uv run poe test-frontend-integration # integration tests

# Linting
uv run poe linter-backend            # ruff
uv run poe linter-frontend           # eslint

# Update dependencies
uv run poe update-backend
uv run poe update-frontend
uv run poe sync-version              # sync pyproject.toml version to package.json
```

## Deployment

### Update and restart

```bash
./utilities/update.sh
```

### Start / Stop

```bash
./utilities/start.sh
./utilities/stop.sh
```

## Local development with database

For local development with a containerized PostgreSQL:

```bash
docker compose -f docker-compose-localdb.yml up -d
```

Set `.env`:

```
POSTGRES_HOST=finances_database
```

## License
Released under the [MIT License](LICENSE)

## Support
If you find this project helpful, consider supporting development.

<a href='https://github.com/sponsors/ddc' target='_blank'><img height='24' style='border:0px;height:24px;' src='https://img.shields.io/badge/Sponsor-❤-ea4aaa?style=plastic&logo=github&logoColor=white' border='0' alt='Sponsor on GitHub' /></a>
<a href='https://ko-fi.com/ddc' target='_blank'><img height='30' style='border:0px;height:30px;' src='https://storage.ko-fi.com/cdn/kofi2.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
<a href='https://www.paypal.com/ncp/payment/6G9Z78QHUD4RJ' target='_blank'><img height='30' style='border:0px;height:30px;' src='https://www.paypalobjects.com/digitalassets/c/website/marketing/apac/C2/logos-buttons/optimize/44_Yellow_PayPal_Pill_Button.png' border='0' alt='Donate via PayPal' /></a>
