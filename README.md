# Sistema de Gestión de Operaciones — Contraloría Stellantis

Prototipo funcional de un sistema de gestión de operaciones para el área de
Contraloría de la planta VAN de Stellantis. Desarrollado como proyecto de
estadía para la obtención del título de Técnico Superior Universitario en
Tecnologías de la Información.

## Descripción

El sistema centraliza el catálogo de operaciones del área, integra guías de
procedimiento paso a paso y permite dar seguimiento al estado de cada actividad,
con el fin de reducir el tiempo de capacitación del personal de nuevo ingreso y
disminuir la dependencia del conocimiento informal ante la rotación de personal.

## Funcionalidades

- **Inicio de sesión** con nombre de usuario y TID (identificador de 4 dígitos),
  con validación que impide caracteres inválidos, espacios y caracteres invisibles.
- **Calendario semanal** fijo en la parte superior, que muestra las actividades por día.
- **Vista de detalle intercambiable** entre Lista y Pizarra (tablero Kanban).
- **Guías de procedimiento** paso a paso para cada operación.
- **Cambio de estado** de las actividades (pendiente → en proceso → completada).
- **Traspaso de tareas** entre usuarios, con fecha límite y motivo.
- **Historial** de acciones (cambios de estado, traspasos, devoluciones y altas),
  accesible desde un panel lateral.
- **Panel de gestión** exclusivo para los roles de Contralor y Supervisor, que
  permite agregar y eliminar usuarios, cambiar sus roles y reasignar actividades.
- **Roles de usuario**: Contralor, Supervisora, Especialista, Analista y Becaria.
  El contralor y la supervisora visualizan las actividades de todo el equipo; los
  demás usuarios visualizan únicamente las propias.

## Usuarios de prueba

| Nombre | Rol | TID |
|---|---|---|
| Hector Alvarez | Contralor | 1001 |
| Daniela | Supervisora | 1002 |
| Pablo Marquez | Especialista | 1003 |
| Janeth Maciel | Analista | 1004 |
| Pamela Vega | Becaria | 1005 |

## Tecnologías

- **HTML5** — estructura
- **CSS3** — diseño e interfaz
- **JavaScript** — lógica e interactividad

El prototipo utiliza una estructura de datos en memoria que simula la base de
datos. El diseño relacional completo se incluye en el archivo `base_de_datos.sql`.
En la implementación corporativa, los datos residen en una lista de Microsoft
SharePoint, conectada a una aplicación de Microsoft Power Apps.

## Estructura de archivos

- `index.html` — estructura de la aplicación
- `estilos.css` — hoja de estilos
- `app.js` — lógica del sistema
- `base_de_datos.sql` — diseño relacional de la base de datos

## Cómo ejecutar

No requiere instalación. Basta con abrir el archivo `index.html` en cualquier
navegador web (Chrome, Edge, Firefox).

## Autor

Vega Dávila Pamela Guadalupe — Universidad Tecnológica de Coahuila, 2026
