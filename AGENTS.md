# Instrucciones de AhorraRamos

- Lee `docs/PROJECT_CONTEXT.md` antes de cambiar código. Consulta el README solo si necesitas configuración o uso. Contrasta la documentación afectada con el código.
- Aplicación local y privada para un usuario, en español, EUR y `Europe/Madrid`. Enable Banking AIS es la única fuente del saldo y los movimientos. Solo los contabilizados entran en el resumen. Los abonos y cargos de una cuenta no equivalen a ingresos y gastos del patrimonio.
- Guarda EUR como céntimos enteros. La nómina se prevé el penúltimo día natural y pasa al lunes si cae en fin de semana. Su cobro llega del banco y la sincronización no lo duplica.
- Conserva Node.js 24, módulos ES, `node:sqlite` y la interfaz sin dependencias externas. Mantén dinero y fechas en `src/domain.js`.
- Valida y autoriza en el servidor. Mantén el servicio en loopback y las credenciales y datos financieros fuera de Git y logs.
- Haz cambios pequeños. Ejecuta comprobaciones dirigidas. Ejecuta `npm test` solo si el usuario pide la suite completa.
- Antes de publicar, revisa el diff, posibles secretos, Git y la coincidencia entre `HEAD` y el remoto.
