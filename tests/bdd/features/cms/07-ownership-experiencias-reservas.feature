# language: es
Característica: Ownership de experiencias y reservas entre operadores
  Como plataforma, no quiero que un operador pueda ver ni modificar
  experiencias o reservas que pertenecen a otro operador.

  @negativo @seguridad
  Escenario: Un operador no puede editar una experiencia de otro operador
    Dado que tengo una cuenta de operador aprobada con una experiencia publicada
    Y existe otra experiencia que pertenece a un operador distinto
    Cuando intento editar esa experiencia ajena por la API
    Entonces la API responde con estado 403
    Y la experiencia ajena no cambia

  @negativo @seguridad
  Escenario: Un operador no puede eliminar una experiencia de otro operador
    Dado que tengo una cuenta de operador aprobada con una experiencia publicada
    Y existe otra experiencia que pertenece a un operador distinto
    Cuando intento eliminar esa experiencia ajena por su formulario
    Entonces la experiencia ajena sigue existiendo

  @negativo @seguridad
  Escenario: Un operador no puede ver reservas de otro operador
    Dado que tengo una cuenta de operador aprobada con una experiencia publicada
    Y existe otra experiencia que pertenece a un operador distinto con una reserva
    Cuando voy a la administración de reservas
    Entonces solo veo reservas de mis propias experiencias

  @negativo
  Escenario: El registro de una experiencia rechaza una ciudad que no pertenece al país del operador
    Dado que tengo una cuenta de operador aprobada con una experiencia publicada
    Cuando intento crear una experiencia con una ciudad de otro país
    Entonces la API responde con estado 400
    Y no se publica ninguna experiencia nueva

  @borde
  Escenario: Eliminar una experiencia con reservas activas no debe romper la página
    Dado que tengo una cuenta de operador aprobada con una experiencia publicada
    Y esa experiencia tiene una reserva activa
    Cuando intento eliminar mi propia experiencia por su formulario
    Entonces veo un mensaje de negocio explicando por qué no se puede eliminar
    Y mi experiencia sigue visible en mi panel
