# language: es
Característica: Rol Soporte y equipos multi-usuario por operador
  Como SuperAdmin quiero delegar tareas operativas en usuarios de Soporte,
  y como operador agencia quiero delegar tareas en miembros de mi equipo,
  sin darles más acceso del que necesitan.

  @feliz
  Escenario: El SuperAdmin crea un usuario de Soporte con sidebar reducido
    Dado que inicié sesión como SuperAdmin
    Cuando creo un nuevo usuario de Soporte
    Y inicio sesión con las credenciales de ese usuario de Soporte
    Entonces llego al dashboard de administración
    Y el sidebar de Soporte muestra exactamente los ítems "Dashboard, Experiencias, Reservas, Check-in QR, Operadores"

  @feliz
  Escenario: El operador ADMIN agrega un miembro STAFF con acceso limitado
    Dado que tengo una cuenta de operador agencia aprobada y con contrato aceptado
    Cuando agrego un miembro STAFF a mi equipo
    Y inicio sesión con las credenciales de ese miembro STAFF
    Entonces el miembro STAFF llega al panel de su operador
    Y el miembro STAFF no ve "Equipo" en su sidebar

  @negativo
  Escenario: Un miembro STAFF no puede administrar el equipo del operador
    Dado que tengo una cuenta de operador agencia aprobada y con contrato aceptado
    Cuando agrego un miembro STAFF a mi equipo
    Y inicio sesión con las credenciales de ese miembro STAFF
    Y intento ir a la administración de "equipo"
    Entonces soy redirigido fuera de la administración de "equipo"

  @negativo
  Escenario: Un usuario de Soporte no puede administrar categorías
    Dado que inicié sesión como SuperAdmin
    Y creo un nuevo usuario de Soporte
    Cuando inicio sesión con las credenciales de ese usuario de Soporte
    Y intento ir a la administración de "categorías"
    Entonces soy redirigido fuera de la administración de "categorías"
