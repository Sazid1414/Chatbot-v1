"""Token estimates for context budgeting (chars ≈ tokens; no native deps)."""


def count_tokens(text: str) -> int:
    if not text:
        return 0
    return max(1, int(len(text) / 3.8))


def count_message_tokens(role: str, content: str) -> int:
    return 4 + count_tokens(role) + count_tokens(content)
