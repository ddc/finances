import pathlib
import pytest
import shutil
import subprocess

_DOCKER = shutil.which("docker") or "docker"


@pytest.fixture(scope="session")
def project_root():
    return pathlib.Path(__file__).resolve().parents[3]


@pytest.fixture(scope="session")
def compose_file(project_root):
    return str(project_root / "docker-compose.yml")


@pytest.fixture(scope="session")
def docker_build(project_root):
    tag = "finances-backend:test"
    result = subprocess.run(
        [
            _DOCKER,
            "build",
            "-f",
            str(project_root / "backend" / "Dockerfile"),
            "--target",
            "python-base",
            "-t",
            tag,
            str(project_root / "backend"),
        ],
        capture_output=True,
        text=True,
        timeout=300,
    )
    if result.returncode != 0:
        pytest.skip(f"Docker build failed: {result.stderr}")
    return tag
