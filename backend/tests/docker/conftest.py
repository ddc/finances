import pathlib
import pytest
import shutil
import subprocess


@pytest.fixture(scope="session")
def docker_bin() -> str:
    return shutil.which("docker") or "docker"  # noqa: inspection


@pytest.fixture(scope="session")
def project_root():
    return pathlib.Path(__file__).resolve().parents[3]


@pytest.fixture(scope="session")
def compose_file(project_root):
    return str(project_root / "docker-compose.yml")


@pytest.fixture(scope="session")
def python_image(project_root) -> str:
    """Resolve PYTHON_IMAGE the way compose does: .env is authoritative, last value wins."""
    for name in (".env", ".env.example"):
        env_file = project_root / name
        if not env_file.exists():
            continue
        found = [
            value.strip()
            for key, sep, value in (line.partition("=") for line in env_file.read_text().splitlines())
            if sep and key.strip() == "PYTHON_IMAGE"
        ]
        if found:
            return found[-1]
    pytest.fail("PYTHON_IMAGE is not defined in .env or .env.example")


@pytest.fixture(scope="session")
def docker_build(project_root, docker_bin, python_image):
    tag = "finances-backend:test"
    result = subprocess.run(
        [
            docker_bin,
            "build",
            "-f",
            str(project_root / "backend" / "Dockerfile"),
            "--build-arg",
            f"PYTHON_IMAGE={python_image}",
            "--target",
            "final",
            "-t",
            tag,
            str(project_root / "backend"),
        ],
        capture_output=True,
        text=True,
        timeout=600,
    )
    assert result.returncode == 0, f"Docker build failed:\n{result.stderr}"
    return tag
