from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed

COOKIE_NAME = "auth_token"


class CookieTokenAuthentication(TokenAuthentication):
    """Token auth that reads from httpOnly cookie first, then falls back to Authorization header.
    Also enforces token expiration."""

    def authenticate(self, request):
        # Try cookie first
        token_key = request.COOKIES.get(COOKIE_NAME)
        if token_key:
            return self.authenticate_credentials(token_key)
        # Fall back to header
        return super().authenticate(request)

    def authenticate_credentials(self, key):
        user, token = super().authenticate_credentials(key)
        # Check expiration
        expiry_hours = settings.ENV.TOKEN_EXPIRY_HOURS
        if expiry_hours > 0:
            token_age = timezone.now() - token.created
            if token_age > timedelta(hours=expiry_hours):
                token.delete()
                raise AuthenticationFailed("Token has expired")
        return user, token
