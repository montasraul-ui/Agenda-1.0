# Deploy Guide - Agenda 1.0

## Stack
- **Frontend**: Vercel
- **Backend**: Railway
- **Database**: Neon (PostgreSQL)

---

## Requisitos Previos
1. Cuenta en [neon.tech](https://neon.tech) - Ya tienes
2. Cuenta en [railway.app](https://railway.app)
3. Cuenta en [vercel.com](https://vercel.com)
4. Repositorio en GitHub

---

## Paso 1: Base de Datos (Neon)

1. Ir a [neon.tech](https://neon.tech) → Tu proyecto
2. Dashboard → **Connection Details**
3. Copiar **Direct JDBC URL** (será tu DATABASE_URL):
   ```
   postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/agenda?sslmode=require
   ```

---

## Paso 2: Backend (Railway)

1. Ir a [railway.app](https://railway.app)
2. **New Project** → nombre: `agenda-backend`
3. **Add PostgreSQL** (Neon también sirve, pero Railway tiene su propio Postgre):
   - Si usas Neon: Add plugin → **PostgreSQL** → pegar DATABASE_URL de Neon
4. **Deploy**:
   - **GitHub**: Conectar repositorio
   - Root directory: `server`
   - Build: `npm install && npm run build`
   - Start: `npm start`
5. Ir a **Deployments** → copiar **Production URL** (ej: `https://agenda-backend.up.railway.app`)

---

## Paso 3: Migrar Base de Datos

1. Copiar **Production URL** de Railway
2. Setear variable en **Variables**:
   - `DATABASE_URL`:Tu URI de Neon (del paso 1)
3. Railway detectará automáticamente las tablas al hacer deploy

**Nota**: Las tablas (equipment, projects, tasks) se crean automáticamente en el primer request.

---

## Paso 3: Frontend (Vercel)

1. Ir a [vercel.com](https://vercel.com)
2. **New Project** → Importar repositorio `agenda-1-0`
3. Configuration:
   - Framework Preset: **Vite**
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Environment Variables:
   - `VITE_API_URL`: `https://agenda-backend.up.railway.app/api`
5. **Deploy**

---

## URLs de Producción

Copiar estas URLs después del deploy:

| Servicio | URL |
|----------|-----|
| Backend | `https://agenda-backend.up.railway.app` |
| Frontend | `https://agenda-1-0.vercel.app` |

---

## Verificación

Verificar que todo funciona:

```bash
# Health check backend
curl https://agenda-backend.up.railway.app/api/health

# Probar API
curl https://agenda-backend.up.railway.app/api/equipment
```

---

## Notas

- El frontend usa `VITE_API_URL` para conectar al backend
- Si cambias el dominio, actualizar la variable en Vercel
- Los builds locales están en `client/dist` y `server/dist`

---

## Comandos Locales

```bash
# Frontend
cd client
npm run dev    # dev server en localhost:5173
npm run build # build production

# Backend
cd server
npm run dev   # dev server en localhost:3001
npm run build # build production
```