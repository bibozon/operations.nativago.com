# Módulo 03 — Reservas / Control de Cupo / Check-in

**Clasificación de riesgo del módulo: ALTO**
Impacto económico: muy alto (dinero real, anticipo 15%) · Impacto disponibilidad: alto (sobreventa) · Impacto operadores: medio.

Rutas: `POST /api/catalog/bookings`, `POST /api/catalog/bookings/[code]/cancel`, `GET /api/catalog/bookings/[code]`, `/admin/bookings`, `POST /api/checkin`, `/admin/checkin`.

---

## 1. Catálogo de reglas de negocio

| ID | Regla | Criticidad | Riesgo | Cobertura actual |
|---|---|---|---|---|
| RN-RES-01 | `experienceId`, `date`, `guests`, `customerName`, `customerEmail` obligatorios | Alta | Bajo | ⚠️ Implícito en el feliz, sin negativo directo a nivel API |
| RN-RES-02 | `customerEmail` debe tener formato válido (regex) | Media | Bajo | ❌ Sin cobertura |
| RN-RES-03 | `guests` se acota server-side a `[1, 50]` sin importar lo enviado (protege contra negativos/absurdos) | Media | Bajo | ❌ Sin cobertura |
| RN-RES-04 | Anticipo = 15% del total; resto = 85% al operador — regla financiera central del modelo de negocio | Muy Alta | Bajo (cálculo simple, estable) | ⚠️ Verificado visualmente en UI del marketplace, no aserta el cálculo exacto en ningún assert automatizado |
| RN-RES-05 | Control de cupo: si `Experience.capacity > 0`, la suma de `guests` de reservas activas (`status != CANCELLED`) para la misma fecha no puede superar `capacity` | Muy Alta | Alto | ✅ Automatizado (feliz + negativo, esta sesión) |
| RN-RES-06 | `capacity = 0` (default) = "sin límite configurado" — no rompe experiencias preexistentes | Media | Bajo | ✅ Automatizado (implícito: el resto de la suite crea reservas sin fijar cupo) |
| RN-RES-07 | Conteo + creación corren en una `$transaction` para acotar (no eliminar del todo) la ventana de sobreventa concurrente | Alta | Medio | ❌ Sin escenario de concurrencia real (2 reservas simultáneas al límite exacto del cupo) |
| RN-RES-08 | Cancelación por el huésped exige `email` coincidente con `customerEmail` + `bookingCode` válido (ownership sin cuenta) | Alta | Medio | ❌ Sin cobertura |
| RN-RES-09 | Cancelación bloqueada si faltan menos de 24h para la actividad | Alta | Medio | ❌ Sin cobertura |
| RN-RES-10 | Cancelar una reserva ya cancelada devuelve error de negocio (idempotencia con mensaje), no un crash | Media | Bajo | ❌ Sin cobertura |
| RN-RES-11 | Un operador solo ve/gestiona reservas de sus propias experiencias | Muy Alta | Medio | ❌ Sin cobertura — mismo patrón repetido que RN-EXP-05, tampoco probado aquí |
| RN-RES-12 | El cambio de estado de reserva en `/admin/bookings` castea el valor del formulario `as any` sin validar contra el enum `BookingStatus` antes de escribir | Media | Medio | ❌ Sin cobertura — un valor fuera del enum probablemente crashea (Prisma rechaza el enum) en vez de mostrar error de negocio |
| **RN-RES-13** | 🟡 **El check-in marca `CONFIRMED` sin verificar el estado previo** — se puede "reconfirmar" vía escaneo QR una reserva `CANCELLED`, o hacer check-in de una reserva con fecha futura que todavía no ocurrió | Alta | **Alto** | ❌ Sin cobertura — regla de negocio implícita nunca declarada en código |
| RN-RES-14 | Check-in respeta ownership (operador de la reserva, o staff) | Alta | Bajo | ❌ Sin cobertura |
| **RN-RES-15** | 🟡 **`checkRateLimit()` usa un `Map` en memoria de proceso** — en Vercel serverless (múltiples instancias, cold starts) el límite de "20 reservas por IP" no es confiable entre invocaciones; es efectivamente cosmético en producción | Media | **Alto (a nivel infraestructura, no de lógica)** | No automatizable como escenario Playwright — es un problema de arquitectura de despliegue, documentado como riesgo |

---

## 2. Escenarios diseñados (nuevos)

```gherkin
# language: es
@negativo
Escenario: No se puede reservar sin email de contacto
  Dado que existe una experiencia publicada
  Cuando envío una reserva sin customerEmail a la API de reservas
  Entonces la API responde con estado 400

@borde
Escenario Outline: El número de personas se acota a un rango razonable
  Dado que existe una experiencia publicada
  Cuando envío una reserva para "<guests>" personas a la API de reservas
  Entonces la API acepta la reserva con "<guests_efectivos>" personas

  Ejemplos:
    | guests | guests_efectivos |
    | -5     | 1                 |
    | 0      | 1                 |
    | 500    | 50                |

@negativo
Escenario: No se puede cancelar una reserva con menos de 24 horas de anticipación
  Dado que tengo una reserva confirmada para dentro de 12 horas
  Cuando intento cancelarla con mi email
  Entonces la API responde con estado 400 y el mensaje "No se puede cancelar con menos de 24 horas de anticipación. Contacta al operador por WhatsApp."

@negativo
Escenario: No se puede cancelar una reserva ya cancelada
  Dado que tengo una reserva ya cancelada
  Cuando intento cancelarla de nuevo con mi email
  Entonces la API responde con estado 400 y el mensaje "La reserva ya fue cancelada"

@negativo @seguridad
Escenario: Un operador no puede ver reservas de otro operador
  Dado que tengo una cuenta de operador aprobada con al menos una reserva
  Cuando voy a la administración de reservas
  Entonces solo veo reservas de mis propias experiencias

@borde
Escenario: El check-in de una reserva cancelada
  Dado que tengo una reserva cancelada
  Cuando escaneo su código QR para hacer check-in
  Entonces el sistema me advierte que la reserva está cancelada
  # Hoy este escenario fallaría: el endpoint la marca CONFIRMED igual — hallazgo esperado (RN-RES-13).
```

---

## 3. Matriz de trazabilidad

| Regla | Escenario existente | Estado |
|---|---|---|
| RN-RES-05, RN-RES-06 | `Una reserva dentro del cupo disponible se crea correctamente` / `...es rechazada` | `05-control-de-cupo.feature` ✅ |
| Resto (RN-RES-01,02,03,04,07,08,09,10,11,12,13,14) | Sin escenario | Gap |

## 4. Priorización

- **P0:** RN-RES-13 (definir la regla real de negocio para check-in — ¿debe bloquear cancelados/fechas futuras? hoy no está decidido ni en código ni en producto).
- **P1:** RN-RES-11 (ownership de `/admin/bookings`, cero cobertura), RN-RES-09/10 (cancelación, dinero real de por medio), RN-RES-07 (concurrencia real del cupo — ya mitigada parcialmente pero nunca probada con 2 requests simultáneos de verdad).
- **P2:** RN-RES-01/02/03 (validación de entrada API), RN-RES-08.
- **P3 / infraestructura, no QA:** RN-RES-15 (mover rate limiting a algo persistente — Redis/Vercel KV — antes de depender de él contra abuso real).
