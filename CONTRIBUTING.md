# Contribuir a AhorraRamos

Lee [AGENTS.md](AGENTS.md) y [el contexto del proyecto](docs/PROJECT_CONTEXT.md). Actualiza el contexto cuando cambie una regla o el comportamiento observado.

Mantén los cambios y commits pequeños. Verifica el código afectado con pruebas dirigidas y usa datos sintéticos. Revisa los archivos preparados antes de confirmar. Mantén `.env`, `data/`, credenciales y copias de SQLite fuera de Git.

El flujo **Seguridad** de GitHub Actions se ejecuta al subir cambios a `main`, al abrir o actualizar una solicitud de cambios hacia esa rama, los lunes y bajo demanda. Gitleaks revisa el historial de las ramas y etiquetas descargadas y una copia de todos los archivos versionados, con los valores detectados ocultos. `npm audit` comprueba el árbol fijado en `package-lock.json` y falla con vulnerabilidades de gravedad moderada o superior. Semgrep aplica reglas de JavaScript y GitHub Actions desde la raíz de esa copia, incluidos los tests y los workflows.

En **Actions → Seguridad**, abre una ejecución y entra en **Summary**. Cada trabajo publica su tabla de hallazgos o indica si el análisis terminó sin hallazgos o si el informe no está disponible.
