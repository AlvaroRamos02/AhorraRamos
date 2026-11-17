# Plan de implementación

Última revisión: 17 de noviembre de 2026.

Estado: primera versión local implementada; faltan tareas de fiabilidad de la fase 1 y las fases posteriores.

## Cómo interpretar el avance

- El resumen de avance describe capacidades comprobadas.
- Una casilla agrupa varias condiciones y solo se marca cuando todas están terminadas.
- Una casilla vacía no significa necesariamente que no haya trabajo iniciado; consulta el resumen y el pendiente inmediato.
- Las propuestas de arquitectura de `docs/CONTEXT.md` no forman parte del avance actual.
- La prioridad vigente está resumida en `docs/PROJECT_CONTEXT.md`.

## Avance de la primera versión (15 de noviembre de 2026)

La primera versión local ya permite acceso con contraseña, cuentas con saldo inicial y fecha de corte, categorías iniciales y nuevas, ingresos, gastos y transferencias persistentes, edición/eliminación de movimientos, resumen mensual, distribución por categoría y confirmación idempotente de nómina. El resumen separa ahorro generado de transferencias a ahorro. Se verificó con pruebas de reglas y un recorrido HTTP que reinicia el servidor para comprobar persistencia.

Iteración de interfaz y acceso: contraseña configurada desde la terminal para el usuario único, sin registro web. Calendario mensual visual con fechas de cobro previstas y confirmadas. `npm test` pasó 4/4, incluida rotación de contraseña con revocación de sesiones, nómina idempotente y persistencia. La revisión visual en navegador quedó pendiente porque el navegador del entorno no pudo conectar con `127.0.0.1`.

Iteración visual (16 de noviembre de 2026): se sustituyó la estética trader por un sistema oscuro, limpio y profesional. Se retiró por completo la sección Mercados y sus proveedores. El calendario destaca el día de cobro y aplica la nueva regla explícita del penúltimo día natural, desplazado al lunes si cae en fin de semana. El alta permite cualquier fecha pasada; lo anterior al saldo inicial queda como histórico sin alterar el saldo actual.

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

Calendario aceptable: noviembre de 2026 marca cobro el 30; febrero de 2026 el 27; febrero de 2027 el 1 de marzo. La previsión no incrementa saldo. Confirmarla dos veces produce un único ingreso.

## Fase 2 — Planificación y control

- [ ] Presupuestos por categoría, compromisos y disponible hasta nómina.
- [ ] Recibos/suscripciones recurrentes con excepciones y prevención de duplicados.
- [ ] Objetivos de ahorro y reservas virtuales coherentes.
- [ ] Vista por mes natural y ciclo de nómina.
- [ ] Comparaciones mensuales/anuales y periodos equivalentes.
- [ ] División de gastos y seguimiento básico de reembolsos pendientes.

Entrega aceptable: confirmar un recibo previsto no lo descuenta dos veces del disponible; un ahorro transferido no aparece como consumo; una reserva no puede superar los fondos disponibles; los totales de tablas y gráficos coinciden.

## Fase 3 — Datos portables

- [ ] CSV con previsualización, mapeo, errores por fila, candidatos duplicados y reversión del lote.
- [ ] Exportación CSV segura y copia completa restaurable.

Entrega aceptable: reimportar un mismo lote no duplica registros; dos compras legítimas iguales pueden conservarse; restaurar una copia reproduce los saldos.

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
