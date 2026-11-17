---
name: github-good-practices
description: Ordena, valida y publica cambios de un repositorio GitHub con commits trazables, protección de secretos y verificación del remoto. Úsala cuando haya que subir cambios, preparar commits o mantener sincronizado este proyecto con GitHub.
---

# Buenas prácticas para GitHub

## Flujo obligatorio

1. Revisar `git status`, el diff y el historial reciente antes de tocar nada.
2. Separar cambios del usuario de archivos generados, secretos y cambios no relacionados. No borrar ni revertir trabajo ajeno.
3. Confirmar que `.env`, bases de datos locales, `data/`, credenciales y artefactos temporales están ignorados.
4. Ejecutar las pruebas y validaciones disponibles antes de crear el commit. Registrar cualquier fallo real, sin ocultarlo.
5. Crear un commit pequeño y descriptivo usando Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).
6. Subir únicamente la rama solicitada; usar `git push -u origin <rama>` cuando todavía no tenga upstream.
7. Verificar `git status --short --branch`, el hash publicado y que `origin/<rama>` coincide con `HEAD`.

## Seguridad y revisión

- Nunca incluir secretos, `.env`, `data/`, contraseñas, tokens ni datos financieros reales.
- No usar `git add .` sin revisar antes qué archivos serán incluidos; preferir una lista explícita cuando haya cambios mezclados.
- No ejecutar `reset --hard`, `checkout --` ni reescrituras de historial para resolver diferencias sin autorización explícita.
- Si hay cambios locales posteriores a un commit ya publicado, inspeccionarlos y conservarlos; solo publicarlos si forman parte clara de la solicitud actual.
- Informar siempre del commit, rama, remoto, pruebas ejecutadas y cualquier pendiente.

## Formato de entrega

```text
Publicado: <commit> en <rama>
Remoto: <url>
Validación: <comandos y resultado>
Pendientes: <fallos o cambios no publicados>
```
