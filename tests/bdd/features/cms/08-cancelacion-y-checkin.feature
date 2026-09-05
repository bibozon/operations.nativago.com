# language: es
Característica: Cancelación de reservas y check-in
  Como plataforma, quiero reglas claras y consistentes sobre cuándo una
  reserva puede cancelarse y cuándo una reserva cancelada puede hacer check-in.

  Antecedentes:
    Dado que inicié sesión como SuperAdmin
    Y existe una experiencia publicada con cupo máximo de 2 personas

  @negativo
  Escenario: No se puede reservar sin email de contacto
    Cuando envío una reserva sin email de contacto a la API de reservas
    Entonces la API responde con estado 400

  @negativo
  Escenario: No se puede reservar con 0 personas
    Cuando envío una reserva para 0 personas a la API de reservas
    Entonces la API responde con estado 400

  @borde
  Esquema del escenario: El número de personas se acota a un rango razonable
    Dado que existe una experiencia publicada sin límite de cupo
    Cuando envío una reserva para <guests> personas a la API de reservas
    Entonces la API acepta la reserva con <guests_efectivos> personas

    Ejemplos:
      | guests | guests_efectivos |
      | -5     | 1                |
      | 500    | 50               |

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

  @borde
  Escenario: El check-in de una reserva cancelada es rechazado
    Dado que tengo una reserva ya cancelada
    Cuando intento hacer check-in de esa reserva
    Entonces el check-in es rechazado con un mensaje de negocio
