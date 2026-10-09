from app.services.pasos import separar_pasos


def test_parrafos_se_parten_por_linea():
    assert separar_pasos("Hervir.\n\nServir.") == ["Hervir.", "Servir."]


def test_quita_numeracion():
    assert separar_pasos("1. Hervir\n2. Servir") == ["Hervir", "Servir"]


def test_vacio():
    assert separar_pasos(None) == []
    assert separar_pasos("   ") == []
