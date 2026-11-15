# AhorraRamos

Primera versión local de una aplicación privada para registrar cuentas, ingresos, gastos, transferencias y nóminas. Interfaz en español; importes EUR en céntimos enteros; fechas de nómina según la regla descrita en [docs/CONTEXT.md](docs/CONTEXT.md).

## Arranque

Requiere Node.js 24.11 o superior. No hay paquetes que instalar.

```powershell
npm run set-password
npm start
```

El primer comando pide la contraseña dos veces en la terminal y guarda únicamente su hash. Abre `http://127.0.0.1:3000` e inicia sesión. No hay registro de usuarios en la web. Para cambiar la contraseña, ejecuta de nuevo `npm run set-password` con el servidor detenido. El servidor escucha solo en localhost. La base de datos se guarda en `data/ahorra-ramos.sqlite` y esa carpeta está excluida de Git. Conserva una copia privada de ese archivo cuando la aplicación esté cerrada.

Para desarrollo: `npm run dev`. Para pruebas: `npm test`. `PORT` y `DATA_DIR` son opcionales; consulta `.env.example`. Node no carga `.env` automáticamente, así que define esas variables en la terminal si las necesitas.

## Uso inicial

1. En **Ajustes**, añade una cuenta con saldo inicial y fecha de corte. Puedes crear una cuenta de ahorro aparte.
2. Usa **Añadir movimiento** para ingresos, gastos o transferencias. Los gastos se clasifican en las categorías iniciales o en otras que añadas.
3. En **Resumen**, selecciona el mes para ver ingresos, gastos, ahorro generado y distribución. El saldo de cada cuenta considera todos los movimientos confirmados.
4. En **Calendario**, consulta la fecha prevista y confirma la nómina cuando llegue. La confirmación repetida no crea otro ingreso.
5. En **Mercados**, consulta gráficos informativos del índice S&P 500 y Bitcoin en EUR. La aplicación identifica fuente, instrumento y fecha, y no suma esas cotizaciones a tu patrimonio.

La pantalla de mercados consulta CoinGecko y Yahoo Finance desde el servidor, con caché y tiempo de espera. Puede funcionar sin credenciales dentro de los límites públicos de cada fuente; `COINGECKO_API_KEY` permite configurar opcionalmente una clave Demo de CoinGecko. Si una fuente no responde, la interfaz lo indica sin inventar datos y el resto de la aplicación sigue funcionando.

## Estructura y pasos de trabajo

- [AGENTS.md](AGENTS.md): instrucciones de trabajo que deben seguir los agentes en este repositorio.
- [docs/CONTEXT.md](docs/CONTEXT.md): especificación funcional y reglas del producto.
- [docs/ROADMAP.md](docs/ROADMAP.md): orden de implementación y criterios de aceptación. Se actualiza tras comprobar trabajo real.
- `src/domain.js`: cálculos comprobables, sin dependencia de la interfaz ni de la base de datos.
- `src/db.js`: esquema SQLite, acceso y transacciones atómicas.
- `src/server.js`: acceso privado, validación y API HTTP local.
- `src/public/`: interfaz adaptable.
- `test/`: pruebas de reglas y flujo HTTP completo.

La base propuesta en el contexto era Next.js, PostgreSQL y Prisma. El registro de paquetes no estuvo disponible al iniciar este repositorio, así que esta versión usa Node.js 24 y SQLite integrado para entregar una aplicación ejecutable. Esta elección debe revisarse cuando se aborde despliegue, acceso desde varios dispositivos o sincronización. SQLite integrado figura como experimental en Node 24.

## Alcance actual

Hay persistencia local, contraseña y sesiones para un usuario único, cuentas con saldos iniciales, categorías iniciales y nuevas, alta/edición/eliminación de movimientos, transferencias, resumen mensual, gráfico por categorías, calendario mensual visual con previsión/confirmación idempotente de nómina y una vista informativa de mercados. La base conserva un registro mínimo de cambios de movimientos.

Faltan reembolsos vinculados, CSV, recurrencias, presupuestos, objetivos, posiciones de inversión, informes avanzados y copias/restauración dentro de la interfaz. Las fuentes de mercado aún dependen de sus límites públicos y condiciones de disponibilidad. No introduzcas datos financieros reales como única copia hasta implementar y verificar un flujo de copia y restauración. El acceso es local y no está preparado para exposición pública.
