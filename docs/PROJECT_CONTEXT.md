# Contexto operativo de AhorraRamos

Última revisión: 17 de noviembre de 2026.

## En una frase

AhorraRamos es una aplicación web personal, privada y local para entender saldos, gastos, ahorro y próximas nóminas sin depender de servicios externos.

## Qué problema resuelve

El producto busca responder con datos verificables:

- cuánto dinero hay disponible;
- cuánto se ha ingresado y gastado en un periodo;
- en qué categorías se concentra el gasto;
- cuánto ahorro se ha generado y cuánto se ha transferido a ahorro;
- cuándo está prevista la próxima nómina.

## Usuario y entorno

- Un único usuario.
- Español de España.
- Moneda EUR.
- Zona horaria `Europe/Madrid`.
- Uso local en ordenador, con interfaz adaptable a móvil.
- Sin registro público, sincronización bancaria ni servicios de mercado.

## Estado real

Existe una primera versión ejecutable con acceso por contraseña, persistencia SQLite, cuentas, categorías, movimientos, transferencias, resumen mensual, gráfico por categorías y calendario de nómina.

El producto sigue siendo una versión local temprana. No dispone todavía de copias/restauración verificadas desde la interfaz, CSV, recurrencias, presupuestos, objetivos ni informes avanzados. No debe exponerse públicamente ni utilizarse con datos reales como única copia.

Consulta [`ROADMAP.md`](ROADMAP.md) para el detalle de capacidades y pendientes.

## Arquitectura vigente

- Runtime: Node.js 24.11 o superior.
- Servidor: HTTP local en `127.0.0.1`.
- Persistencia: `node:sqlite`, archivo local fuera de Git.
- Cliente: HTML, CSS y JavaScript sin framework.
- Dependencias externas: ninguna.
- Pruebas: runner nativo de Node, reglas de dominio e integración HTTP.

La arquitectura Next.js/PostgreSQL descrita en la especificación es una alternativa futura. No representa el código actual ni debe adoptarse sin reevaluar despliegue, múltiples dispositivos, mantenimiento y migración de datos.

## Reglas que definen el producto

1. EUR se almacena en céntimos enteros.
2. Solo los movimientos confirmados afectan al saldo.
3. Las transferencias internas no generan ingreso ni gasto.
4. El ahorro generado y la transferencia a ahorro son métricas distintas.
5. La fecha prevista de nómina es el penúltimo día natural; si cae en sábado o domingo, pasa al lunes siguiente.
6. Confirmar una nómina varias veces produce un único ingreso.
7. Un movimiento anterior a la fecha de corte se conserva como historial sin modificar el saldo de apertura.
8. Las previsiones nunca se presentan como dinero ya disponible.

La definición exhaustiva está en [`CONTEXT.md`](CONTEXT.md).

## Prioridad actual

Cerrar la fiabilidad de la primera fase antes de ampliar el producto:

1. copia y restauración verificadas;
2. edición y archivado seguros de cuentas y categorías con historial;
3. reembolsos vinculados sin doble contabilización;
4. evolución mensual y revisión visual en móvil/escritorio.

## Decisiones todavía abiertas

- Dónde se ejecutará habitualmente la aplicación.
- Qué política de copia y recuperación necesita el usuario.
- Cuándo deja de ser suficiente SQLite local.
- Si se necesita acceso desde varios dispositivos.
- Si una importación CSV precederá a cualquier integración bancaria.

## Jerarquía documental

- Este archivo: resumen actual para incorporarse rápidamente al proyecto.
- `CONTEXT.md`: especificación completa, incluidos comportamientos futuros.
- `ROADMAP.md`: evidencia de avance y próximos pasos.
- `DECISIONS.md`: decisiones vigentes y consecuencias.
- `AGENTS.md`: instrucciones operativas para realizar cambios.

No copies bloques extensos entre documentos. Actualiza la fuente correspondiente y enlázala.
