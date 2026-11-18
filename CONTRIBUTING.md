# Contribuir a AhorraRamos

Lee [AGENTS.md](AGENTS.md) y [el contexto del proyecto](docs/PROJECT_CONTEXT.md). Actualiza el contexto cuando cambie una regla o el comportamiento observado.

Mantén los cambios y commits pequeños. Verifica el código afectado con pruebas dirigidas y usa datos sintéticos. Revisa los archivos preparados antes de confirmar. Mantén `.env`, `data/`, credenciales y copias de SQLite fuera de Git.

El flujo **Seguridad** de GitHub Actions se ejecuta al subir cambios a `main`, al abrir o actualizar una solicitud de cambios hacia esa rama, los lunes y bajo demanda. Semgrep aplica reglas de JavaScript a `src/`. Gitleaks comprueba `src/`, `package.json` y `package-lock.json` en el commit actual y en el historial de las ramas y etiquetas descargadas, con los valores detectados ocultos. `npm audit` comprueba solo las dependencias de producción y falla con vulnerabilidades de gravedad moderada o superior.

En **Actions → Seguridad**, abre una ejecución y entra en **Summary**. Cada trabajo publica su tabla de hallazgos o indica si el análisis terminó sin hallazgos o si el informe no está disponible.
