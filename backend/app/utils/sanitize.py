"""Input sanitization for user-provided text to reduce XSS and injection risk."""
import re
from typing import Optional

# Strip script/iframe and dangerous attributes; allow safe content
_SCRIPT_PATTERN = re.compile(
    r"<script\b[^>]*>.*?</script>|"
    r"<iframe\b[^>]*>.*?</iframe>|"
    r"\bjavascript\s*:|"
    r"\bon\w+\s*=",
    re.IGNORECASE | re.DOTALL,
)
_TAG_PATTERN = re.compile(r"<[^>]+>")


def sanitize_text(value: Optional[str], max_length: int = 50_000) -> str:
    """
    Sanitize user text: remove script/iframe and dangerous patterns, strip HTML tags,
    and limit length. Use for task title/description and comment content.
    """
    if value is None:
        return ""
    if not isinstance(value, str):
        value = str(value)
    s = value.strip()
    s = _SCRIPT_PATTERN.sub("", s)
    s = _TAG_PATTERN.sub("", s)
    s = s.replace("\x00", "")
    if len(s) > max_length:
        s = s[:max_length]
    return s
