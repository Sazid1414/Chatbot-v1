def chunk_text(
    text: str,
    max_chars: int = 900,
    overlap: int = 120,
) -> list[str]:
    text = text.strip()
    if not text:
        return []

    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    if not paragraphs:
        paragraphs = [text]

    chunks: list[str] = []
    buf = ""

    for p in paragraphs:
        if len(buf) + len(p) + 2 <= max_chars:
            buf = f"{buf}\n\n{p}" if buf else p
            continue
        if buf:
            chunks.extend(_split_oversized(buf, max_chars, overlap))
        if len(p) <= max_chars:
            buf = p
        else:
            chunks.extend(_split_oversized(p, max_chars, overlap))
            buf = ""

    if buf:
        chunks.extend(_split_oversized(buf, max_chars, overlap))

    return [c for c in chunks if c.strip()]


def _split_oversized(text: str, max_chars: int, overlap: int) -> list[str]:
    out: list[str] = []
    i = 0
    while i < len(text):
        piece = text[i : i + max_chars]
        out.append(piece.strip())
        if i + max_chars >= len(text):
            break
        i += max(1, max_chars - overlap)
    return [x for x in out if x]
