import tomllib
from pathlib import Path
from typing import Final

_pyproject_path = Path(__file__).resolve().parents[2] / "pyproject.toml"
with open(_pyproject_path, "rb") as f:
    _pyproject = tomllib.load(f)

APP_NAME: Final[str] = _pyproject["project"]["name"]
APP_VERSION: Final[str] = _pyproject["project"]["version"]
APP_DESCRIPTION: Final[str] = _pyproject["project"]["description"]
APP_AUTHOR: Final[str] = _pyproject["project"]["authors"][0]["name"]
APP_EMAIL: Final[str] = _pyproject["project"]["authors"][0]["email"]
APP_LICENSE: Final[str] = _pyproject["project"]["license"]["text"]
