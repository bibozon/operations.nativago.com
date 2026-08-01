# language: es
Característica: Control de cupo al crear reservas
  Como plataforma, no quiero permitir que la suma de personas reservadas
  para una misma experiencia y fecha supere el cupo máximo configurado.

  Antecedentes:
    Dado que inicié sesión como SuperAdmin
    Y existe una experiencia publicada con cupo máximo de 2 personas

  @feliz
  Escenario: Una reserva dentro del cupo disponible se crea correctamente
    Cuando envío una reserva para 2 personas a la API de reservas
    Entonces la API responde con estado 201 y un código de reserva

  @negativo
  Escenario: Una reserva que excede el cupo disponible es rechazada
    Dado que ya reservé 2 personas para esa experiencia y fecha
    Cuando envío una reserva para 1 persona a la API de reservas
    Entonces la API responde con estado 409 y el mensaje "No quedan cupos disponibles para esta fecha."
