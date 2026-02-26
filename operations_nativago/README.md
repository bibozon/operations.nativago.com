# Operations NativaGo Backoffice

## Descripción
Plataforma centralizada para la gestión operativa de NativaGo. Incluye panel de control, gestión de experiencias, reservas, operadores, notificaciones, finanzas, auditoría y acceso segmentado por roles.

## Instalación
1. Instala dependencias:
   ```bash
   pip install -r requirements.txt
   ```
2. Ejecuta el servidor:
   ```bash
   uvicorn main:app --reload
   ```

## Estructura
- `routers/`: Endpoints de cada módulo.
- `models/`: Modelos Pydantic y SQLAlchemy.
- `services/`: Lógica de negocio, autenticación, base de datos.

## Principios SOLID
- Separación de responsabilidades.
- Interfaces claras.
- Modularidad y escalabilidad.

## Integración
Preparado para integrarse con sistemas externos y frontend NativaGo.
   ```
4. Ejecutar servidor:
   ```bash
   uvicorn main:app --reload
   ```

## Estructura sugerida
- main.py: punto de entrada de la API
- routers/: rutas para servicios y conexión con Nativago
- models/: modelos de datos
- services/: lógica de negocio y conexión API externa
- .env: variables de entorno (API keys, endpoints)

## Notas
- Reemplazar los valores de ejemplo en .env por los reales.
- Personalizar la autenticación según las necesidades de seguridad.
