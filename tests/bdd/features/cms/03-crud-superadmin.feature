# language: es
Característica: CRUD de SuperAdmin en el CMS
  Como SuperAdmin del CMS
  Quiero administrar categorías, ciudades, operadores y experiencias
  Para mantener el catálogo de NativaGo al día

  Antecedentes:
    Dado que inicié sesión como SuperAdmin

  @feliz
  Escenario: El dashboard muestra un solo menú lateral, sin sidebar duplicado
    Cuando voy al dashboard de administración
    Entonces veo un único menú lateral

  @feliz
  Escenario: Crear, listar y eliminar una categoría
    Dado que estoy en la administración de categorías
    Cuando creo la categoría "Categoría E2E BDD"
    Entonces la categoría "Categoría E2E BDD" aparece en la lista
    Cuando elimino la categoría "Categoría E2E BDD"
    Entonces la categoría "Categoría E2E BDD" ya no aparece en la lista

  @feliz
  Escenario: Crear, listar y eliminar una ciudad
    Dado que estoy en la administración de ciudades
    Cuando creo la ciudad "Ciudad E2E BDD" con el primer país disponible
    Entonces la ciudad "Ciudad E2E BDD" aparece en la lista
    Cuando elimino la ciudad "Ciudad E2E BDD"
    Entonces la ciudad "Ciudad E2E BDD" ya no aparece en la lista

  @feliz
  Escenario: Editar un operador y alternar su estado Activar/Desactivar
    Dado que estoy en la administración de operadores
    Cuando edito el teléfono del primer operador de la lista
    Entonces el cambio de teléfono se guarda correctamente
    Cuando alterno el estado Activar/Desactivar de ese operador
    Entonces el estado del operador cambia en la lista

  @feliz
  Escenario: "Nueva experiencia" funciona para SuperAdmin con selector de operador
    Dado que estoy en la administración de experiencias
    Cuando hago clic en "Nueva experiencia"
    Entonces llego al formulario de creación con un selector de operador

  @negativo
  Escenario: Crear una categoría con nombre vacío no crea nada
    Dado que estoy en la administración de categorías
    Cuando intento crear una categoría con nombre vacío
    Entonces no se agrega ninguna fila nueva a la lista de categorías

  @negativo
  Escenario: Crear una ciudad con nombre vacío no crea nada
    Dado que estoy en la administración de ciudades
    Cuando intento crear una ciudad con nombre vacío
    Entonces no se agrega ninguna fila nueva a la lista de ciudades
