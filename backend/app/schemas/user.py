from pydantic import BaseModel, EmailStr, field_validator


# Bcrypt has a 72-byte limit; enforce in schema so we never hash longer passwords
BCRYPT_MAX_BYTES = 72


def _password_bytes_validator(v: str) -> str:
    if len(v.encode("utf-8")) > BCRYPT_MAX_BYTES:
        raise ValueError(f"Password must be at most {BCRYPT_MAX_BYTES} bytes")
    return v


class UserCreate(BaseModel):
    """Schema for user registration."""
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_max_bytes(cls, v: str) -> str:
        return _password_bytes_validator(v)


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_max_bytes(cls, v: str) -> str:
        return _password_bytes_validator(v)


class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str = "bearer"
