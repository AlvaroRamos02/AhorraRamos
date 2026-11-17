# Instrucciones de AhorraRamos

- Lee `docs/PROJECT_CONTEXT.md` antes de cambiar código. Consulta los demás documentos solo si la tarea lo exige.
- Si documentación, código y comportamiento difieren, comprueba el código y corrige la documentación afectada sin inventar datos.

## Reglas obligatorias

- Producto privado y local, para un usuario, en español, EUR y `Europe/Madrid`.
- Guarda EUR como céntimos enteros; nunca uses coma flotante binaria para dinero.
- Solo los movimientos confirmados alteran saldos. Las transferencias internas no son ingresos ni gastos ni cambian el patrimonio total.
- La nómina se prevé el penúltimo día natural y pasa al lunes si cae en fin de semana. Su confirmación debe ser idempotente.
- No inventes ni expongas datos financieros. No incluyas secretos o datos reales en código, pruebas, logs o documentación.
- Mantén validación, autenticación y autorización en el servidor. No expongas públicamente el servicio.

## Trabajo

- Conserva Node.js 24, módulos ES, `node:sqlite` y la interfaz sin dependencias externas salvo decisión explícita.
- Mantén reglas financieras y de fechas en `src/domain.js`.
- Haz cambios pequeños. No actualices Markdown si no cambia su contenido real.
- No ejecutes `npm test` por defecto; usa comprobaciones dirigidas y ejecuta la suite completa solo si el usuario lo pide.
- Antes de publicar, revisa el diff, posibles secretos, Git y la coincidencia entre `HEAD` y el remoto.
