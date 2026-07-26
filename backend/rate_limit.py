"""
rate_limit.py
-------------
Centralized rate limiting configuration using slowapi.
Provides a shared limiter instance for all routers.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

# Shared limiter — imported by auth.py, auth_otp.py, etc.
limiter = Limiter(key_func=get_remote_address)
