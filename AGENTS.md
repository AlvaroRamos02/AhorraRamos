# Instrucciones para trabajar en AhorraRamos

## Fuente de verdad

- Lee primero `docs/PROJECT_CONTEXT.md` para conocer el estado real.
- Usa `docs/CONTEXT.md` para reglas funcionales e invariantes.
- Usa `docs/ROADMAP.md` para distinguir lo implementado de lo pendiente.
- Registra decisiones duraderas en `docs/DECISIONS.md`.
- Si la documentación contradice al código o las pruebas, comprueba el comportamiento y corrige el contexto; no adivines.

## Invariantes

- Producto privado, local, de un usuario, en español, EUR y `Europe/Madrid`.
- Guarda EUR como céntimos enteros; no uses coma flotante binaria para dinero.
- Una transferencia interna no es ingreso ni gasto y no cambia el patrimonio total.
- Solo los movimientos confirmados alteran saldos; previsiones y cancelaciones no.
- La nómina se prevé el penúltimo día natural y pasa al lunes si cae en fin de semana, aunque cambie de mes.
- Confirmar una nómina debe ser idempotente.
- No inventes sueldo, saldos, cuentas ni movimientos del usuario.
- No incluyas secretos ni datos financieros reales en código, pruebas, logs o documentación.

## Implementación actual

- Node.js 24, módulos ES, `node:sqlite` e interfaz web sin dependencias externas.
- Mantén reglas financieras y fechas en `src/domain.js`, fuera de la interfaz y persistencia.
- Mantén validación, autenticación y autorización en servidor.
- No migres de stack ni expongas el servicio públicamente sin una decisión explícita.
- No presentes propuestas de `docs/CONTEXT.md` como funciones ya existentes.

## Entrega

- Haz cambios pequeños y relacionados con un requisito confirmado.
- Actualiza contexto, roadmap y decisiones solo cuando cambie su verdad.
- Ejecuta `npm test` después de cambios funcionales o de reglas.
- Antes de publicar, revisa diff, secretos, estado de Git y coincidencia entre `HEAD` y el remoto.
- Informa qué cambió, qué se verificó y qué continúa pendiente.
