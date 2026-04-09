# Recrea-T

Aplicacion React + Vite con backend propio en Node.js y MySQL.

## Estado actual

- Sin Supabase.
- Autenticacion real con JWT.
- Persistencia en MySQL.
- Subida de imagenes y documentos al servidor.
- Pagos simulados desde backend para marcar certificaciones como pagadas.
- `npm run lint` y `npm run build` pasan correctamente.

## Requisitos

- Node.js 20 o superior
- MySQL 8 o MariaDB compatible

## Configuracion

1. Crea la base de datos:

```sql
SOURCE server/create-database.sql;
```

Si prefieres hacerlo a mano:

```sql
CREATE DATABASE recreat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Copia `.env.example` a `.env` y ajusta estos valores:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `CLIENT_APP_URL`
- `PUBLIC_BASE_URL`
- `DEFAULT_ADMIN_PASSWORD`

3. Instala dependencias:

```bash
npm install
```

4. Inicializa la base y las tablas:

```bash
npm run db:init
```

## Arranque en local

Backend:

```bash
npm run server
```

Frontend:

```bash
npm run dev
```

El backend se levanta por defecto en `http://localhost:4000` y el frontend en `http://localhost:5173`.

## Primer acceso

Al arrancar el backend, si no existe ningun administrador, se crea uno automaticamente con los datos de `.env`:

- usuario: `DEFAULT_ADMIN_USERNAME`
- email: `DEFAULT_ADMIN_EMAIL`
- password: `DEFAULT_ADMIN_PASSWORD`

Si no defines `DEFAULT_ADMIN_PASSWORD`, el backend generara una clave aleatoria y la mostrara en consola al crear el primer admin.

## Que crea automaticamente el backend

Al iniciar, el servidor crea estas tablas si no existen:

- `app_users`
- `categories`
- `materials_catalog`
- `projects`
- `payments`
- `reminders`
- `pdfs`

Tambien crea la carpeta `server/uploads` para imagenes y documentos.

## Scripts utiles

- `npm run dev`: frontend en desarrollo
- `npm run db:init`: crea la base de datos y las tablas
- `npm run server`: backend
- `npm run server:dev`: backend con watch
- `npm run lint`: validacion
- `npm run build`: build de produccion

## Notas

- La busqueda de direcciones pasa por el backend (`/api/locations/search`) para no depender de llamadas directas desde el navegador.
- Los pagos no usan Stripe; ahora son un flujo interno para marcar certificaciones y registrar el movimiento.
- Los endpoints y botones de demo estan desactivados por defecto. Solo se activan con `DEMO_MODE=true` y `VITE_ENABLE_DEMO_TOOLS=true`.
- Docker no esta incluido aun en esta fase.
