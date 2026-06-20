import { obtenerEquipo, eliminarEquipo, obtenerNombreVisible, obtenerRolUsu, logout, showMessage } from "./api.js";

// DOM
const nombreUsuario = document.getElementById('nomUsu');
const detUbicacion = document.getElementById('detUbicacion');
const detTipoUbicacion = document.getElementById('detTipoUbicacion');
const detEdificio = document.getElementById('detEdificio');
const detPiso = document.getElementById('detPiso');
const detMesa = document.getElementById('detMesa');
const detResponsable = document.getElementById('detResponsable');
const detMantenimiento = document.getElementById('detMantenimiento');
const detEstado = document.getElementById('detEstado');
const detFechaAlta = document.getElementById('detFechaAlta');

const detTipo = document.getElementById('detTipo');
const detCodigo = document.getElementById('detCodigo');
const detFabricante = document.getElementById('detFabricante');
const detModelo = document.getElementById('detModelo');

const detSoNombre = document.getElementById('detSoNombre');
const detSoVersion = document.getElementById('detSoVersion');
const detSoArq = document.getElementById('detSoArq');

const detCpuFab = document.getElementById('detCpuFab');
const detCpuMod = document.getElementById('detCpuMod');
const detCpuNuc = document.getElementById('detCpuNuc');
const detCpuFrec = document.getElementById('detCpuFrec');

const detRam = document.getElementById('detRam');
const detAlmacenamiento = document.getElementById('detAlmacenamiento');
const seccionDesktop = document.getElementById('seccionDesktop');
const seccionLaptop = document.getElementById('seccionLaptop');

const btnEditar = document.getElementById('btnEditar');
const btnEliminar = document.getElementById('btnEliminar');
const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');

if(nombreUsuario){
    nombreUsuario.textContent = '';
    const icon = document.createElement('i'); icon.className = 'bi bi-person-circle p-1';
    nombreUsuario.appendChild(icon);
    nombreUsuario.appendChild(document.createTextNode(' ' + obtenerNombreVisible()));
}

// Obtener id de query
function getQueryId(){
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

async function cargarDetalle(id){
    try{
        const resp = await obtenerEquipo(id);
        if(resp.status === 401){ window.location.href = 'index.html'; return; }
        if(!resp.ok){ console.error('No encontrado'); return; }
        const data = await resp.json();
        const equipo = data.equipo;
        const comp = data.componentes;

        // Actualizar el título del breadcrumb con el id real
        const breadcrumb = document.getElementById('breadcrumbDetalle');
        if(breadcrumb)
            { breadcrumb.textContent = `Detalle máquina #${equipo.id_equipo}`; }

        // SQL data
        detUbicacion.textContent = equipo.ubicacion.nombre;
        detTipoUbicacion.textContent = equipo.ubicacion.tipo;
        detEdificio.textContent = equipo.ubicacion.edificio ?? '-';
        detPiso.textContent = equipo.ubicacion.piso ?? '-';
        // Mostrar mesa (si es null mostrar guion)
        if(detMesa) detMesa.textContent = equipo.mesa ?? '-';
        detResponsable.textContent = equipo.asignaciones[0]?.persona?.nombre ?? '-';
        detMantenimiento.textContent = equipo.mantenimientos[0]?.fecha ?? '-';
        detEstado.textContent = equipo.estado ?? '-';
        detFechaAlta.textContent = equipo.fecha_alta ?? '-';

        // Mongo data
        detTipo.textContent = comp?.tipo ?? '-';
        detCodigo.textContent = comp?.codigo_inventario ?? '-';
        detFabricante.textContent = comp?.fabricante ?? '-';
        detModelo.textContent = comp?.modelo ?? '-';

        detSoNombre.textContent = comp?.sistema_operativo?.nombre ?? '-';
        detSoVersion.textContent = comp?.sistema_operativo?.version ?? '-';
        detSoArq.textContent = comp?.sistema_operativo?.arquitectura ?? '-';

        detCpuFab.textContent = comp?.cpu?.fabricante ?? '-';
        detCpuMod.textContent = comp?.cpu?.modelo ?? '-';
        detCpuNuc.textContent = comp?.cpu?.nucleos ?? '-';
        detCpuFrec.textContent = comp?.cpu?.frecuencia_ghz ?? '-';

        // RAM
        detRam.innerHTML = '';
        if(comp?.ram && comp.ram.length){
            comp.ram.forEach(m => {
                const div = document.createElement('div');
                div.className = 'col-12 col-md-6';
                const p = document.createElement('p');
                p.className = 'text-muted small mb-0';
                p.textContent = `${m.fabricante ?? '-'} — ${m.capacidad_gb ?? '-'} GB`;
                div.appendChild(p);
                detRam.appendChild(div);
            });
        } else {
            const p = document.createElement('p'); p.className = 'text-muted'; p.textContent = '-';
            detRam.appendChild(p);
        }

        // Almacenamiento
        detAlmacenamiento.innerHTML = '';
        if(comp?.almacenamiento && comp.almacenamiento.length){
            comp.almacenamiento.forEach(d => {
                const div = document.createElement('div');
                div.className = 'col-12 col-md-6';
                const p = document.createElement('p'); p.className = 'text-muted small mb-0';
                p.textContent = `${d.tipo ?? '-'} — ${d.capacidad_gb ?? '-'} GB`;
                div.appendChild(p);
                detAlmacenamiento.appendChild(div);
            });
        } else {
            const p = document.createElement('p'); p.className = 'text-muted'; p.textContent = '-';
            detAlmacenamiento.appendChild(p);
        }

        // Desktop vs Laptop
        if(comp?.tipo === 'desktop'){
            seccionDesktop.classList.remove('d-none');
            seccionLaptop.classList.add('d-none');
            document.getElementById('detMonitor').textContent = comp.perifericos?.monitor?.fabricante ?? '-';
            document.getElementById('detTeclado').textContent = comp.perifericos?.teclado?.fabricante ?? '-';
            document.getElementById('detMouse').textContent = comp.perifericos?.mouse?.fabricante ?? '-';
        } else if(comp?.tipo === 'laptop'){
            seccionLaptop.classList.remove('d-none');
            seccionDesktop.classList.add('d-none');
            // Mostrar capacidad en mAh si existe, y ciclos
            document.getElementById('detBatEstado').textContent =
                comp.bateria?.capacidad_mah ? `${comp.bateria.capacidad_mah} mAh` : '-';
            document.getElementById('detBatCiclos').textContent = comp.bateria?.ciclos ?? '-';
            document.getElementById('detPantPulgadas').textContent = comp.pantalla_integrada?.pulgadas ?? '-';
            document.getElementById('detPantRes').textContent = comp.pantalla_integrada?.resolucion ?? '-';
        } else {
            seccionDesktop.classList.add('d-none');
            seccionLaptop.classList.add('d-none');
        }

        // Enlace editar
        btnEditar.href = `formulario.html?id=${equipo.id_equipo}`;

        // Mostrar/ocultar botones de edición/eliminación según rol (solo Tecnicos)
        const rol = obtenerRolUsu();
        const puedeEscribir = (rol === "Tecnicos");
        if(!puedeEscribir){
            if(btnEditar) btnEditar.classList.add('d-none');
            if(btnEliminar) btnEliminar.classList.add('d-none');
        } else {
            if(btnEditar) btnEditar.classList.remove('d-none');
            if(btnEliminar) btnEliminar.classList.remove('d-none');
        }

    }catch(e){ console.error(e); }
}

// Borrar
    btnEliminar?.addEventListener('click', (e) =>{
    e.preventDefault();
    const modal = new bootstrap.Modal(document.getElementById('modalEliminar'));
    modal.show();
});

btnConfirmarEliminar?.addEventListener('click', async () =>{
    const id = getQueryId();
    if(!id) return;
    try{
        const resp = await eliminarEquipo(id);
        if(resp.status === 401){ window.location.href = 'index.html'; return; }
        if(resp.status === 403){ showMessage('No tienes permisos para eliminar','warning'); return; }
        if(!resp.ok){ showMessage('Error al eliminar','danger'); return; }
        window.location.href = 'listado.html';
    }catch(e){ console.error(e); }
});

// Inicializar
(async function init(){
    const id = getQueryId();
    // Listener para cerrar sesión desde esta página
    document.getElementById('btnCerrarSesion')?.addEventListener('click', (e) => {
        e?.preventDefault();
        logout();
        window.location.href = 'index.html';
    });
    if(!id){ window.location.href = 'listado.html'; return; }
    await cargarDetalle(id);
})();
