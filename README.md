# Roperito Backend

Este repositorio contiene el código del backend para la aplicación Roperito.

> **Nota**: Este proyecto de backend está actualmente en desarrollo. Algunas funcionalidades pueden estar incompletas o sujetas a cambios.

## Requisitos previos

- Node.js (versión recomendada: 14.x o superior)
- PostgreSQL (versión recomendada: 12 o superior)
- Cuenta de Firebase (para almacenamiento de archivos)

## Instalación

1. Clonar el repositorio:
   ```
   git clone https://github.com/KrysthelTassoni/Roperito_backend.git

2. Instalar dependencias:
   ```
   npm install
   ```
3. Configurar la base de datos (ver sección "Configuración de la base de datos" y el init.sql del proyecto)

4. Configurar Firebase (ver sección "Configuración de Firebase")

5. Iniciar el servidor:
   ```
   npm run dev
   ```

## Configuración de la base de datos

El proyecto utiliza PostgreSQL como base de datos. Para configurar la conexión, debes crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=roperito
```
### Datos necesarios para los tests

Para que los tests funcionen correctamente, es necesario tener los siguientes datos en la base de datos:

 **Usuario para pruebas**:
   - Email: user1@gmail.com
   - Contraseña: 123456

## Configuración de Firebase

Este proyecto utiliza Firebase Storage para almacenar imágenes. Por razones de seguridad, el archivo de credenciales de Firebase (`roperito-4d180-firebase-adminsdk-fbsvc-ae4aa8ac1e.json`) no está incluido en el repositorio.

Para configurar Firebase en tu entorno local:

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Ve a Configuración del proyecto > Cuentas de servicio
3. Genera una nueva clave privada (esto descargará un archivo JSON)
4. Guarda este archivo en la raíz del proyecto con el nombre `roperito-4d180-firebase-adminsdk-fbsvc-ae4aa8ac1e.json`

Alternativamente, puedes modificar el archivo `firebase.js` para usar tu propio archivo de credenciales:

```javascript
// firebase.js
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

// Cambia esta ruta al nombre de tu archivo de credenciales
const serviceAccount = "./tu-archivo-credenciales.json"; 

const app = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: "tu-bucket-id.appspot.com", // Actualiza con tu bucket ID
});

const bucket = getStorage(app);

export { bucket };
```
## Ejecutar tests

Para ejecutar los tests:

```
npm run test
```
## Estructura del proyecto

- `app.js`: Punto de entrada principal
- `config/`: Configuraciones (base de datos, etc.)
- `controllers/`: Controladores para las rutas API
- `middlewares/`: Middlewares personalizados
- `routes/`: Definiciones de rutas API
- `tests/`: Tests automatizados
