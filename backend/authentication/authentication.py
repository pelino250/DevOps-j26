from django.conf import settings
from rest_framework.authentication import TokenAuthentication


class CookieTokenAuthentication(TokenAuthentication):
    """
    Authenticate using an httpOnly cookie instead of an Authorization header.
    Falls back to header-based auth for backward compatibility (e.g. tests).
    """

    def authenticate(self, request):
        # Try cookie first
        token = request.COOKIES.get(settings.AUTH_COOKIE_NAME)
        if token:
            return self.authenticate_credentials(token)
        # Fall back to standard header auth
        return super().authenticate(request)
