# Contexto y especificación del proyecto

Fecha inicial: 15 de noviembre de 2026.
Estado: especificación del producto; primera versión local implementada el 15 de noviembre de 2026. Véase `docs/ROADMAP.md` para el alcance comprobado.

## 1. Objetivo

Crear una aplicación personal, privada, completa y fácil de usar para saber cuánto dinero tengo, en qué lo gasto, cuánto puedo gastar hasta la próxima nómina y cómo evolucionan mi ahorro y patrimonio. Debe funcionar bien desde móvil y ordenador, con datos persistentes y resultados verificables.

El producto debe responder rápidamente a estas preguntas:
- ¿Cuánto tengo disponible de verdad?
- ¿Cuánto he gastado este mes y desde la última nómina?
- ¿En qué categorías estoy gastando más?
- ¿Qué pagos vienen y cuándo cobro?
- ¿Cuánto estoy ahorrando y cómo voy respecto a mis objetivos?

## 2. Requisitos confirmados y decisiones propuestas

Requisitos del usuario: facilidad de uso, funciones completas, calendario de nóminas con desplazamiento al lunes, registro histórico de gastos, categorías personales, gráficos y comparaciones. La sección de mercados se retiró por decisión explícita del usuario el 16 de noviembre de 2026.

Decisiones iniciales propuestas: un único usuario, español de España, EUR, zona Europe/Madrid, aplicación web adaptable con evolución a PWA, registro manual e importación CSV antes de conectar bancos. Estas decisiones pueden cambiar sin alterar los requisitos confirmados.

No se conoce el sueldo neto, saldos, cuentas, presupuestos ni posiciones actuales. Se pedirán durante la configuración y no se deducirán de conversaciones anteriores. No registrar datos financieros personales en este documento ni en el repositorio.

## 3. Experiencia y navegación

Secciones: Resumen, Movimientos, Calendario, Presupuestos, Ahorro, Informes y Ajustes. Cuentas puede vivir dentro de Ajustes inicialmente.

- Diseño limpio, legible y con pocas acciones por pantalla. Datos prioritarios al abrir: disponible, gasto acumulado, próxima nómina y próximos pagos.
- Acción visible «Añadir movimiento» desde cualquier sección. Registrar un gasto habitual en unos 15 segundos.
- Formulario rápido: importe, categoría, cuenta, fecha y concepto opcional. Por defecto, hoy y última cuenta usada.
- Formato `1.234,56 €`; fechas españolas; semana de lunes a domingo.
- Filtros persistentes durante la sesión y opción de restablecerlos.
- Modo claro/oscuro, uso por teclado, etiquetas accesibles y gráficos que no dependan solo del color.
- Cada gráfico tendrá resumen o tabla accesible y explicación de la métrica.
- Estados de carga, vacío, error, datos desactualizados y confirmación de guardado.

## 4. Movimientos y cuentas

Tipos: ingreso, gasto, transferencia interna, aportación/retirada de inversión y ajustes de saldo identificados. Permitir editar, eliminar con confirmación y consultar el historial mínimo de cambios.

Campos: identificador, tipo, importe, moneda, fecha efectiva, cuenta origen/destino cuando corresponda, categoría, concepto, notas, etiquetas, estado, origen manual/CSV/integración y referencia externa opcional. Usar importe positivo y tipo explícito; definir un único convenio de signos para los apuntes internos.

- Varias cuentas: corriente, ahorro, efectivo e inversión. Saldo inicial con fecha de corte explícita.
- Una tarjeta de débito es un medio de pago vinculado a su cuenta; no una segunda fuente de saldo.
- Tarjetas de crédito y su pasivo quedan para una fase posterior y requerirán reglas propias.
- Movimientos confirmados afectan al saldo; previstos y cancelados no. Un borrador de importación tampoco.
- Búsqueda por concepto, importe, cuenta, etiquetas, categoría y rango de fechas.
- División de un gasto entre categorías, conservando la suma original. Ejemplo: compra de 60 € con 40 € de trabajo y 20 € de caprichos.
- Reembolso vinculado al gasto original: reduce el gasto neto de su categoría y no se contabiliza como sueldo u otro ingreso ordinario. Si llega otro mes, afecta al gasto neto del mes de reembolso y conserva el vínculo con el original.
- Gasto compartido: registrar lo pagado realmente y el reembolso pendiente por separado; no aumentar saldo disponible hasta recibirlo. Dividir deudas automáticamente queda para una fase posterior.
- Conciliación: mostrar saldo calculado y permitir contrastarlo con el saldo real sin ocultar discrepancias.

### Categorías iniciales

| Nombre visible | Tratamiento | Ejemplos |
| --- | --- | --- |
| Caprichos | Gasto | Ocio, compras personales, entretenimiento |
| Pádel | Gasto | Pistas, clases, material y torneos |
| Trabajo | Gasto | Transporte, comidas y material relacionados con trabajo |
| Novia | Gasto | Planes, regalos y viajes que el usuario decida asignar aquí |
| IA | Gasto | Suscripciones, APIs y herramientas de inteligencia artificial |
| Ahorros | Destino de dinero | Transferencias a cuentas u objetivos de ahorro |

Categorías editables con color, icono, subcategorías y presupuesto opcional. Añadir «Sin categorizar» como estado pendiente. No eliminar una categoría con historial sin reasignar o archivar. Un movimiento solo tiene una categoría principal; para varios destinos, dividirlo. Etiquetas permiten dimensiones adicionales sin duplicar importes.

Mostrar una vista «Distribución del dinero» con gastos y ahorro, y una vista «Gastos» solo con consumo. Si ambas aparecen juntas, explicar qué suma cada una.

## 5. Calendario y nómina

Regla exacta para cada mes de origen:
1. Obtener el último día natural del mes.
2. Restar un día natural: ese es el penúltimo día.
3. Si es sábado, sumar dos días. Si es domingo, sumar un día.
4. Conservar la fecha resultante aunque caiga en el mes siguiente.

Ejemplos obligatorios:

| Mes de nómina | Fecha base | Día | Fecha prevista de cobro |
| --- | --- | --- | --- |
| Noviembre de 2026 | 29/11/2026 | Domingo | 30/11/2026 |
| Febrero de 2026 | 27/02/2026 | Viernes | 27/02/2026 |
| Febrero de 2027 | 27/02/2027 | Sábado | 01/03/2027 |
| Febrero de 2028 | 28/02/2028 | Lunes | 28/02/2028 |
| Febrero de 2021 | 27/02/2021 | Sábado | 01/03/2021 |

La regla permite que el cobro pase al mes siguiente. Conservar el mes de nómina original y no forzar la fecha dentro del mes artificialmente.

No contemplar festivos nacionales, autonómicos ni bancarios por ahora. La regla solicitada es mover al lunes siguiente, no adelantar al viernes ni buscar otro día hábil.

- Eventos de nómina previstos con importe configurable; si se desconoce, mostrar «pendiente de definir».
- Confirmar cobro crea o vincula un ingreso real una sola vez. Repetir la acción o importar luego el ingreso no debe duplicarlo.
- Permitir importe y fecha reales distintos de la previsión conservando el mes de nómina original.
- Vista mensual y agenda; nóminas, suscripciones, recibos, objetivos y pagos previstos con leyenda.
- Pulsar un día muestra sus movimientos y permite añadir uno.
- Recurrencias mensuales y anuales: cuenta, importe estimado, fecha, categoría, inicio y final opcional.
- Para un recibo del día 31 en un mes corto, usar el último día del mes conservando 31 como regla para meses posteriores.
- Previsión a 30/60/90 días, separada de movimientos realizados y con detalle de los supuestos.
- No crear tareas en el sistema operativo ni notificaciones externas hasta implementar esa función expresamente.

### Mes natural y ciclo de nómina

Ofrecer ambas vistas. El mes natural va del día 1 al último día. El ciclo de nómina usa intervalos desde una fecha prevista de cobro incluida hasta la siguiente excluida; una corrección explícita de calendario recalcula la previsión, pero confirmar el movimiento real no cambia silenciosamente los límites históricos. Mostrar siempre las fechas del intervalo.

## 6. Resumen, presupuestos y ahorro

Resumen: saldo total por cuentas, liquidez operativa, ingresos, gastos netos, ahorro generado, transferencias a ahorro, presupuesto restante y días hasta la siguiente nómina.

- Presupuestos mensuales globales y por categoría; indicadores al 80 % y 100 %, configurables dentro de la app.
- Comparar gasto confirmado, compromisos pendientes y presupuesto. No restar dos veces un recibo ya confirmado.
- Límite orientativo diario hasta nómina basado en dinero disponible y días restantes; mostrar déficit si lo hay, sin ocultarlo al limitar el valor a cero.
- Identificar suscripciones recurrentes, coste mensual equivalente y coste anual. La equivalencia mensual de una cuota anual no crea un gasto mensual ficticio.
- Objetivos: nombre, importe objetivo, fecha opcional, saldo asignado, aportaciones y progreso.
- Fondo de emergencia con objetivo configurable, sin asignar una recomendación económica por defecto.
- Una asignación a un objetivo puede ser solo una reserva virtual; no genera transferencia real. Las asignaciones totales no superarán los fondos elegibles.
- Evitar contar dos veces una transferencia al asociarla además a un objetivo.

### Definiciones de métricas

| Métrica | Definición inicial |
| --- | --- |
| Saldo de cuenta | Saldo inicial más suma de apuntes confirmados desde su fecha de corte |
| Gastos netos | Gastos de consumo confirmados menos reembolsos efectivos del periodo |
| Ahorro generado | Ingresos ordinarios confirmados menos gastos netos; excluye transferencias, ajustes y variaciones de mercado |
| Tasa de ahorro | Ahorro generado / ingresos ordinarios × 100; sin ingresos positivos mostrar «no calculable» |
| Aportación neta a ahorro | Transferencias hacia cuentas de ahorro menos retiradas; no equivale necesariamente a ahorro generado |
| Liquidez operativa | Saldo de cuentas marcadas como disponibles para gasto; excluye inversiones y ahorro reservado |
| Disponible hasta nómina | Liquidez operativa menos compromisos pendientes hasta el próximo cobro y reservas aún no descontadas |
| Patrimonio neto | Efectivo + ahorro + valor de inversiones − pasivos registrados, sin duplicar efectivo de cuentas de inversión |

El disponible se basa en el saldo actual: no sumar otra vez ingresos ya cobrados ni restar gastos ya incluidos. Las reservas deben ser disjuntas o descontarse por su unión, nunca duplicarse. La nómina futura se presenta en previsiones, no como saldo actual. Si faltan valoraciones o pasivos, indicar que el patrimonio es parcial.

## 7. Informes y comparaciones

- Evolución mensual de ingresos, gastos y ahorro con 3, 6, 12 meses o intervalo personalizado.
- Reparto por categorías y comparación de presupuesto frente a gasto.
- Comparación mensual y anual, total y por categoría, en euros y porcentaje. Si el periodo anterior es cero, no mostrar porcentajes infinitos.
- Para el mes actual, comparar por defecto días transcurridos equivalentes; permitir meses completos con etiqueta explícita.
- Evolución de saldos, objetivos y patrimonio; separar aportaciones de revalorización.
- Principales gastos, cambios de hábitos, gasto medio diario y coste de suscripciones.
- Filtros compartidos por cuenta, categoría, estado y periodo. Gráficos y tablas deben devolver los mismos totales.
- Exportar movimientos e informes tabulares a CSV; exportación visual o PDF después del núcleo funcional.
- Proyecciones identificadas como estimaciones, con supuestos editables y sin garantizar rentabilidades.

## 8. Registro automático e importación

La aplicación no puede conocer una compra sin una fuente de datos. La primera versión tendrá registro rápido y CSV. Una futura conexión bancaria requiere proveedor, permisos, cobertura y costes confirmados.

CSV: seleccionar cuenta, mapear columnas, configurar fechas y separadores, previsualizar, detectar duplicados, corregir categorías y confirmar antes de persistir. Admitir formato decimal español. Los fallos se informan por fila; una importación repetida no debe duplicar movimientos. Usar referencia bancaria cuando exista y reglas conservadoras para candidatos idénticos: dos compras iguales pueden ser reales y no deben descartarse sin revisión.

Permitir cancelar o revertir el lote importado de forma coherente, sin borrar movimientos ajenos al lote. Neutralizar fórmulas en CSV exportado. No guardar credenciales bancarias ni simular sincronización bancaria.

Evolución opcional: Open Banking, reglas de categorización por comercio y lectura de recibos con confirmación. IA opcional y prescindible: no enviar movimientos personales a terceros sin una decisión explícita del usuario.

## 9. Mercados

Fuera de alcance por decisión explícita del usuario. La aplicación no muestra cotizaciones ni consulta proveedores de mercado.

## 10. Base técnica propuesta

Implementación provisional de la primera versión: Node.js 24, SQLite integrado e interfaz web sin dependencias externas por falta de acceso al registro de paquetes durante el arranque. La propuesta de esta sección se mantiene como opción para la siguiente etapa; no describe el código actual. El alcance y el motivo están documentados en `README.md` y `docs/ROADMAP.md`.

Decisión de diseño: tecnologías actuales y mantenibles, con pocas piezas y buen tipado. «Potente» significa resolver bien el producto; no añadir infraestructura sin necesidad.

| Capa | Propuesta | Finalidad |
| --- | --- | --- |
| Aplicación | Next.js App Router + React + TypeScript estricto | Interfaz y lógica de servidor en un proyecto |
| Interfaz | Tailwind CSS + shadcn/ui | Componentes consistentes y diseño adaptable |
| Formularios | React Hook Form + Zod | Formularios y validación compartida con comprobación en servidor |
| Persistencia | PostgreSQL + Prisma | Integridad relacional, migraciones y consultas tipadas |
| Gráficos | Recharts | Comparaciones y evolución con tabla alternativa |
| Calendario | date-fns y vista propia; evaluar FullCalendar si la interacción lo exige | Reglas de fechas explícitas sin dependencia innecesaria |
| Acceso | Biblioteca de autenticación mantenida, propuesta Better Auth | Sesiones seguras y registro público desactivado |
| Pruebas | Vitest + Playwright | Reglas financieras y recorridos principales |
| Entorno | pnpm, Node.js LTS compatible y Docker Compose | Instalación reproducible y base de datos local |
| Automatización | GitHub Actions si se aloja en GitHub | Tipos, lint, pruebas, build y revisión de dependencias |

Las versiones se verificarán al iniciar implementación en documentación oficial, se elegirán estables compatibles y se fijarán mediante manifiesto y lockfile. Esta lista es una propuesta, no una afirmación de que todas sean superiores a cualquier alternativa.

Organización propuesta: `src/app` para rutas, `src/features` para módulos, `src/domain` para reglas, `src/server` para acceso a datos/integraciones, `src/components` para componentes compartidos y `prisma` para esquema/migraciones. Las credenciales y proveedores solo se importan desde servidor.

Usar una aplicación modular y una base de datos. No requiere microservicios, Kubernetes, colas ni un backend Python separado de inicio. Añadir tareas programadas persistentes solo si se necesitan para trabajo fuera de una sesión activa.

## 11. Modelo de datos orientativo

Entidades: User, Account, Category, Transaction, TransactionSplit, Transfer, RecurrenceRule, ScheduledOccurrence, Budget, SavingsGoal, GoalAllocation, ImportBatch, Instrument, PriceSnapshot y, posteriormente, InvestmentTrade.

- Transaction y apuntes deben tener una única fuente de verdad. Una transferencia coordina ambos lados atómicamente y no crea dos gastos independientes.
- ScheduledOccurrence tiene clave única por regla y periodo para confirmar o reintentar sin duplicados.
- Reembolsos enlazados con movimientos originales y validación de importes acumulados.
- Guardar EUR en céntimos; cantidades de BTC y tipos de cambio en `NUMERIC/DECIMAL` con precisión y redondeo definidos. No convertirlos a `Number` para operar.
- Fechas financieras sin hora en columna de fecha; instantes de auditoría y precios en UTC. Convertir al presentar en Europe/Madrid.
- Propiedad del usuario en recursos y restricciones de integridad, aunque inicialmente haya una sola persona.
- Decidir estrategia de eliminación e historial antes de implementar; no dejar movimientos huérfanos ni correcciones invisibles.

## 12. Seguridad, fiabilidad y operación

- Aplicación privada con sesión obligatoria; alta de usuario controlada. Desarrollo local accesible solo desde localhost por defecto.
- Comprobar acceso y validar cada lectura/escritura en servidor; contraseñas y sesiones gestionadas por la biblioteca elegida.
- Secretos fuera del repositorio y del navegador; `.env.example` solo con nombres y valores ficticios.
- HTTPS cuando se aloje, cookies seguras en producción y protecciones de sesión/CSRF acordes a la biblioteca.
- Evitar registrar importes, conceptos, archivos importados o secretos en logs innecesarios.
- Migraciones versionadas, copia de seguridad y procedimiento de restauración comprobado antes de usar datos reales de forma habitual.
- Exportación completa y restaurable de datos, además del CSV de movimientos.
- La app persiste en base de datos; localStorage solo para preferencias no sensibles, nunca como almacén financiero principal.
- El núcleo debe seguir funcionando sin servicios de cotización y sin IA.
- No prometer soporte offline con edición hasta diseñar sincronización y conflictos. PWA instalable no significa automáticamente offline completo.

## 13. Fuentes técnicas consultadas

Referencias para iniciar el desarrollo; volver a verificar versiones, cobertura y condiciones en ese momento:
- Next.js App Router: https://nextjs.org/docs/app
- TypeScript en Next.js: https://nextjs.org/docs/app/api-reference/config/typescript
- PostgreSQL y Prisma: https://www.prisma.io/docs

## 14. Decisiones pendientes sin bloquear el arranque

- Nombre definitivo del producto y estilo visual.
- Cuentas, saldos iniciales, sueldo neto, recibos y objetivos: configuración del usuario.
- Dónde se ejecutará habitualmente y política de copias.
- Banco y proveedor si se decide sincronizar movimientos en una fase posterior.

Mantener cambios de producto aquí, instrucciones de trabajo en `AGENTS.md` y progreso verificable en `docs/ROADMAP.md`.
