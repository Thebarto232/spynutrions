"""Detecta secretos en el repositorio sin imprimir su valor."""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GIT = Path(r"C:\Program Files\Git\cmd\git.exe")

SKIP_NAMES = {
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
}
SKIP_SUFFIXES = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".woff", ".woff2", ".pyc"}
PLACEHOLDERS = {
    "1",
    "changeme",
    "change-me",
    "your-key",
    "your_key",
    "your-api-key",
    "todo",
    "placeholder",
    "example",
    "xxx",
    "xxxx",
    "secret",
    "password",
    "none",
    "null",
    "test",
    "dummy",
    "sample",
    "<secret>",
    "replace-me",
}

ASSIGNMENT = re.compile(
    r"(?i)\b(api[_-]?key|secret|password|passwd|token|private[_-]?key)\b\s*[=:]\s*['\"]?([^\s#'\"]+)"
)
URL_PASSWORD = re.compile(r"[a-z][a-z0-9+.-]*://[^/\s:@]+:([^@\s/]+)@")
BLOCK_PATTERNS = (
    ("clave_privada", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")),
    ("aws_access_key", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("github_token", re.compile(r"\bgh[pousr]_[A-Za-z0-9]{20,}\b")),
    ("github_pat", re.compile(r"\bgithub_pat_[A-Za-z0-9_]{20,}\b")),
    ("slack_token", re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}")),
    ("google_api_key", re.compile(r"\bAIza[0-9A-Za-z\-_]{35}\b")),
    ("stripe_live_key", re.compile(r"\b[sr]k_live_[A-Za-z0-9]{10,}\b")),
)


def git_bin() -> str | None:
    if GIT.exists():
        return str(GIT)
    from shutil import which

    return which("git")


def tracked_files() -> list[str]:
    git = git_bin()
    if git is None:
        return []
    out = subprocess.check_output([git, "ls-files"], cwd=ROOT, text=True, errors="replace")
    return [line.strip() for line in out.splitlines() if line.strip()]


def staged_lines() -> list[tuple[str, int, str]]:
    git = git_bin()
    if git is None:
        sys.exit("No hay git en esta máquina; no se puede revisar lo preparado para el commit.")
    diff = subprocess.check_output(
        [git, "diff", "--cached", "-U0", "--no-color"],
        cwd=ROOT,
        text=True,
        errors="replace",
    )
    current = ""
    line_no = 0
    rows: list[tuple[str, int, str]] = []
    for raw in diff.splitlines():
        if raw.startswith("+++ b/"):
            current = raw[6:]
            continue
        if raw.startswith("@@"):
            match = re.search(r"\+(\d+)", raw)
            line_no = int(match.group(1)) if match else 0
            continue
        if raw.startswith("+") and not raw.startswith("+++") and current:
            rows.append((current, line_no, raw[1:]))
            line_no += 1
    return rows


def placeholder(value: str) -> bool:
    cleaned = value.strip().strip("'\"")
    if cleaned.lower() in PLACEHOLDERS:
        return True
    return cleaned.startswith("${") or cleaned.startswith("{{") or cleaned.endswith(">")


def findings_in(path: str, line_no: int, text: str) -> list[str]:
    found: list[str] = []
    for name, pattern in BLOCK_PATTERNS:
        if pattern.search(text):
            found.append(f"SECRETO {path}:{line_no} {name}")
    for match in ASSIGNMENT.finditer(text):
        if not placeholder(match.group(2)):
            found.append(f"SECRETO {path}:{line_no} {match.group(1).lower()}")
    for match in URL_PASSWORD.finditer(text):
        if not placeholder(match.group(1)):
            found.append(f"SECRETO {path}:{line_no} password_en_url")
    return found


def scan_tracked() -> list[str]:
    found: list[str] = []
    for rel in tracked_files():
        path = ROOT / rel
        if path.name in SKIP_NAMES or path.suffix.lower() in SKIP_SUFFIXES or not path.is_file():
            continue
        try:
            lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
        except OSError:
            continue
        for number, line in enumerate(lines, start=1):
            found.extend(findings_in(rel.replace("\\", "/"), number, line))
    return found


def scan_staged() -> list[str]:
    found: list[str] = []
    for path, number, line in staged_lines():
        name = Path(path).name
        if name in SKIP_NAMES or Path(path).suffix.lower() in SKIP_SUFFIXES:
            continue
        found.extend(findings_in(path, number, line))
    return found


def main() -> int:
    staged = "--staged" in sys.argv
    found = scan_staged() if staged else scan_tracked()
    if not found:
        print("OK sin secretos")
        return 0
    print("\n".join(found))
    print(f"{len(found)} secreto(s). No hagas commit ni push. Rota la clave si ya se subió.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
