# Plan de implementación

Estado: primera versión local implementada; faltan tareas de la fase 1 y fases posteriores.

## Avance de la primera versión (15 de noviembre de 2026)

La primera versión local ya permite acceso con contraseña, cuentas con saldo inicial y fecha de corte, categorías iniciales y nuevas, ingresos, gastos y transferencias persistentes, edición/eliminación de movimientos, resumen mensual, distribución por categoría y confirmación idempotente de nómina. El resumen separa ahorro generado de transferencias a ahorro. Se verificó con pruebas de reglas y un recorrido HTTP que reinicia el servidor para comprobar persistencia.

Iteración de interfaz y acceso: contraseña configurada desde la terminal para el usuario único, sin registro web. Calendario mensual visual con fechas de cobro previstas y confirmadas. `npm test` pasó 4/4, incluida rotación de contraseña con revocación de sesiones, nómina idempotente y persistencia. La revisión visual en navegador quedó pendiente porque el navegador del entorno no pudo conectar con `127.0.0.1`.

Iteración visual trader y mercados (15 de noviembre de 2026): se renovó toda la interfaz con un sistema oscuro de alta densidad y se añadió la sección Mercados con gráficos SVG adaptables para S&P 500 y Bitcoin, periodos 1M/6M/1A/Máx., resumen textual accesible y metadatos de fuente, instrumento, unidad, fecha del dato y consulta. Las consultas se hacen en servidor, con caché, tiempo de espera y fallo independiente por fuente; no alteran saldos ni patrimonio. CoinGecko aporta BTC/EUR y Yahoo Finance se usa provisionalmente para el índice S&P 500 (`^GSPC`). Queda pendiente verificar disponibilidad y condiciones de ambos proveedores en el entorno real antes de marcar las tareas de fase 3 como completadas.

Decisión técnica provisional: Node.js 24 + SQLite integrado + interfaz web sin paquetes externos. El registro de npm no estaba accesible desde el entorno de implementación. La propuesta Next.js/PostgreSQL/Prisma sigue pendiente de evaluación antes de despliegue o uso en varios dispositivos. SQLite integrado es experimental en Node 24.

Pendiente inmediato para completar la fase 1: permitir editar/archivar cuentas y categorías con historial, reembolsos vinculados, evolución mensual en gráfico, respaldo/restauración verificados y revisión visual en móvil/escritorio. La aplicación actual es local y no se debe publicar como servicio web.

## Fase 1 — Finanzas que se pueden usar

- [ ] Inicializar stack, base de datos, migraciones, entorno reproducible y acceso privado.
- [ ] Configuración de cuentas, saldos iniciales y categorías personales.
- [ ] Alta, edición, búsqueda y eliminación de ingresos/gastos con persistencia.
- [ ] Transferencias internas, ahorro y reembolsos sin duplicar cifras.
- [ ] Resumen con saldos, ingresos, gastos y ahorro calculados desde los mismos datos.
- [ ] Calendario con nómina prevista y confirmación idempotente del cobro.
- [ ] Gráfico inicial por categorías y evolución mensual.

Entrega aceptable: introducir saldos ficticios, registrar ingreso de 1.000 €, gasto de 100 € y transferencia interna de 200 € deja patrimonio líquido total en 900 €, gastos en 100 € y ahorro generado en 900 €, suponiendo saldo inicial cero y sin otras operaciones. El ahorro transferido es 200 €. Recargar conserva los datos.

Calendario aceptable: noviembre de 2026 marca cobro el 30; febrero de 2028 el 28. La previsión no incrementa saldo. Confirmarla dos veces produce un único ingreso.

## Fase 2 — Planificación y control

- [ ] Presupuestos por categoría, compromisos y disponible hasta nómina.
- [ ] Recibos/suscripciones recurrentes con excepciones y prevención de duplicados.
- [ ] Objetivos de ahorro y reservas virtuales coherentes.
- [ ] Vista por mes natural y ciclo de nómina.
- [ ] Comparaciones mensuales/anuales y periodos equivalentes.
- [ ] División de gastos y seguimiento básico de reembolsos pendientes.

Entrega aceptable: confirmar un recibo previsto no lo descuenta dos veces del disponible; un ahorro transferido no aparece como consumo; una reserva no puede superar los fondos disponibles; los totales de tablas y gráficos coinciden.

## Fase 3 — Datos portables y mercados

- [ ] CSV con previsualización, mapeo, errores por fila, candidatos duplicados y reversión del lote.
- [ ] Exportación CSV segura y copia completa restaurable.
- [ ] Bitcoin con API real, caché, fecha del precio y estado de error/desactualización.
- [ ] S&P 500 con cobertura del instrumento y condiciones del proveedor verificadas.
- [ ] Histórico y filtros de mercado según cobertura disponible.

Entrega aceptable: reimportar un mismo lote no duplica registros; dos compras legítimas iguales pueden conservarse; sin API el resto de la app funciona y no aparece una cotización inventada. Restaurar una copia reproduce los saldos.

## Fase 4 — Evolución opcional

- [ ] Cartera personal y valoración de posiciones con comisiones y moneda.
- [ ] PWA instalable y mejoras de captura desde móvil.
- [ ] Sincronización bancaria tras seleccionar proveedor y conocer coste/cobertura.
- [ ] Lectura de recibos y categorización asistida con confirmación.
- [ ] Informes visuales exportables y notificaciones configurables.

## Validación transversal al implementar

- Pruebas de nómina para meses de 28/29/30/31 días y fines de semana; fechas sin errores por zona horaria.
- Pruebas de transferencias atómicas, métricas, reembolsos, reservas y recurrencias de día 31.
- Recorridos reales: configurar cuenta, registrar gasto, confirmar nómina, importar y consultar informe.
- Acceso privado, validación en servidor y ausencia de secretos en cliente/repositorio.
- Tipos, lint, build y pruebas pertinentes; revisión de móvil/escritorio y datos persistentes.

Marcar una casilla solo después de implementar y verificar su resultado. Registrar aquí bloqueos reales y decisiones de alcance.
