# language: es
Característica: Seguridad del catálogo público y de la API de experiencias
  Como plataforma, no quiero que operadores sin aprobar puedan publicar
  experiencias reales, ni que el catálogo público exponga operadores o
  experiencias que el equipo de NativaGo nunca verificó.

  @seguridad @P0
  Escenario: Un operador sin aprobar no puede publicar una experiencia llamando la API directamente
    Dado que tengo una cuenta de operador registrada pero sin aprobar
    Cuando envío una petición POST a la API de creación de experiencias con mis propias credenciales
    Entonces la API responde con estado 403
    Y la experiencia no aparece en el catálogo público del marketplace

  @seguridad @P0
  Escenario: El catálogo público no expone experiencias de operadores sin aprobar
    Dado que tengo una cuenta de operador aprobada con una experiencia publicada
    Cuando el equipo de NativaGo suspende mi cuenta de operador
    Entonces mi experiencia ya no aparece en el catálogo público del marketplace

  @seguridad
  Escenario: El catálogo público no expone operadores sin aprobar
    Dado que tengo una cuenta de operador registrada pero sin aprobar
    Cuando consulto la API pública de operadores sin autenticarme
    Entonces mi operador no aparece en la respuesta

  @negativo
  Escenario: Eliminar una categoría en uso falla de forma controlada
    Dado que existe una categoría usada por al menos una experiencia
    Cuando intento eliminar esa categoría forzando la acción
    Entonces la operación falla con un mensaje de negocio
    Y la categoría sigue existiendo
