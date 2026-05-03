# 📦 Sistema de Curier Online

Sistema de seguimiento de paquetes en tiempo real construido con **Node.js**, **Express 5**, **Socket.io** y **MySQL**.  
Incluye autenticación por roles, tracking GPS, historial de seguimiento y una interfaz web SPA sin frameworks.

---

## 📋 Tabla de contenidos

1. [Tecnologías utilizadas](#tecnologías-utilizadas)
2. [Funcionalidades implementadas](#funcionalidades-implementadas)
3. [Requisitos previos](#requisitos-previos)
4. [Instalación paso a paso](#instalación-paso-a-paso)
5. [Configuración de variables de entorno](#configuración-de-variables-de-entorno)
6. [Paquetes npm instalados](#paquetes-npm-instalados)
7. [Base de datos — Tablas y Procedimientos Almacenados](#base-de-datos)
8. [Estructura del proyecto](#estructura-del-proyecto)
9. [API REST — Referencia completa](#api-rest)
10. [Eventos Socket.io](#eventos-socketio)
11. [Roles de usuario](#roles-de-usuario)
12. [Usuarios de prueba](#usuarios-de-prueba)
13. [Ejemplos con curl](#ejemplos-con-curl)

---

## Tecnologías utilizadas

| Capa            | Tecnología                                        | Versión   |
|-----------------|---------------------------------------------------|-----------|
| Entorno         | Node.js                                           | ≥ 18      |
| Servidor HTTP   | Express                                           | ^5.2.1    |
| Tiempo real     | Socket.io                                         | ^4.8.3    |
| Base de datos   | MySQL 8 + mysql2/promise (pool + stored procs)    | ^3.22.3   |
| Sesiones        | express-session                                   | ^1.19.0   |
| Contraseñas     | bcryptjs (hash bcrypt, sal 10)                    | ^3.0.3    |
| Rate limiting   | express-rate-limit                                | ^8.4.1    |
| Variables env   | dotenv                                            | ^17.4.2   |
| Frontend        | HTML5 + CSS3 + JavaScript vanilla + Socket.io CDN | —         |

---

## Funcionalidades implementadas

- ✅ **Registro e inicio de sesión** con contraseña hasheada (bcrypt)
- ✅ **Sistema de roles**: `cliente`, `mensajero`, `admin`
- ✅ **Sesiones HTTP** seguras (`httpOnly`, `sameSite: strict`, `secure` en producción)
- ✅ **Rate limiting** diferenciado: 20 req/15min en auth, 100 req/15min en API
- ✅ **Crear paquetes** con código único autogenerado (`PKG-<timestamp36>-<random>`)
- ✅ **Cambio de estado** de paquetes: `pendiente → en_transito → entregado / cancelado`
- ✅ **Registro de ubicación GPS** (latitud, longitud, descripción) por mensajero/admin
- ✅ **Historial de seguimiento** ordenado por timestamp
- ✅ **Filtrado** de paquetes por estado en el frontend
- ✅ **Actualizaciones en tiempo real** vía Socket.io (nuevo paquete, cambio de estado, nueva ubicación)
- ✅ **SPA frontend** sin frameworks: login/registro, dashboard, detalle de paquete, timeline de seguimiento
- ✅ **8 Procedimientos almacenados** MySQL para todas las operaciones de datos
- ✅ **Validación de inputs** en servidor (campos obligatorios, estados válidos, coords numéricas)

---

## Requisitos previos

Antes de comenzar asegúrate de tener instalado:

| Herramienta | Versión mínima | Verificar con          |
|-------------|---------------|------------------------|
| Node.js     | 18.x          | `node --version`       |
| npm         | 9.x           | `npm --version`        |
| MySQL       | 8.0           | `mysql --version`      |
| Git         | cualquiera    | `git --version`        |

---

## Instalación paso a paso

Sigue **exactamente este orden**:

### Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/DSanchezVargas/Hackaton15.git
cd Hackaton15
```

### Paso 2 — Instalar las dependencias de Node.js

```bash
npm install
```

Este comando descarga todos los paquetes listados en `package.json` dentro de la carpeta `node_modules/`.  
No necesitas instalar nada manualmente; un solo comando trae todo.

> ⏱️ Puede tardar entre 20 y 60 segundos dependiendo de la conexión.

### Paso 3 — Configurar las variables de entorno

```bash
# Copiar la plantilla
cp .env.example .env
```

Luego edita el archivo `.env` con tu editor favorito y completa tus credenciales de MySQL:

```bash
# En Linux/Mac
nano .env

# En Windows (PowerShell)
notepad .env
```

Contenido que debes ajustar:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña_mysql
DB_NAME=curier_db

SESSION_SECRET=cambia_esto_por_una_cadena_secreta_larga

PORT=3000
```

### Paso 4 — Crear la base de datos y los procedimientos almacenados

Ejecuta el script SQL incluido en el proyecto. Esto crea la base de datos, las 3 tablas, los 8 procedimientos almacenados y el usuario admin de prueba:

```bash
# Con contraseña (te pedirá que la ingreses)
mysql -u root -p < database/schema.sql

# Si tu MySQL no tiene contraseña de root
mysql -u root < database/schema.sql
```

Puedes verificar que todo se creó correctamente:

```bash
mysql -u root -p -e "USE curier_db; SHOW TABLES; SHOW PROCEDURE STATUS WHERE Db='curier_db'\G"
```

Deberías ver:

```
+---------------------+
| Tables_in_curier_db |
+---------------------+
| paquetes            |
| seguimiento         |
| usuarios            |
+---------------------+

Name: sp_actualizar_estado_paquete
Name: sp_crear_paquete
Name: sp_crear_usuario
Name: sp_listar_paquetes_remitente
Name: sp_listar_todos_paquetes
Name: sp_obtener_seguimiento
Name: sp_obtener_usuario_email
Name: sp_registrar_ubicacion
```

### Paso 5 — Iniciar el servidor

```bash
npm start
```

Deberías ver en la consola:

```
✅  MySQL conectado correctamente
🚀  Servidor corriendo en http://localhost:3000
```

### Paso 6 — Abrir el navegador

Navega a:

```
http://localhost:3000
```

Inicia sesión con el usuario admin precargado:

| Campo       | Valor             |
|-------------|-------------------|
| Email       | admin@curier.com  |
| Contraseña  | admin123          |

---

## Configuración de variables de entorno

Todas las variables se definen en el archivo `.env` en la raíz del proyecto:

| Variable         | Descripción                                        | Valor por defecto   |
|------------------|----------------------------------------------------|---------------------|
| `DB_HOST`        | Host del servidor MySQL                            | `localhost`         |
| `DB_PORT`        | Puerto MySQL                                       | `3306`              |
| `DB_USER`        | Usuario MySQL                                      | `root`              |
| `DB_PASSWORD`    | Contraseña MySQL                                   | *(vacío)*           |
| `DB_NAME`        | Nombre de la base de datos                         | `curier_db`         |
| `SESSION_SECRET` | Clave secreta para firmar las cookies de sesión    | `curier_secret_2024`|
| `PORT`           | Puerto en el que escucha el servidor Node.js       | `3000`              |
| `NODE_ENV`       | Entorno (`production` activa cookies `secure:true`)| *(no definido)*     |

> ⚠️ **Nunca subas el archivo `.env` a Git.** Ya está en el `.gitignore`.

---

## Paquetes npm instalados

A continuación se explica qué hace cada paquete y por qué se usa:

| Paquete               | Qué hace en este proyecto                                                              |
|-----------------------|----------------------------------------------------------------------------------------|
| `express`             | Framework HTTP principal. Define rutas REST, middleware y sirve archivos estáticos.    |
| `socket.io`           | WebSockets bidireccionales. Emite eventos en tiempo real a todos los clientes conectados. |
| `mysql2`              | Driver MySQL para Node.js con soporte de promesas (`mysql2/promise`) y pool de conexiones. |
| `bcryptjs`            | Hashea contraseñas con bcrypt (sal de 10 rondas) y las compara al hacer login.        |
| `express-session`     | Maneja sesiones del lado del servidor guardadas en memoria; usa cookies `httpOnly`.    |
| `express-rate-limit`  | Limita peticiones por IP para prevenir ataques de fuerza bruta y abuso de la API.     |
| `dotenv`              | Carga las variables del archivo `.env` en `process.env` al arrancar.                  |

Para instalar todos juntos (ya incluido en `npm install`):

```bash
npm install express socket.io mysql2 bcryptjs express-session express-rate-limit dotenv
```

---

## Base de datos

### Tablas

#### `usuarios`

| Columna      | Tipo                                    | Descripción                        |
|--------------|-----------------------------------------|------------------------------------|
| `id`         | INT AUTO_INCREMENT PK                   | Identificador único                |
| `nombre`     | VARCHAR(100) NOT NULL                   | Nombre completo                    |
| `email`      | VARCHAR(150) UNIQUE NOT NULL            | Email (login)                      |
| `password`   | VARCHAR(255) NOT NULL                   | Hash bcrypt de la contraseña       |
| `rol`        | ENUM('cliente','mensajero','admin')     | Rol del usuario                    |
| `activo`     | TINYINT(1) DEFAULT 1                    | Permite desactivar cuentas         |
| `creado_en`  | DATETIME DEFAULT CURRENT_TIMESTAMP      | Fecha de registro                  |

#### `paquetes`

| Columna         | Tipo                                              | Descripción                       |
|-----------------|---------------------------------------------------|-----------------------------------|
| `id`            | INT AUTO_INCREMENT PK                             | Identificador único               |
| `codigo`        | VARCHAR(30) UNIQUE NOT NULL                       | Código generado: `PKG-xxx-xxxx`   |
| `descripcion`   | VARCHAR(255) NOT NULL                             | Descripción del contenido         |
| `remitente_id`  | INT FK → usuarios.id                              | Quién envía el paquete            |
| `destinatario`  | VARCHAR(150) NOT NULL                             | Nombre del destinatario           |
| `direccion_dest`| VARCHAR(255) NOT NULL                             | Dirección de entrega              |
| `mensaje`       | TEXT                                              | Instrucciones opcionales          |
| `estado`        | ENUM('pendiente','en_transito','entregado','cancelado') | Estado actual del paquete  |
| `mensajero_id`  | INT FK → usuarios.id (nullable)                   | Mensajero asignado                |
| `creado_en`     | DATETIME DEFAULT CURRENT_TIMESTAMP                | Fecha de creación                 |
| `actualizado_en`| DATETIME ON UPDATE CURRENT_TIMESTAMP              | Última actualización              |

#### `seguimiento`

| Columna        | Tipo                               | Descripción                          |
|----------------|------------------------------------|--------------------------------------|
| `id`           | INT AUTO_INCREMENT PK              | Identificador único                  |
| `paquete_id`   | INT FK → paquetes.id CASCADE       | Paquete al que pertenece             |
| `latitud`      | DECIMAL(10,7)                      | Latitud GPS (nullable)               |
| `longitud`     | DECIMAL(10,7)                      | Longitud GPS (nullable)              |
| `descripcion`  | VARCHAR(255)                       | Descripción del punto (ej. "Bodega") |
| `registrado_en`| DATETIME DEFAULT CURRENT_TIMESTAMP | Cuándo se registró la ubicación      |

### Procedimientos almacenados (8)

| Nombre                          | Parámetros de entrada                                    | Qué hace                                     |
|---------------------------------|----------------------------------------------------------|----------------------------------------------|
| `sp_crear_usuario`              | nombre, email, password, rol                            | Inserta usuario y retorna su `id`            |
| `sp_obtener_usuario_email`      | email                                                    | Busca usuario activo por email               |
| `sp_crear_paquete`              | codigo, descripcion, remitente_id, destinatario, direccion_dest, mensaje | Crea paquete y retorna `id` |
| `sp_actualizar_estado_paquete`  | id, estado, mensajero_id                                | Cambia estado y asigna mensajero             |
| `sp_registrar_ubicacion`        | paquete_id, latitud, longitud, descripcion              | Agrega punto al historial GPS                |
| `sp_obtener_seguimiento`        | paquete_id                                               | Retorna historial ordenado más reciente primero |
| `sp_listar_paquetes_remitente`  | remitente_id                                             | Lista paquetes de un cliente                 |
| `sp_listar_todos_paquetes`      | *(ninguno)*                                              | Lista todos los paquetes (admin/mensajero)   |

---

## Estructura del proyecto

```
Hackaton15/
│
├── database/
│   └── schema.sql            ← DDL: CREATE DATABASE, 3 tablas, 8 stored procedures, usuario admin
│
├── src/
│   ├── config/
│   │   └── db.js             ← Pool mysql2/promise (conexiones reutilizadas)
│   │
│   ├── middleware/
│   │   └── auth.js           ← requireAuth() y requireRol(...roles) para proteger rutas
│   │
│   ├── models/
│   │   └── queries.js        ← Funciones JS que invocan CALL sp_*() y retornan resultados
│   │
│   └── routes/
│       ├── auth.js           ← POST /registro, POST /login, POST /logout, GET /me
│       └── paquetes.js       ← GET/POST /paquetes, PATCH /:id/estado, POST /:id/ubicacion, GET /:id/seguimiento
│
├── public/                   ← Archivos estáticos servidos por Express
│   ├── index.html            ← SPA: pantalla de login/registro + dashboard
│   ├── css/
│   │   └── styles.css        ← Estilos completos (sin frameworks)
│   └── js/
│       └── app.js            ← Lógica del frontend + conexión Socket.io
│
├── server.js                 ← Punto de entrada: Express + Socket.io + sesiones + rate limiting
├── .env.example              ← Plantilla de variables de entorno
├── .gitignore
├── package.json
└── README.md
```

---

## API REST

### Autenticación

#### `POST /api/auth/registro` — Registrar nuevo usuario

**Body JSON:**
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "password": "miContraseña123",
  "rol": "cliente"
}
```
> `rol` acepta: `"cliente"` o `"mensajero"`. Cualquier otro valor queda como `"cliente"`.

**Respuesta exitosa (201):**
```json
{
  "mensaje": "Usuario creado",
  "usuario": { "id": 3, "nombre": "Juan Pérez", "email": "juan@ejemplo.com", "rol": "cliente" }
}
```

---

#### `POST /api/auth/login` — Iniciar sesión

**Body JSON:**
```json
{
  "email": "juan@ejemplo.com",
  "password": "miContraseña123"
}
```

**Respuesta exitosa (200):**
```json
{
  "mensaje": "Login exitoso",
  "usuario": { "id": 3, "nombre": "Juan Pérez", "email": "juan@ejemplo.com", "rol": "cliente" }
}
```

---

#### `POST /api/auth/logout` — Cerrar sesión

Sin body. Destruye la sesión del servidor.

**Respuesta (200):**
```json
{ "mensaje": "Sesión cerrada" }
```

---

#### `GET /api/auth/me` — Ver sesión activa

Sin body. Devuelve el usuario de la sesión actual.

**Respuesta (200):**
```json
{ "usuario": { "id": 3, "nombre": "Juan Pérez", "email": "juan@ejemplo.com", "rol": "cliente" } }
```

---

### Paquetes

#### `GET /api/paquetes` — Listar paquetes

- **Cliente:** ve solo sus propios paquetes.  
- **Mensajero / Admin:** ve todos los paquetes.

**Respuesta (200):** array de paquetes con campos: `id`, `codigo`, `descripcion`, `destinatario`, `direccion_dest`, `mensaje`, `estado`, `creado_en`, `actualizado_en`, `remitente_nombre`, `mensajero_nombre`.

---

#### `POST /api/paquetes` — Crear paquete

**Roles permitidos:** `cliente`, `admin`

**Body JSON:**
```json
{
  "descripcion": "Caja de libros",
  "destinatario": "Ana García",
  "direccion_dest": "Calle 45 #12-30, Bogotá",
  "mensaje": "Frágil, no voltear"
}
```

**Respuesta exitosa (201):**
```json
{
  "mensaje": "Paquete creado",
  "id": 1,
  "codigo": "PKG-MOPDLJHU-B449"
}
```
> El código se genera automáticamente con timestamp en base 36 + sufijo aleatorio.

---

#### `PATCH /api/paquetes/:id/estado` — Actualizar estado

**Roles permitidos:** `mensajero`, `admin`

**Body JSON:**
```json
{ "estado": "en_transito" }
```
> Estados válidos: `pendiente`, `en_transito`, `entregado`, `cancelado`

**Respuesta (200):**
```json
{ "mensaje": "Estado actualizado", "estado": "en_transito" }
```
> Al cambiar el estado, se emite automáticamente el evento `paquete:estado` por Socket.io.

---

#### `POST /api/paquetes/:id/ubicacion` — Registrar ubicación GPS

**Roles permitidos:** `mensajero`, `admin`

**Body JSON:**
```json
{
  "latitud": 4.6482837,
  "longitud": -74.1079965,
  "descripcion": "Bodega central norte"
}
```
> `latitud` y `longitud` son opcionales (pueden enviarse sin coordenadas GPS).

**Respuesta (201):**
```json
{ "mensaje": "Ubicación registrada", "id": 5 }
```

---

#### `GET /api/paquetes/:id/seguimiento` — Historial de ubicaciones

**Roles permitidos:** todos los autenticados

**Respuesta (200):** array ordenado del más reciente al más antiguo:
```json
[
  {
    "id": 5,
    "latitud": "4.6482837",
    "longitud": "-74.1079965",
    "descripcion": "Bodega central norte",
    "registrado_en": "2026-05-03T06:15:00.000Z",
    "codigo": "PKG-MOPDLJHU-B449",
    "estado": "en_transito",
    "destinatario": "Ana García"
  }
]
```

---

## Eventos Socket.io

El servidor emite eventos en tiempo real a todos los clientes conectados cuando ocurren cambios.

| Evento              | Dirección         | Cuándo se dispara               | Payload principal                              |
|---------------------|-------------------|---------------------------------|------------------------------------------------|
| `paquete:nuevo`     | Servidor → Todos  | Se crea un paquete              | `{ id, codigo, descripcion, destinatario, estado }` |
| `paquete:estado`    | Servidor → Todos  | Se actualiza el estado          | `{ id, estado }`                               |
| `paquete:ubicacion` | Servidor → Todos  | Se registra una ubicación GPS   | `{ paquete_id, latitud, longitud, descripcion, registrado_en }` |
| `seguir:paquete`    | Cliente → Servidor| El cliente quiere suscribirse   | `paqueteId` (número)                           |

**Ejemplo de uso en el frontend:**
```javascript
const socket = io();

// Escuchar cambios de estado
socket.on('paquete:estado', (data) => {
  console.log(`Paquete #${data.id} ahora está: ${data.estado}`);
});

// Suscribirse a un paquete específico
socket.emit('seguir:paquete', 1);
```

---

## Roles de usuario

| Rol         | Puede crear paquetes | Ver paquetes      | Cambiar estado | Registrar ubicación |
|-------------|---------------------|-------------------|----------------|---------------------|
| `cliente`   | ✅ (propios)         | Solo los propios  | ❌             | ❌                  |
| `mensajero` | ❌                   | Todos             | ✅             | ✅                  |
| `admin`     | ✅                   | Todos             | ✅             | ✅                  |

> El rol `admin` no se puede seleccionar en el formulario de registro. Se asigna directamente en la base de datos.

---

## Usuarios de prueba

| Email             | Contraseña | Rol   | Cómo se creó               |
|-------------------|-----------|-------|----------------------------|
| admin@curier.com  | admin123  | admin | Precargado en `schema.sql` |

Para crear usuarios de prueba adicionales usa el endpoint de registro o inserta directamente en MySQL:

```sql
-- Crear mensajero de prueba (password: mensajero123)
INSERT INTO curier_db.usuarios (nombre, email, password, rol)
VALUES ('Mensajero Demo', 'mensajero@curier.com',
        '$2b$10$...hash_generado_con_bcrypt...', 'mensajero');
```

---

## Ejemplos con curl

Puedes probar la API directamente desde la terminal. Los comandos guardan la cookie de sesión en un archivo temporal.

```bash
# 1. Registro de nuevo cliente
curl -c cookies.txt -X POST http://localhost:3000/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Carlos","email":"carlos@test.com","password":"test123","rol":"cliente"}'

# 2. Login (guarda la sesión en cookies.txt)
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@curier.com","password":"admin123"}'

# 3. Ver sesión activa
curl -b cookies.txt http://localhost:3000/api/auth/me

# 4. Crear paquete
curl -b cookies.txt -X POST http://localhost:3000/api/paquetes \
  -H "Content-Type: application/json" \
  -d '{"descripcion":"Laptop","destinatario":"Maria","direccion_dest":"Calle 10 #5-20","mensaje":"Cuidado"}'

# 5. Listar paquetes
curl -b cookies.txt http://localhost:3000/api/paquetes

# 6. Cambiar estado del paquete #1 (requiere rol mensajero o admin)
curl -b cookies.txt -X PATCH http://localhost:3000/api/paquetes/1/estado \
  -H "Content-Type: application/json" \
  -d '{"estado":"en_transito"}'

# 7. Registrar ubicación GPS
curl -b cookies.txt -X POST http://localhost:3000/api/paquetes/1/ubicacion \
  -H "Content-Type: application/json" \
  -d '{"latitud":4.6482837,"longitud":-74.1079965,"descripcion":"Centro de distribución"}'

# 8. Ver historial de seguimiento
curl -b cookies.txt http://localhost:3000/api/paquetes/1/seguimiento

# 9. Cerrar sesión
curl -b cookies.txt -X POST http://localhost:3000/api/auth/logout
```

---

## Seguridad implementada

| Medida                  | Detalles                                                                 |
|-------------------------|--------------------------------------------------------------------------|
| Hash de contraseñas     | bcrypt con sal de 10 rondas — nunca se guarda la contraseña en texto plano |
| Cookies seguras         | `httpOnly: true`, `sameSite: strict`, `secure: true` en producción       |
| Rate limiting en auth   | Máximo 20 peticiones por IP cada 15 minutos en rutas `/api/auth/*`       |
| Rate limiting en API    | Máximo 100 peticiones por IP cada 15 minutos en rutas `/api/paquetes/*`  |
| Autorización por roles  | Middleware `requireRol()` protege rutas sensibles                        |
| Validación de inputs    | Campos obligatorios, estados enumerados, coordenadas numéricas validadas |
