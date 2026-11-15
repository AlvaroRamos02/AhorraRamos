# Instrucciones para trabajar en este proyecto

## Propósito y contexto
- Aplicación privada de finanzas personales de Álvaro, en español, EUR y zona `Europe/Madrid`.
- Antes de diseñar o modificar un módulo, leer su apartado en [docs/CONTEXT.md](docs/CONTEXT.md). Esa es la especificación funcional de referencia.
- Consultar [docs/ROADMAP.md](docs/ROADMAP.md) para alcance, orden y criterios de entrega. Actualizarlo al completar trabajo real.
- No asumir que existe una aplicación: inicialmente solo hay documentación.

## Reglas que no deben romperse
- Nómina prevista: penúltimo día natural del mes; sábado o domingo se desplaza al lunes siguiente, incluso si cambia el mes. No ajustar festivos sin una nueva regla explícita.
- Separar previsiones de movimientos confirmados. Un evento de calendario no incrementa el saldo real.
- Gastos iniciales: Caprichos, Pádel, Trabajo, Novia e IA. Ahorros aparece en la distribución del dinero como destino de transferencias, no como gasto de consumo.
- Una transferencia interna no es ingreso ni gasto; nunca duplicar dinero al moverlo entre cuentas.
- No usar coma flotante binaria para dinero. Usar céntimos enteros para EUR y decimales exactos para cantidades de activos/cambios.
- Las cotizaciones deben indicar fuente, instrumento, moneda y fecha del dato. Nunca presentar datos simulados o antiguos como actuales.
- No inventar sueldos, saldos, inversiones ni gastos del usuario. Los datos de ejemplo deben estar claramente identificados y separados.

## Implementación
- Base propuesta: TypeScript estricto, Next.js App Router, React, PostgreSQL, Prisma, Tailwind y shadcn/ui. Confirmar versiones estables compatibles al iniciar; fijarlas en lockfile.
- Aplicación modular con un backend integrado; añadir servicios separados solo ante una necesidad concreta.
- Mantener reglas financieras y calendario fuera de componentes visuales, en funciones/servicios comprobables.
- Validar entradas en servidor, comprobar acceso a cada recurso y mantener secretos exclusivamente en servidor.
- Persistencia real y migraciones versionadas. No entregar una maqueta con botones inactivos como si fuera una función terminada.
- Toda integración externa debe tolerar errores, límites y ausencia de credenciales.
- Leer solo la documentación pertinente a cada tarea. Mantener este archivo breve y documentar decisiones extensas en `docs/`.

## Validación y entrega
- Probar reglas críticas: nómina, transferencias, reembolsos, métricas, recurrencias e importación sin duplicados.
- Verificar tipos, lint, build y pruebas pertinentes cuando exista código y estén disponibles los comandos.
- Verificar flujos principales en móvil y escritorio, estados vacíos, errores y persistencia tras recargar.
- Informar de lo implementado, cómo se verificó y qué queda pendiente; no afirmar comprobaciones que no se hayan ejecutado.
- No incorporar automáticamente IA, sincronización bancaria, servicios de pago o despliegues públicos por estar mencionados como evolución.
