from fastapi_cache.key_builder import default_key_builder


def user_key_builder(func, namespace: str = "", request=None, response=None, args=None, kwargs=None):
    """Cache key builder that scopes entries by user id when available."""
    args = args or ()
    kwargs = kwargs or {}
    base_key = default_key_builder(func, namespace, request, response, args, kwargs)
    user = kwargs.get("current_user") or kwargs.get("user")
    user_id = getattr(user, "id", "anon")
    return f"{base_key}:user:{user_id}"
