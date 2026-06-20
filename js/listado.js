import { 
    obtenerInventario, eliminarEquipo, obtenerNombreVisible,
    obtenerRolUsu, logout
 } from "./api.js";

// Elementos del DOM
const nombreUsuario = document.getElementById("nomUsu");
const cuerpoTabla = document.getElementById("cuerpoTabla");
const sinResultados = document.getElementById("sinResultados");
const btnNuevaMaquina = document.getElementById("btnNuevaMaq");
const btnCerrarSesion = document.getElementById("btnCerrarSesion");
const btnTipo = document.getElementById("btnTipo");
const btnUbicacion = document.getElementById("btnUbicacion");
const menuUbicacion = document.getElementById("menuUbicacion");

// Rol usuarioo
const rol = obtenerRolUsu();
if(!rol){
    window.location.href = "index.html";
}

// Inventario recibido 
let inventarioCompleto = [];

// variables que se utilizarán en funciones de filtrado.
let tipoSeleccionado = "TODOS";
let ubicacionSeleccionada = "TODAS";

// Mostrar el nombre del usuario
if(nombreUsuario){
    nombreUsuario.innerHTML = `
        <i class="bi bi-person-circle p-1"></i>
        ${obtenerNombreVisible()}
        `;
}

/* Roles en esta vista:
    - Solo Tecnicos pueden crear equipos y eliminarlos
    - Docente y Alumnos solo pueden ver la lista. */

if(rol != "Tecnicos"){
    if(btnNuevaMaquina){
        btnNuevaMaquina.classList.add("d-none");
    }
}

// Cargar el Inventario
async function cargarInventario() {
    try{

        const response = await obtenerInventario();

        // No hay sesión válida vuelve a index.html
        if(response.status === 401){
            window.location.href = "index.html";
            return;
        }

        if(!response.ok){
            throw new Error("Error al obtener inventario")
        }

        // Transforma respuesta a json
        inventarioCompleto = await response.json();
        
        cargarUbicaciones();
        aplicarFiltros();

    } catch (error){
        console.error(error);
    }
}

function cargarUbicaciones(){

    menuUbicacion.innerHTML = "";

    // arreglo donde guardar ubicaciones.
    const ubicaciones = [];

    // Si el usuario eligió TODOS, usa todo el inventario
    let datosFiltrados = inventarioCompleto;

    // Si eligió un tipo, filtra por ese tipo
    if(tipoSeleccionado !== "TODOS"){
        datosFiltrados = inventarioCompleto.filter(item =>
            item.equipo.ubicacion.tipo === tipoSeleccionado
        );
    }

    // Obtiene ubicaciones únicas
    datosFiltrados.forEach(item => {

        const nombreUbicacion = item.equipo.ubicacion.nombre;

        // Si todavía no existe esa ubicación en el array se agrega
        if(!ubicaciones.includes(nombreUbicacion)){
            ubicaciones.push(nombreUbicacion);
        }
    });

    // Opción TODAS
    menuUbicacion.innerHTML+= `
        <li>
            <a class="dropdown-item ubicacion-item" href="#" data-ubicacion="TODAS">Todas</a>
        </li>`;
    
    // Agrega cada ubicación encontrada
    ubicaciones.forEach(nombreUbi =>{
        menuUbicacion.innerHTML += `
            <li>
                <a class="dropdown-item ubicacion-item" href="#" data-ubicacion="${nombreUbi}">
                ${nombreUbi}</a>
            </li>`;
    });

    registrarEventosUbicacion();
    
}

// Eventos filtro Tipo (muestra el nombre del tipo seleccionado)
document.querySelectorAll(".tipo-item").forEach(item =>{

    item.addEventListener("click", (event) =>{

        event.preventDefault();

        /* Obtiene el tipo seleccionado y agrega el nombre al 
        principio del dropdown */
        tipoSeleccionado = item.dataset.tipo;
        btnTipo.textContent = tipoSeleccionado;

        // Reinicia el filtro ubicación
        ubicacionSeleccionada = "TODAS";
        btnUbicacion.textContent = "Ubicación";

        // Regenera las ubicaciones disponibles
        cargarUbicaciones();

        aplicarFiltros();
    });
});

// Eventos filtro Ubicación
function registrarEventosUbicacion(){

    document.querySelectorAll(".ubicacion-item").forEach(item =>{
        item.addEventListener("click", (event) =>{
            event.preventDefault();

            /* Obtiene la ubicación seleccionado y agrega el nombre al 
            principio del dropdown */
            ubicacionSeleccionada = item.dataset.ubicacion;
            btnUbicacion.textContent = ubicacionSeleccionada;

            aplicarFiltros();
        });
    });
}

/* Aplica filtros para conservar solo los equipos de tipo y
ubicación seleccionada por el usuario. */
function aplicarFiltros(){

    let resultado = inventarioCompleto;

    // Guarda solo los equipos del tipo seleccionado por el usuario.
    if (tipoSeleccionado !== "TODOS"){
        resultado = resultado.filter(item => item.equipo.ubicacion.tipo === tipoSeleccionado);
    }

    if (ubicacionSeleccionada !== "TODAS"){
        resultado = resultado.filter(item => item.equipo.ubicacion.nombre === ubicacionSeleccionada);
    }

    // Actualiza la tabla con el resultado final
    dibujarTabla(resultado);
}


// Colocar filas a la tabla
function dibujarTabla(inventario){

    cuerpoTabla.innerHTML = "";

    // Mostrar mensaje del div
    if (inventario.length === 0){
        sinResultados.classList.remove("d-none");
        return;
    }

    // oculta mensaje por defecto
    sinResultados.classList.add("d-none")

    // Agregamos las filas a la tabla
    inventario.forEach(item => {
        const fila = document.createElement("tr");

        const estadoBadge = {
            'OPERATIVO':     '<span class="badge bg-success">Operativo</span>',
            'EN_REPARACION': '<span class="badge bg-warning text-dark">En reparación</span>',
            'BAJA':          '<span class="badge bg-danger">Baja</span>',
        };
        const badge = estadoBadge[item.equipo.estado] ?? `<span class="badge bg-secondary">${item.equipo.estado ?? '-'}</span>`;

        const eliminarCell = (rol === 'Tecnicos')
            ? `<button class="btn btn-danger btn-sm" onclick="eliminarEquipoTabla(${item.equipo.id_equipo})">Eliminar</button>`
            : '-';

        fila.innerHTML = `
            <td>${item.equipo.id_equipo}</td>
            <td>${item.equipo.ubicacion.nombre}</td>
            <td>${item.equipo.mesa ?? '-'}</td>
            <td>${item.componentes?.tipo ?? "-"}</td>
            <td class="text-center">${badge}</td>
            <td>
                <a
                    href="detalle.html?id=${item.equipo.id_equipo}"
                    class="btn btn-primary btn-sm">
                    Ver Detalle
                </a>
            </td>
            <td>
                ${eliminarCell}
            </td>
        `;

        // Agregar cuerpo de la tabla
        cuerpoTabla.appendChild(fila);
    });

}

// Eliminar equipo
window.eliminarEquipoTabla = async function(idEquipo) {
    if(rol !== "Tecnicos"){
        alert("No tiene permisos para eliminar máquinas.");
        return;
    }

    const confirmar = confirm("¿Eliminar equipo?")
    if(!confirmar){
        return;
    }

    try{
        const response = await eliminarEquipo(idEquipo)
        if(response.status === 403){
            alert("Acceso denegado. No tiene permisos para eliminar máquinas.");
            return;
        }

    if(response.status === 401){
        window.location.href = "index.html";
        return;
    }

    if(!response.ok){
        throw new Error("Error al eliminar");
    }

    // Recargamos el inventario por si se elimino algún equipo
    cargarInventario();

    } catch(error){
        console.error(error);
    }
}

// Cerrar Sesión
btnCerrarSesion?.addEventListener("click", (event) => {
    event.preventDefault();
    logout();
    window.location.href = "index.html";
});

// Iniciar
cargarInventario();