from core.permissions import IsAdminOrReadOnly
from unittest.mock import MagicMock


class TestIsAdminOrReadOnly:
    def setup_method(self):
        self.permission = IsAdminOrReadOnly()

    def test_safe_methods_allowed_for_viewer(self):
        request = MagicMock()
        request.method = "GET"
        request.user.is_staff = False
        assert self.permission.has_permission(request, None) is True

    def test_unsafe_methods_denied_for_viewer(self):
        request = MagicMock()
        request.method = "POST"
        request.user.is_staff = False
        assert self.permission.has_permission(request, None) is False

    def test_unsafe_methods_allowed_for_admin(self):
        request = MagicMock()
        request.method = "POST"
        request.user.is_staff = True
        assert self.permission.has_permission(request, None) is True

    def test_head_method_allowed_for_viewer(self):
        request = MagicMock()
        request.method = "HEAD"
        request.user.is_staff = False
        assert self.permission.has_permission(request, None) is True

    def test_options_method_allowed_for_viewer(self):
        request = MagicMock()
        request.method = "OPTIONS"
        request.user.is_staff = False
        assert self.permission.has_permission(request, None) is True

    def test_put_denied_for_viewer(self):
        request = MagicMock()
        request.method = "PUT"
        request.user.is_staff = False
        assert self.permission.has_permission(request, None) is False

    def test_delete_denied_for_viewer(self):
        request = MagicMock()
        request.method = "DELETE"
        request.user.is_staff = False
        assert self.permission.has_permission(request, None) is False
