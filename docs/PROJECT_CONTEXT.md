# Contexto del proyecto

## Resumen

**AhorraRamos** es el nombre provisional del proyecto. El repositorio aún no contiene suficiente información para afirmar qué producto se construirá, para quién o mediante qué tecnología.

Este documento separa deliberadamente los hechos, las hipótesis y las decisiones. Debe mantenerse como la fuente de verdad principal durante la definición del proyecto.

## Hechos confirmados

- El nombre actual del proyecto es **AhorraRamos**.
- El proyecto se encuentra en una fase inicial de definición.
- A fecha de creación de este documento no existe código funcional.
- No se ha seleccionado un stack tecnológico.
- Se desea mejorar primero el contexto antes de introducir funcionalidad.

## Hipótesis por validar

El nombre puede sugerir una iniciativa relacionada con ahorro, finanzas o hábitos, pero esto **no está confirmado**. No debe orientar decisiones de producto ni técnicas hasta que se valide explícitamente.

## Objetivo de la fase actual

Convertir una idea todavía ambigua en una definición de producto suficientemente clara como para diseñar un primer incremento pequeño, medible y reversible.

La fase estará completa cuando exista acuerdo sobre:

- el problema concreto que se quiere resolver;
- las personas que lo experimentan;
- el resultado que indicará que la solución aporta valor;
- el alcance mínimo de una primera versión;
- las restricciones de negocio, legales, técnicas y operativas;
- los criterios con los que se evaluará el primer incremento.

## Alcance actual

### Incluido

- Descubrimiento del problema y de los usuarios.
- Definición de objetivos y métricas.
- Identificación de restricciones y riesgos.
- Priorización de casos de uso.
- Documentación de decisiones.
- Evaluación posterior de alternativas técnicas.

### Excluido por ahora

- Implementación de funcionalidades.
- Selección prematura de framework, lenguaje, base de datos o proveedor.
- Diseño detallado de interfaces sin casos de uso validados.
- Integraciones o automatizaciones externas.
- Compromisos de fechas sin un alcance definido.

## Principios de decisión

1. **Hechos antes que suposiciones.** Toda afirmación no validada debe etiquetarse como hipótesis.
2. **Problema antes que solución.** La tecnología debe responder a necesidades conocidas.
3. **Alcance pequeño.** La primera versión debe poder validarse con el mínimo coste razonable.
4. **Resultados medibles.** Cada iniciativa debe indicar qué cambio observable busca producir.
5. **Decisiones reversibles.** Cuando haya incertidumbre, favorecer opciones fáciles de cambiar.
6. **Privacidad desde el diseño.** Si se manejan datos personales o financieros, evaluar sus implicaciones antes de implementar.
7. **Documentación viva.** Actualizar este contexto cuando se confirme o descarte una hipótesis.

## Preguntas abiertas prioritarias

### Producto

- ¿Qué problema específico quiere resolver AhorraRamos?
- ¿Quién es el usuario principal y en qué situación aparece el problema?
- ¿Qué alternativas utiliza hoy ese usuario?
- ¿Cuál es la propuesta de valor en una sola frase?
- ¿Qué caso de uso debe resolver primero?

### Éxito

- ¿Qué comportamiento o resultado demostrará que el producto aporta valor?
- ¿Cuál será la métrica principal de la primera versión?
- ¿Qué umbral justificaría continuar, cambiar de enfoque o detener el proyecto?

### Alcance

- ¿Qué es imprescindible para la primera validación?
- ¿Qué funciones quedan expresamente fuera?
- ¿Debe ser web, móvil, escritorio, servicio interno u otro formato?

### Restricciones

- ¿Existe una fecha objetivo o un presupuesto?
- ¿Hay requisitos de privacidad, seguridad, accesibilidad o cumplimiento normativo?
- ¿Se tratarán datos personales, bancarios o especialmente sensibles?
- ¿Existen servicios externos o sistemas con los que sea necesario integrarse?

### Operación

- ¿Quién desarrollará, mantendrá y dará soporte al producto?
- ¿Qué nivel de disponibilidad y observabilidad será necesario?
- ¿Qué entornos y flujo de entrega se necesitarán?

## Plantilla para concretar el producto

Completar esta sección cuando se disponga de respuestas validadas:

> Para **[tipo de usuario]** que necesita **[problema o necesidad]**, AhorraRamos es **[tipo de solución]** que permite **[beneficio principal]**. A diferencia de **[alternativa actual]**, ofrece **[diferenciador verificable]**.

## Próximo hito recomendado

Realizar una sesión breve de definición y cerrar, como mínimo, las cinco preguntas de producto. Con esas respuestas podrá redactarse un alcance inicial sin inventar requisitos ni arquitectura.

## Mantenimiento

- Editar este documento cuando cambie el contexto confirmado.
- Mover las decisiones cerradas a `docs/DECISIONS.md`.
- Conservar aquí únicamente el estado vigente, no el historial completo.
- Añadir la fecha de última revisión cuando se produzca el primer cambio de contenido.
