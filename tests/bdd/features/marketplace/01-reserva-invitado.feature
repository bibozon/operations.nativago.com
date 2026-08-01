# language: es
Característica: Reserva de una experiencia como invitado
  Como viajero sin cuenta
  Quiero explorar el catálogo y reservar una experiencia
  Para asegurar mi cupo sin necesidad de registrarme primero

  @feliz
  Escenario: Un invitado navega el catálogo y abre una experiencia
    Dado que estoy en el catálogo del marketplace
    Cuando abro la primera experiencia disponible
    Entonces veo el título de la experiencia en la página de detalle

  @feliz
  Escenario: Un invitado agrega una experiencia al carrito
    Dado que estoy en la página de detalle de una experiencia
    Cuando agrego la experiencia al carrito
    Entonces el botón confirma que la experiencia quedó en el carrito

  @feliz
  Escenario: Un invitado completa una reserva de principio a fin
    Dado que estoy en la página de detalle de una experiencia
    Cuando agrego la experiencia al carrito
    Y voy al carrito
    Entonces veo la experiencia en el resumen de mi carrito
    Cuando continúo hacia el formulario de reserva
    Y completo mis datos de invitado y acepto los términos
    Y confirmo la reserva
    Entonces veo la confirmación "¡Reserva registrada!"
    Y veo mi email de confirmación en la pantalla

  @negativo
  Esquema del escenario: El formulario de reserva no se envía si falta un campo obligatorio
    Dado que estoy en el formulario de reserva de una experiencia
    Cuando completo el formulario de reserva sin "<campo>"
    Y confirmo la reserva
    Entonces veo el mensaje de error "<mensaje>"

    Ejemplos:
      | campo                      | mensaje                                      |
      | la fecha                   | Selecciona una fecha                         |
      | el nombre                  | El nombre es obligatorio                     |
      | el email                   | El email es obligatorio                      |
      | la aceptación de términos  | Acepta los términos y política de privacidad |
