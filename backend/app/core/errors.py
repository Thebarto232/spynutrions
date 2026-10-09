class ProveedorError(Exception):
    """TheMealDB no respondió de una forma que podamos usar."""


class FavoritoYaExiste(Exception):
    """Esa receta ya está guardada para este proveedor."""


def error_detalle(code: str, message: str) -> dict[str, str]:
    return {"code": code, "message": message}
