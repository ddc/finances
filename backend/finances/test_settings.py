import os
import tempfile

os.environ.setdefault("LOG_DIRECTORY", tempfile.gettempdir())
os.environ.setdefault("LOG_STREAM_HANDLER", "False")

from finances.settings import *  # noqa: E402, F401, F403

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}
