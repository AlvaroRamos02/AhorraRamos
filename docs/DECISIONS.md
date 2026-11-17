# Decisiones vigentes

## Aplicación local

Se usa Node.js 24, módulos ES, `node:sqlite` e interfaz sin dependencias externas. Debe reevaluarse antes de despliegue público, sincronización o uso multidispositivo.

## Dinero

Los importes EUR se guardan y calculan como céntimos enteros para evitar errores de coma flotante.

## Nómina

Se usa el penúltimo día natural del mes, trasladado al lunes siguiente si cae en fin de semana. Se conserva el mes de origen, no se ajustan festivos y la confirmación es idempotente.

## Alcance

Mercados y cotizaciones están fuera del producto. Añadir servicios externos, cambiar el stack o exponer la aplicación requiere una decisión explícita.

Añade aquí solo decisiones duraderas que cambien arquitectura, seguridad o reglas financieras; no registres datos personales ni detalles rutinarios.
