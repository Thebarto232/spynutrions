---
name: secret-guard
description: >-
  Prevents API keys, passwords, tokens, private keys, and .env files from
  being committed or pushed. Use before git commit, git push, staging files,
  editing .env, credentials, connection strings, Dockerfiles, or CI workflows,
  and when the user mentions claves, secretos, llaves, tokens, contraseñas,
  .gitignore, or leaked secrets.
---

# Guardar secretos

Antes de preparar, commitear o subir archivos, corre el escáner y bloquea el commit si falla.

## Revisar

Desde la raíz del repo:

```bash
python scripts/scan_secrets.py --staged
```

Si todavía no hay cambios preparados, revisa lo que ya está en git:

```bash
python scripts/scan_secrets.py
```

Salida `OK sin secretos` y código 0: se puede seguir. Cualquier línea `SECRETO`: detente. No hagas commit ni push.

Si el proyecto no tiene `scripts/scan_secrets.py`, revisa a mano el diff y aplica las mismas reglas de abajo.

## Qué no puede entrar a git

- `.env`, `.env.local`, `.env.production` y cualquier archivo de entorno con valores reales
- `credentials.json`, cuentas de servicio, `*.pem`, `*.key`, `id_rsa`, `id_ed25519`
- URLs con contraseña (`usuario:clave@host`)
- Tokens de GitHub, AWS, Slack, Stripe live, Google o bloques `PRIVATE KEY`
- Asignaciones `API_KEY`, `SECRET`, `PASSWORD` o `TOKEN` cuyo valor no sea un placeholder

Placeholders permitidos: `1`, `changeme`, `your-key`, `placeholder`, `example`, `xxx`, `${VAR}`.

`.env.example` sí se puede commitear, solo con placeholders.

## Cómo informar

Di el archivo, la línea y el tipo (`password_en_url`, `github_token`, `api_key`). No pegues el valor. No lo copies a issues, logs ni al chat.

Si el secreto ya está en un commit o en GitHub, borrarlo del archivo no basta: hay que rotar la clave y sacar el archivo del historial. Dilo así, en una frase, y no reescribas el historial salvo que el usuario lo pida.

## Ignorar

El `.gitignore` de la raíz debe cubrir `.env`, `.env.*` (con excepción de `.env.example`), llaves privadas y `credentials.json`. Si falta un patrón y el archivo aún no está trackeado, añádelo antes de commitear.
