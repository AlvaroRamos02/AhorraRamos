# AhorraRamos

Consulta el saldo y los movimientos contabilizados de una cuenta ING España a través de Enable Banking. La aplicación es local y de solo lectura.

## Configuración

1. Usa Node.js 24.11 o superior.
2. Registra una aplicación **Production** en [Enable Banking](https://enablebanking.com/cp/applications) y vincula tu cuenta en el acceso restringido. Guarda la clave privada descargada fuera del repositorio.
3. Configura un certificado TLS local confiable para `127.0.0.1` con su clave fuera del repositorio. Registra el retorno `https://127.0.0.1:3000/api/banking/ing/callback` en el panel. Ajusta el puerto si cambias `PORT`.
4. Copia [`.env.example`](.env.example) a `.env`. Indica el ID de la aplicación, las rutas de los archivos PEM y la URL de retorno registrada.
5. Ejecuta `npm start`, abre `https://127.0.0.1:3000` y pulsa **Conectar ING** para autorizar el acceso en el banco. El resumen se abre directamente en este equipo.

SQLite se guarda en `data/ahorra-ramos.sqlite`, fuera de Git. Detén la aplicación para hacer una copia privada. Usa `npm run dev` para recarga automática y `node --test <archivo>` para comprobaciones dirigidas.

El comportamiento y el mapa del código están en [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md).
