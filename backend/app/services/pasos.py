import re

_PREFIJO = re.compile(r"^\s*(?:step\s*)?\d+[\.\)\:\-]\s*", re.IGNORECASE)


def separar_pasos(texto: str | None) -> list[str]:
    if not texto or not texto.strip():
        return []
    pasos: list[str] = []
    for linea in texto.replace("\r\n", "\n").replace("\r", "\n").split("\n"):
        limpio = _PREFIJO.sub("", linea).strip()
        if limpio:
            pasos.append(limpio)
    return pasos
