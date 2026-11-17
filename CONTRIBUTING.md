# Contribuir a AhorraRamos

## Antes de cambiar algo

1. Lee [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md).
2. Localiza la regla aplicable en [`docs/CONTEXT.md`](docs/CONTEXT.md).
3. Comprueba en [`docs/ROADMAP.md`](docs/ROADMAP.md) si el comportamiento existe, es parcial o está pendiente.
4. Revisa [`docs/DECISIONS.md`](docs/DECISIONS.md) para no reabrir decisiones sin contexto nuevo.

## Mantener el contexto

- Separa con claridad **actual**, **decidido**, **propuesto** y **pendiente**.
- No dupliques especificaciones extensas: enlaza su fuente de verdad.
- No marques una capacidad como implementada sin comprobar código y pruebas.
- Cuando una decisión cambie, conserva el motivo y señala qué decisión reemplaza.
- No documentes sueldo, saldos, movimientos, contraseñas ni otros datos personales reales.

## Cambios de código

- Vincula cada cambio a un requisito confirmado y a criterios observables.
- Conserva los invariantes financieros de `AGENTS.md`.
- Incluye pruebas para reglas financieras, fechas, idempotencia y persistencia.
- No mezcles una migración de arquitectura con una función de producto.

## Validación

La comprobación mínima actual es:

```powershell
npm test
```

Para cambios visuales, revisa además el flujo afectado en móvil y escritorio cuando el entorno lo permita. No afirmes una validación que no se haya ejecutado.

## Git

- Usa commits pequeños con Conventional Commits, por ejemplo `docs: aclara el estado actual`.
- Revisa explícitamente los archivos preparados antes de confirmar.
- Nunca subas `.env`, `data/`, credenciales, tokens ni copias de la base de datos.
- Evita reescribir historial compartido o forzar un push.
