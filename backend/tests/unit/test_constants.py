from core.constants.variables import APP_AUTHOR, APP_DESCRIPTION, APP_EMAIL, APP_LICENSE, APP_NAME, APP_VERSION


class TestVariables:
    def test_app_name(self):
        assert APP_NAME == "finances"

    def test_app_version(self):
        assert APP_VERSION

    def test_app_description(self):
        assert APP_DESCRIPTION

    def test_app_author(self):
        assert APP_AUTHOR

    def test_app_email(self):
        assert "@" in APP_EMAIL

    def test_app_license(self):
        assert APP_LICENSE
