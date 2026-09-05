# language: es
Característica: Autenticación en el CMS
  Como usuario del CMS (SuperAdmin, Soporte u Operador)
  Quiero iniciar sesión con mis credenciales
  Para acceder al panel que corresponde a mi rol

  @feliz
  Escenario: Inicio de sesión exitoso como SuperAdmin
    Dado que estoy en la página de inicio de sesión del CMS
    Cuando ingreso el email "admin@nativago.com" y la contraseña "nativago123"
    Y envío el formulario de inicio de sesión
    Entonces soy redirigido al panel de administración

  @negativo
  Escenario: El inicio de sesión falla con una contraseña incorrecta
    Dado que estoy en la página de inicio de sesión del CMS
    Cuando ingreso el email "admin@nativago.com" y la contraseña "clave-incorrecta"
    Y envío el formulario de inicio de sesión
    Entonces veo el mensaje de error "Invalid credentials"
    Y permanezco en la página de inicio de sesión

  @negativo
  Escenario: El inicio de sesión falla con un usuario que no existe
    Dado que estoy en la página de inicio de sesión del CMS
    Cuando ingreso el email "no-existe-nunca@e2e.nativago.com" y la contraseña "cualquiera123"
    Y envío el formulario de inicio de sesión
    Entonces veo el mensaje de error "Invalid credentials"
    Y permanezco en la página de inicio de sesión

  @negativo
  Escenario: La API de login rechaza una petición sin email ni contraseña
    Cuando envío una petición a la API de login sin email ni contraseña
    Entonces la API responde con estado 400 y el mensaje "Email and password are required"

  @borde
  Escenario: Una cookie de sesión inválida no da acceso al panel
    Dado que tengo una cookie de sesión inválida
    Cuando intento entrar al dashboard de administración
    Entonces soy redirigido a la página de inicio de sesión

  @negativo @seguridad @P1
  Escenario: La API de login bloquea intentos repetidos de fuerza bruta
    Cuando envío 15 intentos de login consecutivos con la misma contraseña incorrecta
    Entonces alguno de los intentos responde con estado 429
