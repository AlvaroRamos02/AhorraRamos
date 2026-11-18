# Ideas de funcionalidades para AhorraRamos

El panel ya muestra el saldo de ING, los abonos y cargos contabilizados, la actividad diaria, el desglose por categorías y la fecha prevista de nómina. El listado permite buscar, filtrar, agrupar y corregir la categoría de un cargo. La sincronización sustituye la consulta anterior por una ventana de hasta 90 días. Las propuestas parten de ese funcionamiento y mantienen Enable Banking AIS como única fuente del saldo y los movimientos.

## Para empezar

1. **Copia y restauración verificadas.** Crear una copia local coherente de SQLite y comprobar que se puede restaurar en una carpeta aparte. El primer objetivo sería recuperar las categorías manuales y la última consulta guardada. Si el consentimiento ha caducado, la restauración dejaría esos datos disponibles y el panel pediría renovar la conexión.
2. **Recordar cómo se clasifica un comercio.** Al cambiar una categoría, ofrecer aplicar esa elección a futuros cargos del mismo comercio. Mostrar qué conceptos coinciden antes de guardar la regla y permitir editarla o borrarla. Una corrección manual de un cargo concreto tendría prioridad.
3. **Vincular devoluciones con sus compras.** Sugerir parejas por concepto, fecha e importe y dejar que el usuario confirme el vínculo, incluso para devoluciones parciales. El desglose podría mostrar los cargos netos de devoluciones confirmadas, conservando ambos movimientos en el listado y sus importes brutos en el resumen bancario.
4. **Avisar cuando la conexión necesite atención.** Mostrar cuánto tiempo ha pasado desde la última consulta correcta y distinguir un fallo puntual de un permiso caducado cuando exista información fiable para hacerlo. En ese caso, ofrecer renovar la conexión desde el mismo aviso y seguir mostrando la fecha de los datos disponibles.

## Después

5. **Abrir los movimientos desde la comparación mensual.** La comparativa ya muestra cuánto han variado los cargos totales y por categoría. Se podría abrir el listado con la categoría y el tramo de días usados en la comparación para explicar la diferencia.
6. **Presupuestos mensuales por categoría.** Fijar límites en euros para categorías como supermercado u ocio y ver cuánto queda de cada límite. Usar cargos contabilizados y mostrar por separado el efecto de las devoluciones confirmadas cuando se puedan vincular. Presentar los importes como cargos de la cuenta y dejar que el usuario elija qué categorías sigue.
7. **Vista entre nóminas y próximos recibos.** Detectar posibles recibos y suscripciones recurrentes y permitir confirmar su periodicidad. Mostrar los próximos cobros estimados hasta la siguiente nómina. Para ciclos anteriores, usar los abonos de nómina reconocidos o confirmados como fechas reales. Las previsiones seguirían fuera de los totales contabilizados.
8. **Histórico local más allá de 90 días.** Conservar los movimientos ya obtenidos y registrar qué fechas cubre cada consulta. Serviría para comparar trimestres o recuperar un cargo antiguo. Antes de acumular datos, resolver cómo evitar duplicados entre consultas solapadas, cómo indicar los huecos y qué opción tendrá el usuario para borrar el histórico.
9. **Exportar la selección a CSV.** Descargar los movimientos del mes o del filtro activo con fecha, concepto, importe en euros y categoría. Serviría para hacer cálculos en una hoja de cálculo. La exportación se generaría localmente y protegería los conceptos para que la hoja los trate como texto.
