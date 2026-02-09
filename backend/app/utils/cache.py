from fastapi_cache.key_builder import default_key_builder


def user_key_builder(func, namespace: str = "", request=None, response=None, args=None, kwargs=None):
    """Cache key builder that scopes entries by user id when available."""
    args = args or ()
    kwargs = kwargs or {}
    base_key = default_key_builder(func, namespace, request, response, args, kwargs)
    user = kwargs.get("current_user") or kwargs.get("user")
    user_id = getattr(user, "id", "anon")
    key = f"{base_key}:user:{user_id}"
    # Trends endpoint: include `days` so each range gets its own cache entry (avoids stale 1-point response)
    if request and hasattr(request, "url") and request.url and "trends" in request.url.path:
        days = request.query_params.get("days", "30") if hasattr(request, "query_params") else kwargs.get("days", "30")
        key = f"{key}:days:{days}"
    return key
