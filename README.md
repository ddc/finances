<h1 align="center">
  <img src="https://raw.githubusercontent.com/ddc/finances/refs/heads/main/frontend/public/favicon.svg" alt="finances" width="150">
  <br>
  finances
</h1>

<p align="center">
    <a href="https://github.com/sponsors/ddc"><img src="https://img.shields.io/static/v1?style=plastic&label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=ff69b4" alt="Sponsor"/></a>
    <br>
    <a href="https://ko-fi.com/ddc"><img src="https://img.shields.io/badge/Ko--fi-ddc-FF5E5B?style=plastic&logo=kofi&logoColor=white&color=brightgreen" alt="Ko-fi"/></a>
    <a href="https://www.paypal.com/ncp/payment/6G9Z78QHUD4RJ"><img src="https://img.shields.io/badge/Donate-PayPal-brightgreen.svg?style=plastic&logo=paypal&logoColor=white" alt="Donate"/></a>
    <br>
    <a href="https://www.python.org/downloads"><img src="https://img.shields.io/badge/python-3.14-blue.svg?style=plastic&logo=python&logoColor=3776AB" alt="Python"/></a>
    <a href="https://github.com/astral-sh/uv"><img src="https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/uv/main/assets/badge/v0.json&style=plastic" alt="uv"/></a>
    <a href="https://github.com/astral-sh/ruff"><img src="https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json&style=plastic" alt="Ruff"/></a>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=plastic&logo=creativecommons&logoColor=FFFFFF" alt="License: MIT"/></a>
    <a href="https://github.com/ddc/finances/releases/latest"><img src="https://img.shields.io/github/v/release/ddc/finances?style=plastic&logo=github&logoColor=white" alt="Release"/></a>
    <br>
    <a href="https://github.com/ddc/finances/issues"><img src="https://img.shields.io/github/issues/ddc/finances?style=plastic&logo=github&logoColor=white" alt="issues"/></a>
    <a href="https://codecov.io/gh/ddc/finances"><img src="https://img.shields.io/codecov/c/github/ddc/finances?token=E942EZII4Q&style=plastic&logo=codecov" alt="codecov"/></a>
    <a href="https://sonarcloud.io/dashboard?id=ddc_DiscordBot"><img src="https://img.shields.io/sonar/quality_gate/ddc_DiscordBot?server=https%3A%2F%2Fsonarcloud.io&style=plastic&logo=sonarqubecloud&logoColor=white" alt="Quality Gate Status"/></a>
    <a href="https://github.com/ddc/finances/actions/workflows/workflow.yml"><img src="https://img.shields.io/github/actions/workflow/status/ddc/finances/workflow.yml?style=plastic&logo=github&logoColor=white&label=CI%2FCD%20Pipeline" alt="CI/CD Pipeline"/></a>
    <a href="https://actions-badge.atrox.dev/ddc/finances/goto?ref=main"><img src="https://img.shields.io/endpoint.svg?url=https%3A//actions-badge.atrox.dev/ddc/finances/badge?ref=main&label=build&logo=github&style=plastic" alt="Build Status"/></a>
</p>

<p align="center">Personal finance management app</p>



# Create finances user and database
CREATE USER finances WITH PASSWORD 'finances';
CREATE DATABASE finances OWNER finances;
GRANT ALL PRIVILEGES ON DATABASE finances TO finances;
\q


# Create DJANGO_SECRET_KEY
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```


# Create admin user
```bash
docker compose exec backend uv run --frozen --no-sync python manage.py seed_data
```

That creates:
- Username: admin
- Password: admin123

Or create one manually:
```bash
docker compose exec backend uv run --frozen --no-sync python manage.py createsuperuser
```
