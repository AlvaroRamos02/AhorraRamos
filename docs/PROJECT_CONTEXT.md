# Contexto de AhorraRamos

Aplicación web personal, privada y local para gestionar una única cuenta financiera en español, EUR y `Europe/Madrid`.

## Estado actual

Funciona con Node.js 24, módulos ES, `node:sqlite` y HTML/CSS/JavaScript sin dependencias externas. Escucha en `127.0.0.1` y ofrece acceso por contraseña, una cuenta, categorías, movimientos, resumen mensual, gráfico por categorías y calendario de nómina.

Sigue siendo una versión local temprana. No tiene todavía copias/restauración verificadas desde la interfaz, CSV, recurrencias, presupuestos, objetivos ni informes avanzados. No debe exponerse públicamente ni ser la única copia de datos reales.

## Reglas esenciales

- Los importes EUR se almacenan en céntimos enteros.
- Solo los movimientos confirmados afectan al saldo.
- La previsión de nómina usa el penúltimo día natural y pasa al lunes si cae en fin de semana, aunque cambie de mes.
- Confirmar una nómina varias veces crea un único ingreso.
- Las previsiones no son dinero disponible.
- Los movimientos anteriores al saldo inicial se conservan como historial sin alterar ese saldo.

## Seguridad

La sesión es obligatoria. La validación, autenticación y autorización se realizan en el servidor. No se guardan secretos ni datos financieros reales en el repositorio o logs. La base de datos queda fuera de Git.

## Prioridades

1. Copia y restauración verificadas.
2. Edición y archivado seguros de cuentas y categorías con historial.
3. Reembolsos vinculados sin doble contabilización.
4. Evolución mensual y revisión visual en móvil y escritorio.

Consulta `CONTEXT.md` solo para reglas funcionales adicionales, `ROADMAP.md` para pendientes y `DECISIONS.md` antes de cambiar una decisión técnica vigente.
