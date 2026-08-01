# language: es
Característica: Registro, aprobación y primera publicación de un operador
  Como operador turístico en Colombia o Brasil
  Quiero registrarme, ser verificado y publicar mi primera experiencia
  Para poder recibir reservas a través de NativaGo

  @feliz
  Esquema del escenario: Un operador se registra, es aprobado y publica su primera experiencia
    Dado los datos de un nuevo operador con perfil "<perfil>"
    Cuando completo el formulario de registro de operador con esos datos
    Entonces llego a mi panel de operador con estado "DRAFT" y progreso mayor a 0%
    Cuando envío mi cuenta para revisión
    Entonces mi panel muestra el estado "PENDING"
    Cuando el equipo de NativaGo aprueba mi cuenta
    Y vuelvo a mi panel de operador
    Y acepto el contrato de intermediación
    Entonces llego al panel completo de operador
    Cuando publico mi primera experiencia con los datos del perfil
    Entonces la experiencia aparece en la lista de mi panel

    Ejemplos:
      | perfil       |
      | CO jurídica  |
      | CO natural   |
      | BR natural   |
      | BR jurídica  |

  @negativo
  Escenario: El equipo de NativaGo pide información adicional en vez de aprobar
    Dado los datos de un nuevo operador con perfil "CO natural"
    Cuando completo el formulario de registro de operador con esos datos
    Y envío mi cuenta para revisión
    Y el equipo de NativaGo me pide información adicional con la nota "Falta el documento de identidad legible"
    Entonces mi panel muestra el estado "INFO_NEEDED"
    Y mi panel muestra la nota "Falta el documento de identidad legible"

  @negativo
  Escenario: El registro falla si falta un campo obligatorio
    Dado que estoy en el formulario de registro de operador
    Cuando completo el formulario de registro dejando el nombre vacío
    Y envío el formulario de registro
    Entonces veo el mensaje de error "Completa todos los campos obligatorios."

  @negativo
  Escenario: El registro falla con una contraseña de menos de 8 caracteres
    Dado que estoy en el formulario de registro de operador
    Cuando completo el formulario de registro con la contraseña "corta1"
    Y envío el formulario de registro
    Entonces veo el mensaje de error "La contraseña debe tener al menos 8 caracteres."

  @negativo
  Escenario: El registro falla si el email ya está registrado
    Dado que ya existe una cuenta de operador registrada
    Cuando intento registrar un nuevo operador con ese mismo email
    Y envío el formulario de registro
    Entonces veo el mensaje de error "Este email ya está registrado. Inicia sesión en /login."

  @negativo
  Escenario: Un operador sin aprobar no llega al formulario de crear experiencias
    Dado los datos de un nuevo operador con perfil "CO natural"
    Cuando completo el formulario de registro de operador con esos datos
    Y voy a la página de crear una nueva experiencia
    Entonces no veo el formulario de creación de experiencias
