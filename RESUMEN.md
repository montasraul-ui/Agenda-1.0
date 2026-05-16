# Resumen Ejecutivo - Agenda 1.0

## Descripción
Aplicación web para gestión de calendario, proyectos y seguimiento de calibraciones de equipos de medición, cumpliendo normas ISO 13485 e ISO 11135.

---

## Stack Tecnológico
| Componente | Tecnología |
|------------|------------|
| Frontend | React + TypeScript + Vite |
| UI | Tailwind CSS |
| Backend | Node.js + Express |
| Base de datos | PostgreSQL (Neon) |
| Calendario | FullCalendar |
| Testing | Vitest |

---

## Funcionalidades Principales

1. **Calendario** - Vista mensual/semanal con eventos de proyectos y calibraciones
2. **Gestión de Proyectos** - CRUD de proyectos y tareas con seguimiento de avance
3. **Control de Calibraciones** - Registro de equipos, fechas de vencimiento, certificados, alertas
4. **Importación Excel** - Carga masiva de equipos desde archivo Excel

---

## Estructura de Datos
- **equipment**: equipos de medición (ID, descripción, ubicación, fecha calibración/expiración, norma ISO)
- **projects**: proyectos (nombre, descripción, status, fechas)
- **tasks**: tareas vinculadas a proyectos

---

## Estado Actual
- Frontend base creado ✓
- Backend API listo (CRUD equipment + projects + tasks) ✓
- UI Dashboard, Equipos, Proyectos, Calendario ✓
- Compilación exitosa (frontend + backend) ✓
- **Importación Excel** ✓ - Soporta 3 hojas: Cal Schedule, Master List DL, Instrumentos Fuera de Servicio
- **Calendario Unificado** ✓ - 3 vistas (mensual/semanal/diaria), muestra tareas por fecha
- **TDD Tests** ✓ (28 tests passing: 13 server + 15 client)
- **Sistema de Alarmas** ✓ - Campana de notificaciones con grouping por categoría (equipos + tareas)
- **Dashboard con Gráficos** ✓ - 3 secciones horizontales (Equipos, Proyectos, Tareas) con Chart.js
- **Gráfico Equipos** ✓ - 5 categorías: Vencidos, Pendientes (30 días), Otros, Out for Calibration, Fuera de Servicio
- **Calendario con Tareas** ✓ - Muestra actividades/tareas individuales con color por prioridad
- **Checkbox de Completado** ✓ - Checkbox en tareas para marcar como completadas
- **Barra de Progreso** ✓ - Porcentaje de tareas completadas en tarjeta de proyecto
- **Tareas Vencidas** ✓ - Lista de tareas próximas incluye atrasadas con indicador visual
- ✅ Desplegado en producción (Render)

---

## Tareas Pendientes

### 1. Diagrama de Gantt para Proyectos
- Agregar vista de Diagrama de Gantt en sección de Proyectos
- Mostrar proyectos como barras horizontales según fechas (start_date → end_date)
- Color de cada barra según el color del proyecto
- Barra de progreso interior mostrando % de tareas completadas
- Implementación recomendada: FullCalendar Timeline view (ya instalado)
- Toggle para cambiar entre vista Cards y vista Gantt
- Componente: `ProjectGantt.tsx`

### 2. Editar Tarea desde Calendario
- Al hacer click en tarea/actividad, abrir modal de detalles (solo lectura)
- Agregar botón "Editar" en el modal
- Al hacer click en "Editar", mostrar formulario completo con todos los campos
- Formulario de edición debe ser igual al de creación (título, descripción, proyecto, fecha, hora, prioridad, recurrencia, estado)
- Botón "Ver" para volver al modo solo lectura
- Botón "Guardar" para actualizar la tarea (consumir PUT /api/tasks/:id)
- Botón "Eliminar" para borrar la tarea

## Estructura de Archivos
```
agenda-1.0/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── App.tsx         # Main app con rutas
│   │   ├── config.ts       # API URL hardcoded
│   │   ├── components/
│   │   │   ├── Alerts/
│   │   │   │   ├── NotificationBell.tsx    # Campana de notificaciones
│   │   │   │   └── NotificationBell.tsx
│   │   │   ├── Charts/
│   │   │   │   ├── DetailModal.tsx         # Modal para detalles de gráficos
│   │   │   │   ├── EquipmentCharts.tsx     # Donut + Barras mensual
│   │   │   │   ├── ProjectChart.tsx        # Barras verticales
│   │   │   │   └── TaskChart.tsx           # Barras horizontales
│   │   │   ├── Calendar/
│   │   │   │   ├── CalendarView.tsx
│   │   │   │   ├── EventModal.tsx
│   │   │   │   └── calendarUtils.ts
│   │   │   └── Tasks/
│   │   │       └── TasksView.tsx
│   │   └── index.css      # Estilos Tailwind
│   ├── package.json       # Dependencias: chart.js, react-chartjs-2
│   └── dist/              # Build production
├── server/                 # Backend Express
│   ├── src/
│   │   ├── index.ts       # Servidor principal
│   │   ├── migrate.ts     # Migración DB
│   │   ├── utils/         # Utilidades
│   │   │   └── equipment.ts
│   │   ├── routes/        # API endpoints
│   │   │   ├── equipment.ts   # CRUD + import Excel + alerts
│   │   │   ├── projects.ts   # CRUD + actividades
│   │   │   └── tasks.ts       # CRUD
│   │   └── tests/         # Tests TDD
│   │       └── equipment.test.ts
│   └── dist/              # Build production
├── RESUMEN.md             # Este documento
├── DEPLOY.md              # Guía de deploy
└── package.json           # Root package (mono-repo)
```

---

## URLs de Producción
- **Frontend**: https://agenda-frontend-s2tu.onrender.com
- **Backend**: https://agenda-backend-zrd6.onrender.com
- **Base de datos**: Neon (PostgreSQL)

## Costo Estimado
- **Render**: Gratis (Frontend + Backend)
- **Neon**: Gratis (500MB PostgreSQL)
- **Total**: $0/mes

---

## Historial de Actualizaciones

### 2026-05-03 - Implementación Inicial
- Proyecto iniciado con estructura base React + Node.js
- Frontend: Vite + React + TypeScript + Tailwind CSS
- Backend: Express + TypeScript
- API REST para equipment, projects, tasks
- UI: Dashboard, Lista Equipos, Proyectos, Calendario (básico)

### 2026-05-03 - Fase 1: Importación Excel
- Endpoint POST /api/equipment/import para cargar archivo Excel
- Soporte para formato febrero.xlsx (3 hojas: Cal Schedule, Master List DL, Instrumentos Fuera de Servicio)
- Validación de datos: ID y descripción requeridos
- Transacciones PostgreSQL con rollback automático
- UI frontend: botón "Importar Excel" en página Equipos
- Tests TDD: 13 tests passing (validación, parsing, conversion fechas)
- Dependencias: multer, xlsx, vitest

### 2026-05-03 - Fase 3: Alertas y Dashboard Mejorado
- Endpoint GET /api/equipment/alerts para obtener equipos vencidos y por vencer (30 días)
- Dashboard mejorado con alertas visuales y estadísticas
- Componente de notificaciones (NotificationsBell)

### 2026-05-03 - Fase 2: Calendario Unificado
- Integración de FullCalendar con 3 vistas (mensual, semanal, diaria)
- Eventos de proyectos en color azul
- Eventos de calibraciones según vencimiento

### 2026-05-04 - Deploy a Producción
- Frontend desplegado en Render: https://agenda-frontend-s2tu.onrender.com
- Backend desplegado en Render
- Base de datos: Neon (PostgreSQL)
- Fixes en Proyectos: eliminar clonación, agregar editar/eliminar, gestionar actividades

### 2026-05-04 - Fix Conexión API
- API URL hardcoded en config.ts para conectar frontend con backend
- Frontend ahora apunta a: https://agenda-backend-zrd6.onrender.com/api

### 2026-05-04 - Sistema de Alarmas
- Botón de campana en header con notificaciones
- Agrupamiento por categoría (1 alarma por tipo, no por cantidad)
- Incluye: Equipos Vencidos, Por Vencer (30 días), Tareas Atrasadas, Tareas Esta Semana
- Click en categoría despliega lista de equipos/tareas

### 2026-05-04 - Dashboard con Gráficos
- 3 secciones horizontales: Equipos, Proyectos, Tareas
- **Gráfico Equipos**: Donut 4 categorías + Barras mensual (vencimientos por mes)
- **Gráfico Proyectos**: Barras verticales (Activos/Completados/En pausa)
- **Gráfico Tareas**: Barras horizontales (Alta/Media/Baja prioridad + % completado)
- Click en cualquier gráfico → Modal con detalle de elementos

### 2026-05-04 - Gráfico Equipos (5 categorías)
- Vencidos: fecha_expiración < fecha_actual (rojo)
- Pendientes: fecha_actual <= fecha <= +30 días (amarillo)
- Otros: fecha_expiración > +30 días (verde)
- Out for Calibration: status = 'out_for_calibration' (azul)
- Fuera de Servicio: status = 'out_of_service' (gris)

### 2026-05-04 - Redistribución del Dashboard
- 3 secciones horizontales independientes:
  - **Equipos**: Total, Pendientes 30 días, Fuera de Servicio + gráficos
  - **Proyectos**: Total, Completados + gráfico
  - **Tareas**: Gráfico + Lista de tareas próximas 7 días

### 2026-05-04 - Calendario con Tareas
- Calendario ahora muestra actividades/tareas individuales (no proyectos)
- Color por prioridad: Alta (rojo), Media (amarillo), Baja (verde)
- Formato de fecha dd/mm/yy en detalles

### 2026-05-04 - Checkbox y Progreso de Proyectos
- Checkbox en cada tarea para marcar como completada
- Barra de progreso visual en tarjeta de proyecto
- Porcentaje calculado: (tareas completadas / total tareas) × 100

### 2026-05-04 - Tareas Vencidas
- Lista de tareas próximas incluye tareas vencidas
- Indicador visual (⚠️ + borde rojo) para tareas atrasadas
- Tareas vencidas aparecen primero en la lista

### 2026-05-04 - Keep-Alive para Render
- Render gratuito se "duerme" después de 15 minutos de inactividad
- Solución: Configurar cronjob en cron-job.org para ping cada 10 minutos
- URL de ping: https://agenda-backend-zrd6.onrender.com/api/health

---

## Posibles Mejoras

### Arquitectura Modular - Sistema de Plugins

**Objetivo**: Permitir al usuario configurar qué módulos aparecen en su menú, permitiendo agregar/quitar funcionalidades según sus necesidades.

#### Estructura Propuesta

```
client/src/
├── modules/                          (módulos independientes)
│   ├── Dashboard/
│   │   ├── index.tsx
│   │   ├── config.ts                 (configuración del módulo)
│   │   └── types.ts
│   ├── Equipment/
│   ├── Projects/
│   ├── Tasks/
│   ├── Calendar/
│   ├── Kanban/
│   └── Settings/                     (configuración de módulos)
├── core/
│   ├── ModuleRegistry.tsx            (registro central)
│   ├── UserConfigContext.tsx        (contexto de configuración)
│   ├── SharedDataContext.tsx         (datos compartidos)
│   └── events.ts                     (sistema de eventos)
├── App.tsx                           (orquestador - ligero)
└── Navigation.tsx                    (menú dinámico)
```

#### Configuración por Usuario (Backend)

```sql
-- Nueva tabla
CREATE TABLE user_module_config (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  enabled_modules TEXT[] DEFAULT ARRAY['dashboard', 'equipment', 'projects', 'tasks', 'calendar', 'kanban'],
  module_order INTEGER[] DEFAULT ARRAY[0, 1, 2, 3, 4, 5],
  theme VARCHAR(20) DEFAULT 'dark',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Endpoints API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/user-config/:userId` | Obtener configuración del usuario |
| PUT | `/api/user-config/:userId` | Actualizar configuración |
| GET | `/api/modules/available` | Listar todos los módulos disponibles |

#### Template de each Módulo

```typescript
// modules/[Nombre]/config.ts
export const moduleConfig = {
  id: 'nombre',
  name: 'Nombre en español',
  icon: 'emoji',
  description: 'descripción breve',
  enabledByDefault: true,
  routes: ['/ruta'],
  dependencies: [],
};
```

#### Comunicación entre Módulos

| Método | Uso |
|--------|-----|
| SharedDataContext | Datos compartidos (equipment, projects, tasks) |
| Custom Events | Notificaciones cruzadas (task:created, task:completed, etc) |

#### Página de Configuración

UI para que el usuario pueda:
- Toggle para activar/desactivar cada módulo
- Reordenar módulos con drag & drop
- Guardar configuración en backend

#### Beneficios

- **Escalabilidad**: Agregar nuevos módulos sin modificar código existente
- **Personalización**: Usuario configura su entorno de trabajo
- **Mantenibilidad**: Cada módulo es independiente
- **Testabilidad**: Módulos se pueden probar aisladamente

#### Plan de Implementación Estimado

| Fase | Descripción | Estimación |
|------|-------------|------------|
| 1 | Backend: tabla + endpoints de configuración | 1.5 hrs |
| 2 | Core: ModuleRegistry, Contexts, events | 2 hrs |
| 3 | Crear estructura de carpetas modules/ | 0.5 hr |
| 4-9 | Migrar 6 módulos existentes (Dashboard→Kanban) | 7 hrs |
| 10 | Navigation dinámica + App.tsx | 1 hr |
| 11 | Settings page para configurar módulos | 1.5 hrs |
| 12 | Testing y ajustes finales | 2 hrs |

**Total estimado: ~15 horas**

(End of file)