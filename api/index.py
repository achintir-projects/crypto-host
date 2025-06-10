# Save this as api/index.py
from app import app

# Vercel handler
def handler(request):
    return app(request.environ, lambda status, headers: None)

# For Vercel compatibility
application = app
