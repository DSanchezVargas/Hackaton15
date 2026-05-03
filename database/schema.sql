-- ============================================================
-- Sistema de Curier Online - Schema MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS curier_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE curier_db;

-- Tabla de usuarios (clientes y mensajeros)
CREATE TABLE IF NOT EXISTS usuarios (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100)        NOT NULL,
  email       VARCHAR(150)        NOT NULL UNIQUE,
  password    VARCHAR(255)        NOT NULL,
  rol         ENUM('cliente','mensajero','admin') NOT NULL DEFAULT 'cliente',
  activo      TINYINT(1)          NOT NULL DEFAULT 1,
  creado_en   DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB;

-- Tabla de paquetes
CREATE TABLE IF NOT EXISTS paquetes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  codigo          VARCHAR(30)     NOT NULL UNIQUE,
  descripcion     VARCHAR(255)    NOT NULL,
  remitente_id    INT             NOT NULL,
  destinatario    VARCHAR(150)    NOT NULL,
  direccion_dest  VARCHAR(255)    NOT NULL,
  mensaje         TEXT,
  estado          ENUM('pendiente','en_transito','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
  mensajero_id    INT,
  creado_en       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_remitente  FOREIGN KEY (remitente_id)  REFERENCES usuarios(id),
  CONSTRAINT fk_mensajero  FOREIGN KEY (mensajero_id)  REFERENCES usuarios(id),
  INDEX idx_codigo  (codigo),
  INDEX idx_estado  (estado),
  INDEX idx_remitente (remitente_id)
) ENGINE=InnoDB;

-- Tabla de seguimiento / ubicaciones
CREATE TABLE IF NOT EXISTS seguimiento (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  paquete_id    INT             NOT NULL,
  latitud       DECIMAL(10,7),
  longitud      DECIMAL(10,7),
  descripcion   VARCHAR(255),
  registrado_en DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_paquete FOREIGN KEY (paquete_id) REFERENCES paquetes(id) ON DELETE CASCADE,
  INDEX idx_paquete (paquete_id)
) ENGINE=InnoDB;

-- ============================================================
-- Procedimientos almacenados
-- ============================================================

DELIMITER $$

-- Crear usuario
CREATE PROCEDURE IF NOT EXISTS sp_crear_usuario(
  IN p_nombre    VARCHAR(100),
  IN p_email     VARCHAR(150),
  IN p_password  VARCHAR(255),
  IN p_rol       VARCHAR(20)
)
BEGIN
  INSERT INTO usuarios (nombre, email, password, rol)
  VALUES (p_nombre, p_email, p_password, p_rol);
  SELECT LAST_INSERT_ID() AS id;
END$$

-- Obtener usuario por email
CREATE PROCEDURE IF NOT EXISTS sp_obtener_usuario_email(
  IN p_email VARCHAR(150)
)
BEGIN
  SELECT id, nombre, email, password, rol, activo
  FROM usuarios
  WHERE email = p_email AND activo = 1
  LIMIT 1;
END$$

-- Crear paquete
CREATE PROCEDURE IF NOT EXISTS sp_crear_paquete(
  IN p_codigo         VARCHAR(30),
  IN p_descripcion    VARCHAR(255),
  IN p_remitente_id   INT,
  IN p_destinatario   VARCHAR(150),
  IN p_direccion_dest VARCHAR(255),
  IN p_mensaje        TEXT
)
BEGIN
  INSERT INTO paquetes (codigo, descripcion, remitente_id, destinatario, direccion_dest, mensaje)
  VALUES (p_codigo, p_descripcion, p_remitente_id, p_destinatario, p_direccion_dest, p_mensaje);
  SELECT LAST_INSERT_ID() AS id;
END$$

-- Actualizar estado de paquete
CREATE PROCEDURE IF NOT EXISTS sp_actualizar_estado_paquete(
  IN p_id           INT,
  IN p_estado       VARCHAR(20),
  IN p_mensajero_id INT
)
BEGIN
  UPDATE paquetes
  SET estado = p_estado,
      mensajero_id = COALESCE(p_mensajero_id, mensajero_id)
  WHERE id = p_id;
  SELECT ROW_COUNT() AS afectados;
END$$

-- Registrar ubicacion
CREATE PROCEDURE IF NOT EXISTS sp_registrar_ubicacion(
  IN p_paquete_id  INT,
  IN p_latitud     DECIMAL(10,7),
  IN p_longitud    DECIMAL(10,7),
  IN p_descripcion VARCHAR(255)
)
BEGIN
  INSERT INTO seguimiento (paquete_id, latitud, longitud, descripcion)
  VALUES (p_paquete_id, p_latitud, p_longitud, p_descripcion);
  SELECT LAST_INSERT_ID() AS id;
END$$

-- Obtener historial de seguimiento de un paquete
CREATE PROCEDURE IF NOT EXISTS sp_obtener_seguimiento(
  IN p_paquete_id INT
)
BEGIN
  SELECT s.id, s.latitud, s.longitud, s.descripcion, s.registrado_en,
         p.codigo, p.estado, p.destinatario
  FROM seguimiento s
  JOIN paquetes p ON p.id = s.paquete_id
  WHERE s.paquete_id = p_paquete_id
  ORDER BY s.registrado_en DESC;
END$$

-- Listar paquetes de un remitente
CREATE PROCEDURE IF NOT EXISTS sp_listar_paquetes_remitente(
  IN p_remitente_id INT
)
BEGIN
  SELECT p.id, p.codigo, p.descripcion, p.destinatario, p.direccion_dest,
         p.mensaje, p.estado, p.creado_en, p.actualizado_en,
         u.nombre AS mensajero_nombre
  FROM paquetes p
  LEFT JOIN usuarios u ON u.id = p.mensajero_id
  WHERE p.remitente_id = p_remitente_id
  ORDER BY p.creado_en DESC;
END$$

-- Listar todos los paquetes (admin / mensajero)
CREATE PROCEDURE IF NOT EXISTS sp_listar_todos_paquetes()
BEGIN
  SELECT p.id, p.codigo, p.descripcion, p.destinatario, p.direccion_dest,
         p.mensaje, p.estado, p.creado_en, p.actualizado_en,
         ur.nombre AS remitente_nombre,
         um.nombre AS mensajero_nombre
  FROM paquetes p
  JOIN  usuarios ur ON ur.id = p.remitente_id
  LEFT JOIN usuarios um ON um.id = p.mensajero_id
  ORDER BY p.creado_en DESC;
END$$

DELIMITER ;

-- Usuario admin de prueba  (password: admin123)
INSERT IGNORE INTO usuarios (nombre, email, password, rol)
VALUES ('Administrador', 'admin@curier.com',
        '$2b$10$RdKmeu1Qd5G9oTCFxGMT../KeyNXyJV2.O9PYW7X/i/YOf.DAasVK', 'admin');
