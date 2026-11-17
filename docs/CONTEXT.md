# Reglas funcionales

Este documento contiene reglas de producto que no caben en el resumen. No implica que todas estén implementadas; compruébalo en el código y en `ROADMAP.md`.

## Movimientos y cuentas

- Los movimientos tienen importe positivo y tipo explícito.
- Solo los confirmados afectan a saldos; previsiones, cancelaciones y borradores no.
- Una transferencia mueve dinero entre cuentas de forma atómica y no altera ingresos, gastos ni patrimonio total.
- Un reembolso reduce el gasto neto y debe enlazarse al gasto original.
- No se elimina una cuenta o categoría con historial sin archivar o reasignar.
- El saldo inicial tiene fecha de corte; movimientos anteriores son historial y no lo modifican.

## Nómina y fechas

Para cada mes, toma el penúltimo día natural. Si es sábado, suma dos días; si es domingo, suma uno. Conserva el mes de origen aunque la fecha pase al mes siguiente. No ajustes festivos.

La previsión no aumenta el saldo. Confirmarla crea o enlaza un único ingreso y repetir la acción no lo duplica.

## Métricas

- Gastos netos: gastos confirmados menos reembolsos efectivos del periodo.
- Ahorro generado: ingresos ordinarios confirmados menos gastos netos; excluye transferencias y ajustes.
- Transferencia a ahorro: dinero movido a cuentas de ahorro; no equivale a ahorro generado.
- Disponible: liquidez actual menos compromisos y reservas no descontados, sin contar nada dos veces.

## Funciones futuras

Presupuestos, objetivos, recurrencias, CSV, informes avanzados, PWA, sincronización bancaria e IA no deben tratarse como existentes. Mercados y cotizaciones están fuera de alcance.

## Seguridad y datos

- Aplicación privada con sesión obligatoria y acceso local por defecto.
- Toda lectura y escritura se valida y autoriza en servidor.
- Secretos fuera del repositorio y del navegador; datos financieros fuera de logs innecesarios.
- No enviar movimientos a terceros ni añadir servicios externos sin decisión explícita.
- No usar datos reales como única copia hasta verificar copia y restauración.
