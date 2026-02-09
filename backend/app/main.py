import logging
import os

from dotenv import load_dotenv

# Load environment variables from .env file at application startup
load_dotenv()

from fastapi import Depends, FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from sqlalchemy.exc import SQLAlchemyError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
import redis.asyncio as redis

from app.database import Base, engine
from app.models import user as _  # noqa: F401
from app.models import comment as _  # noqa: F401
from app.models import file as _  # noqa: F401
from app.routes import auth, tasks, comments, files, analytics, exports, users, websockets
from app.routes.files import files_by_id_router
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)

app = FastAPI(title="Task Management API")

# Initialize rate limiter: default 100 requests per minute per IP
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
app.state.limiter = limiter


class SkipOptionsForSlowAPI(BaseHTTPMiddleware):
    """Pass-through to force correct middleware flow (CORS → this → SlowAPI)."""
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            return await call_next(request)
        return await call_next(request)


# 1. CORS FIRST
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4173",
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# 2. OPTIONS pass-through
app.add_middleware(SkipOptionsForSlowAPI)
# 3. SlowAPI LAST
app.add_middleware(SlowAPIMiddleware)


@app.on_event("startup")
async def startup_event():
    """Create DB tables if missing (e.g. first run) and initialize cache."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables checked/created")
    except Exception as exc:
        logger.warning("Database create_all failed: %s", exc)

    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    try:
        redis_client = redis.from_url(redis_url, encoding="utf8", decode_responses=True)
        FastAPICache.init(RedisBackend(redis_client), prefix="task-cache")
        logger.info("Cache initialized with Redis backend")
    except Exception as exc:
        logger.warning("Cache initialization failed: %s; using in-memory fallback", exc)
        try:
            from fastapi_cache.backends.in_memory import InMemoryBackend
            FastAPICache.init(InMemoryBackend(), prefix="task-cache")
            logger.info("Cache initialized with in-memory backend")
        except Exception as fallback_exc:
            logger.warning("In-memory cache fallback failed: %s", fallback_exc)

# Include routers
app.include_router(exports.router)
app.include_router(tasks.router)
app.include_router(comments.router)
app.include_router(files.router)
app.include_router(files_by_id_router)
app.include_router(analytics.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(websockets.router)




@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "message": "Validation error",
            "errors": exc.errors(),
        },
    )


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(
    request: Request,
    exc: RateLimitExceeded
):
    """Handle rate limit exceeded errors."""
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "message": "Rate limit exceeded. Too many requests."
        },
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """Do not leak database exceptions to the client."""
    logger.error("Database error: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"message": "Internal server error"},
    )


@app.exception_handler(Exception)
async def global_exception_handler(
    request: Request,
    exc: Exception
):
    """Catch unhandled exceptions and return a safe error response without stack trace."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "message": "Internal server error"
        },
    )

@app.get("/", status_code=status.HTTP_200_OK)
def root():
    """Health check endpoint. Returns server status."""
    return {"status": "ok", "message": "Backend is running"}


@app.get("/me", status_code=status.HTTP_200_OK)
def read_current_user(current_user=Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    return {"id": current_user.id, "email": current_user.email}
