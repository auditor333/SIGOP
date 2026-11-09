-- diseño de base de datos
-- sistema de Gestión de Operaciones - Contraloría Stellantis
-- motor sugerido: Microsoft SQL Server
-- nota: este script representa el diseño relacional del sistema.
-- en la implementación final sobre Power Apps, estas entidades
-- se materializan como listas de SharePoint, que funcionan de
-- manera análoga a estas tablas.

-- tabla de usuarios del área
CREATE TABLE Usuarios (
    id_usuario      INT IDENTITY(1,1) PRIMARY KEY,
    nombre          NVARCHAR(100) NOT NULL,
    rol             NVARCHAR(50)  NOT NULL,   -- contralor, Supervisora, Especialista, Analista, Becaria
    puede_asignar   BIT NOT NULL DEFAULT 0    -- 1 = puede asignar tareas a otros
);

-- tabla de operaciones (catálogo de actividades)
CREATE TABLE Operaciones (
    id_operacion    INT IDENTITY(1,1) PRIMARY KEY,
    nombre          NVARCHAR(150) NOT NULL,
    frecuencia      NVARCHAR(30)  NOT NULL,   -- diaria, Semanal, Mensual, Quincenal, Esporádica
    dia             NVARCHAR(30),
    resumen         NVARCHAR(400),
    enlace          NVARCHAR(300),            -- ruta al archivo o sistema
    id_responsable  INT NOT NULL,
    CONSTRAINT FK_Operacion_Responsable
        FOREIGN KEY (id_responsable) REFERENCES Usuarios(id_usuario)
);

-- tabla de ejecuciones (historial de cada vez que se realiza una operación)
CREATE TABLE Ejecuciones (
    id_ejecucion    INT IDENTITY(1,1) PRIMARY KEY,
    id_operacion    INT NOT NULL,
    id_usuario      INT NOT NULL,             -- quién la ejecutó
    fecha           DATE NOT NULL,
    estado          NVARCHAR(30) NOT NULL,    -- pendiente, En proceso, Completada
    comentarios     NVARCHAR(400),
    CONSTRAINT FK_Ejecucion_Operacion
        FOREIGN KEY (id_operacion) REFERENCES Operaciones(id_operacion),
    CONSTRAINT FK_Ejecucion_Usuario
        FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
);

-- tabla de guías de procedimiento (una por operación)
CREATE TABLE Guias (
    id_guia         INT IDENTITY(1,1) PRIMARY KEY,
    id_operacion    INT NOT NULL,
    titulo          NVARCHAR(150) NOT NULL,
    CONSTRAINT FK_Guia_Operacion
        FOREIGN KEY (id_operacion) REFERENCES Operaciones(id_operacion)
);

-- tabla de pasos de cada guía
CREATE TABLE PasosGuia (
    id_paso         INT IDENTITY(1,1) PRIMARY KEY,
    id_guia         INT NOT NULL,
    numero_paso     INT NOT NULL,
    descripcion     NVARCHAR(500) NOT NULL,
    CONSTRAINT FK_Paso_Guia
        FOREIGN KEY (id_guia) REFERENCES Guias(id_guia)
);

-- tabla de traspasos de tareas (cuando un usuario presta una operación a otro)
CREATE TABLE Traspasos (
    id_traspaso     INT IDENTITY(1,1) PRIMARY KEY,
    id_operacion    INT NOT NULL,
    id_origen       INT NOT NULL,             -- quién cede la tarea
    id_destino      INT NOT NULL,             -- quién la recibe
    fecha_inicio    DATE NOT NULL,
    fecha_fin       DATE NOT NULL,
    motivo          NVARCHAR(100),            -- vacaciones, Incapacidad, Apoyo, Fuera de oficina
    activo          BIT NOT NULL DEFAULT 1,   -- 1 = traspaso vigente
    CONSTRAINT FK_Traspaso_Operacion
        FOREIGN KEY (id_operacion) REFERENCES Operaciones(id_operacion),
    CONSTRAINT FK_Traspaso_Origen
        FOREIGN KEY (id_origen) REFERENCES Usuarios(id_usuario),
    CONSTRAINT FK_Traspaso_Destino
        FOREIGN KEY (id_destino) REFERENCES Usuarios(id_usuario)
);

-- datos de ejemplo
INSERT INTO Usuarios (nombre, rol, puede_asignar) VALUES
('Juan Pablo', 'Contralor', 1),
('Daniela', 'Supervisora', 1),
('Pablo Marquez', 'Especialista', 0),
('Janeth Maciel', 'Analista', 0),
('Pamela Vega', 'Becaria', 0);

INSERT INTO Operaciones (nombre, frecuencia, dia, resumen, enlace, id_responsable) VALUES
('Pólizas hourly / salary', 'Semanal', 'Lunes', 'Elaboración de pólizas contables semanales.', 'Portal interno', 5),
('Scrap diario', 'Diaria', 'Martes', 'Registro diario del desperdicio de material.', 'Mainframe', 4),
('MMS', 'Diaria', 'Miércoles', 'Registro de movimientos de material.', 'Mainframe', 4),
('Conteos cíclicos', 'Diaria', 'Jueves', 'Conteo físico contra conteo de Mainframe.', 'Mainframe', 4);

-- consulta de ejemplo: operaciones pendientes con su responsable
-- select o.nombre, o.frecuencia, u.nombre AS responsable
-- from Operaciones o
-- inner join Usuarios u ON o.id_responsable = u.id_usuario;
