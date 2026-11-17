# Registro de decisiones

Este documento conserva las decisiones que afectan al rumbo del proyecto. No es un diario: solo deben registrarse elecciones relevantes que condicionen producto, arquitectura, seguridad, operación o alcance.

## Estados

- **Propuesta:** pendiente de validación.
- **Aceptada:** vigente y aplicable.
- **Reemplazada:** sustituida por otra decisión.
- **Descartada:** evaluada y no adoptada.

## Índice

| ID | Fecha | Decisión | Estado |
| --- | --- | --- | --- |
| DEC-001 | 2026-11-17 | Definir el contexto antes de implementar funcionalidad | Aceptada |

## DEC-001 — Definir el contexto antes de implementar funcionalidad

- **Fecha:** 2026-11-17
- **Estado:** Aceptada
- **Contexto:** El repositorio nace sin una definición confirmada del producto, sus usuarios, su alcance o su tecnología.
- **Decisión:** Mantener el repositorio sin código funcional hasta aclarar el contexto mínimo descrito en `docs/PROJECT_CONTEXT.md`.
- **Consecuencias:** Se evita convertir inferencias en requisitos y elegir una arquitectura prematuramente. La implementación comenzará más tarde, una vez exista un primer alcance validado.

---

## Plantilla

Copiar este bloque para registrar una nueva decisión:

```markdown
## DEC-NNN — Título breve

- **Fecha:** AAAA-MM-DD
- **Estado:** Propuesta | Aceptada | Reemplazada | Descartada
- **Contexto:** Situación, fuerzas y restricciones relevantes.
- **Decisión:** Elección concreta tomada.
- **Alternativas:** Opciones principales consideradas.
- **Consecuencias:** Beneficios, costes, riesgos y trabajo posterior.
- **Reemplaza a:** DEC-NNN, si corresponde.
```
