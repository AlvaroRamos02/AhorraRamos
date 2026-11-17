# Registro de decisiones

Este registro conserva decisiones que condicionan el producto o su arquitectura. Los datos personales configurados por el usuario no son decisiones del proyecto y no deben aparecer aquí.

## Estados

- **Aceptada:** vigente.
- **Propuesta:** pendiente de decisión.
- **Reemplazada:** conservada como historial, pero ya no vigente.
- **Descartada:** evaluada y no adoptada.

## Índice

| ID | Fecha | Decisión | Estado |
| --- | --- | --- | --- |
| DEC-001 | 2026-11-15 | Entregar primero una aplicación local sin dependencias externas | Aceptada |
| DEC-002 | 2026-11-15 | Representar EUR en céntimos enteros | Aceptada |
| DEC-003 | 2026-11-15 | Aplicar una regla determinista para la nómina | Aceptada |
| DEC-004 | 2026-11-16 | Retirar mercados del alcance | Aceptada |
| DEC-005 | 2026-11-17 | Separar estado actual, especificación, roadmap y decisiones | Aceptada |

## DEC-001 — Aplicación local sin dependencias externas

- **Fecha:** 2026-11-15
- **Estado:** Aceptada
- **Contexto:** El registro de paquetes no estaba disponible durante la primera implementación y se necesitaba una versión ejecutable.
- **Decisión:** Usar Node.js 24, `node:sqlite` y una interfaz web sin framework ni paquetes externos.
- **Consecuencias:** La aplicación es sencilla de arrancar y permanece local. SQLite integrado es experimental y esta arquitectura debe reevaluarse antes de despliegue público, sincronización o uso desde varios dispositivos.

## DEC-002 — EUR en céntimos enteros

- **Fecha:** 2026-11-15
- **Estado:** Aceptada
- **Decisión:** Guardar y calcular importes EUR como enteros; formatearlos como euros solo al presentar o recibir datos.
- **Consecuencias:** Se evitan errores de coma flotante. Cantidades de activos o tipos de cambio futuros requerirán decimales exactos y una decisión separada.

## DEC-003 — Regla determinista de nómina

- **Fecha:** 2026-11-15
- **Estado:** Aceptada
- **Decisión:** Usar el penúltimo día natural del mes y moverlo al lunes siguiente cuando caiga en sábado o domingo, aunque el cobro pase al mes posterior.
- **Consecuencias:** No se ajustan festivos. El mes de origen debe conservarse y la confirmación del cobro debe ser idempotente.

## DEC-004 — Mercados fuera de alcance

- **Fecha:** 2026-11-16
- **Estado:** Aceptada
- **Decisión:** Eliminar la sección de mercados y sus proveedores.
- **Consecuencias:** No se consultan ni muestran cotizaciones. Una futura cartera personal requerirá una nueva decisión explícita.

## DEC-005 — Separar las capas de contexto

- **Fecha:** 2026-11-17
- **Estado:** Aceptada
- **Contexto:** La documentación mezclaba capacidades existentes, especificación futura y alternativas técnicas, lo que podía inducir a implementar sobre supuestos incorrectos.
- **Decisión:** Usar `PROJECT_CONTEXT.md` como resumen actual, `CONTEXT.md` como especificación, `ROADMAP.md` como evidencia de avance y este archivo como historial de decisiones.
- **Consecuencias:** Cada cambio debe actualizar solo la fuente de verdad afectada y enlazar las demás, evitando duplicación.

---

## Plantilla

```markdown
## DEC-NNN — Título

- **Fecha:** AAAA-MM-DD
- **Estado:** Propuesta | Aceptada | Reemplazada | Descartada
- **Contexto:** Problema y restricciones relevantes.
- **Decisión:** Elección concreta.
- **Alternativas:** Opciones consideradas.
- **Consecuencias:** Beneficios, costes, riesgos y trabajo posterior.
- **Reemplaza a:** DEC-NNN, si corresponde.
```
