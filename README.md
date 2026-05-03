# 📦 Sistema de Curier Online

Sistema de curier en tiempo real construido con **Node.js**, **Express**, **Socket.io** y **MySQL**.

## Tecnologías

| Capa        | Tecnología                              |
|-------------|----------------------------------------|
| Servidor    | Node.js + Express 5                    |
| Tiempo real | Socket.io                              |
| Base datos  | MySQL (pool + procedimientos almacenados) |
| Sesiones    | express-session                        |
| Auth        | bcryptjs (hash de contraseñas)         |
| Frontend    | HTML5 + CSS3 + JavaScript vanilla      |

## Funcionalidades

- **Registro e inicio de sesión** con roles: `cliente`, `mensajero`, `admin`
- **Crear paquetes** con código único autogenerado, descripción, destinatario, dirección y mensaje
- **Seguimiento en tiempo real** vía Socket.io: actualizaciones de estado y ubicación GPS
- **Historial de ubicaciones** con latitud, longitud, descripción y timestamp
- **Filtrado** de paquetes por estado
- **Procedimientos almacenados** MySQL para todas las operaciones de datos

## Requisitos

- Node.js ≥ 18
- MySQL ≥ 8.0

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/DSanchezVargas/Hackaton15.git
cd Hackaton15

# 2. Instalar dependencias
npm install

# 3. Crear la base de datos
mysql -u root -p < database/schema.sql

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de MySQL

# 5. Iniciar servidor
npm start
```

Abrir el navegador en **http://localhost:3000**

## Variables de entorno (`.env`)

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=curier_db

SESSION_SECRET=cambia_esto_en_produccion

PORT=3000
```

## Usuario de prueba

| Email              | Contraseña | Rol   |
|--------------------|-----------|-------|
| admin@curier.com   | admin123  | admin |

## API REST

| Método | Ruta                              | Descripción                    | Roles               |
|--------|-----------------------------------|--------------------------------|---------------------|
| POST   | /api/auth/registro                | Crear cuenta                   | Público             |
| POST   | /api/auth/login                   | Iniciar sesión                 | Público             |
| POST   | /api/auth/logout                  | Cerrar sesión                  | Autenticado         |
| GET    | /api/auth/me                      | Obtener sesión actual          | Autenticado         |
| GET    | /api/paquetes                     | Listar paquetes                | Autenticado         |
| POST   | /api/paquetes                     | Crear paquete                  | Cliente / Admin     |
| PATCH  | /api/paquetes/:id/estado          | Cambiar estado                 | Mensajero / Admin   |
| POST   | /api/paquetes/:id/ubicacion       | Registrar ubicación GPS        | Mensajero / Admin   |
| GET    | /api/paquetes/:id/seguimiento     | Historial de ubicaciones       | Autenticado         |

## Eventos Socket.io

| Evento               | Dirección        | Descripción                                  |
|----------------------|------------------|----------------------------------------------|
| `paquete:nuevo`      | Server → Clientes | Se creó un nuevo paquete                    |
| `paquete:estado`     | Server → Clientes | El estado de un paquete cambió              |
| `paquete:ubicacion`  | Server → Clientes | Se registró una nueva ubicación GPS         |
| `seguir:paquete`     | Cliente → Server  | Suscribirse a updates de un paquete         |

## Estructura del proyecto

```
Hackaton15/
├── database/
│   └── schema.sql          # DDL + Procedimientos almacenados
├── src/
│   ├── config/
│   │   └── db.js           # Pool de conexiones MySQL
│   ├── middleware/
│   │   └── auth.js         # Middleware de autenticación/autorización
│   ├── models/
│   │   └── queries.js      # Funciones que invocan stored procedures
│   └── routes/
│       ├── auth.js         # Rutas de autenticación
│       └── paquetes.js     # Rutas de paquetes / seguimiento
├── public/
│   ├── index.html          # SPA frontend
│   ├── css/styles.css
│   └── js/app.js           # Lógica cliente (Socket.io)
├── server.js               # Punto de entrada principal
├── .env.example
└── package.json
```
