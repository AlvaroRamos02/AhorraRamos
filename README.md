# AhorraRamos

Aplicación web privada y local para registrar cuentas, ingresos, gastos, transferencias y nóminas. Está pensada para un único usuario, en español de España, con importes EUR almacenados en céntimos enteros y zona horaria `Europe/Madrid`.

> Estado: primera versión local operativa. No está preparada para exponerse a Internet ni para guardar datos financieros reales como única copia.

## Empezar

Requiere Node.js 24.11 o superior. No hay paquetes externos que instalar.

```powershell
npm run set-password
npm start
```

Abre `http://127.0.0.1:3000` e inicia sesión. El primer comando solicita la contraseña dos veces y guarda únicamente su hash. No existe registro de usuarios en la web.

La base de datos se guarda en `data/ahorra-ramos.sqlite`, fuera de Git. Para cambiar la contraseña, detén el servidor y ejecuta de nuevo `npm run set-password`.

Otros comandos:

```powershell
npm run dev   # servidor con recarga al cambiar archivos
npm test      # pruebas de dominio e integración HTTP
```

`PORT` y `DATA_DIR` son opcionales; consulta [`.env.example`](.env.example). Node no carga `.env` automáticamente.

## Uso inicial

1. En **Ajustes**, crea una cuenta con saldo inicial y fecha de corte.
2. Usa **Añadir movimiento** para registrar ingresos, gastos o transferencias.
3. Consulta en **Resumen** los saldos y las métricas del mes seleccionado.
4. Consulta y confirma la nómina desde **Calendario**. Repetir la confirmación no crea otro ingreso.

Los movimientos anteriores a la fecha del saldo inicial se conservan como historial, pero no alteran el saldo actual.

## Mapa de contexto

Lee los documentos en este orden para evitar mezclar hechos actuales con planes futuros:

1. [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md): resumen breve del producto y del estado real.
2. [`docs/CONTEXT.md`](docs/CONTEXT.md): especificación funcional completa e invariantes de negocio.
3. [`docs/ROADMAP.md`](docs/ROADMAP.md): alcance verificado, pendientes y orden de evolución.
4. [`docs/DECISIONS.md`](docs/DECISIONS.md): decisiones vigentes y por qué se tomaron.
5. [`AGENTS.md`](AGENTS.md): reglas para trabajar en el repositorio.

Regla de lectura: el código y las pruebas describen lo que existe; el roadmap describe lo comprobado; la especificación también contiene comportamiento futuro.

## Estado funcional actual

La primera versión incluye:

- acceso local con contraseña y sesiones para un usuario;
- cuentas con saldo inicial y fecha de corte;
- categorías iniciales y personalizadas;
- ingresos, gastos y transferencias persistentes;
- edición y eliminación de movimientos con auditoría mínima;
- resumen mensual, saldos y distribución por categorías;
- calendario mensual y confirmación idempotente de nómina.

Todavía faltan, entre otros, reembolsos vinculados, recurrencias, presupuestos, objetivos, CSV, informes avanzados y un flujo verificado de copia y restauración.

## Arquitectura actual

- `src/domain.js`: reglas financieras y de calendario puras.
- `src/db.js`: esquema y acceso a SQLite mediante `node:sqlite`.
- `src/server.js`: sesiones, validación y API HTTP local.
- `src/public/`: interfaz web adaptable sin framework.
- `test/`: pruebas unitarias y recorrido HTTP con persistencia.

La implementación actual usa Node.js 24 y SQLite integrado sin dependencias externas. La posible migración a otro stack es una decisión futura, no el estado actual. SQLite integrado figura como experimental en Node 24.

## Límites de seguridad

- El servidor escucha solo en `127.0.0.1`.
- No publiques el servicio directamente en Internet.
- No subas `.env`, `data/`, contraseñas, tokens ni datos financieros reales.
- Mantén una copia privada del archivo SQLite con la aplicación detenida.
- No uses datos reales como única copia hasta verificar restauración y exportación.
