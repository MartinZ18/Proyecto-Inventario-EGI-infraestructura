import {
    obtenerUbicaciones, obtenerPersonas, crearEquipo, crearComponentes,
    crearAsignacion, obtenerInventario,
    obtenerEquipo, actualizarEquipo, actualizarComponentes,
    obtenerNombreVisible, obtenerRolUsu, logout, showMessage
} from "./api.js";

// Elementos del DOM
const nombreUsuario = document.getElementById("nomUsu");
const selectUbicacion = document.getElementById("fUbicacion");
const btnGuardar = document.getElementById("btnGuardar");

// Campo mesa
const fMesa = document.getElementById("fMesa");

// Campos principales
const fTipo = document.getElementById("fTipo");
const fCodigo = document.getElementById("fCodigo");
const fFabricante = document.getElementById("fFabricante");
const fModelo = document.getElementById("fModelo");
const fObservacion = document.getElementById("fObservacion");
const fEstado = document.getElementById("fEstado");
const fFechaAlta = document.getElementById("fFechaAlta");

// Responsable
const selectResponsable = document.getElementById("fResponsable");

// Subdocumentos
const contenedorRam = document.getElementById("contenedorRam");
const contenedorAlmacenamiento = document.getElementById("contenedorAlmacenamiento");
const cardDesktop = document.getElementById("cardDesktop");
const cardLaptop = document.getElementById("cardLaptop");

// Mostrar nombre de usuario de forma segura
if(nombreUsuario){
    nombreUsuario.textContent = '';
    const icon = document.createElement('i');
    icon.className = 'bi bi-person-circle p-1';
    nombreUsuario.appendChild(icon);
    nombreUsuario.appendChild(document.createTextNode(' ' + obtenerNombreVisible()));
}

// Verificar rol (solo Técnicos pueden crear/editar)
const rol = obtenerRolUsu();
if(!rol || rol !== "Tecnicos"){
    // Solo técnicos pueden crear/editar
    window.location.href = "listado.html";
}

// Helpers para añadir filas dinámicas
window.agregarRam = function(){
    const row = document.createElement('div');
    row.className = 'row g-3 mb-2 fila-ram';
    const col1 = document.createElement('div'); col1.className = 'col-3';
    const in1 = document.createElement('input'); in1.type = 'text'; in1.className = 'form-control border-secondary'; in1.placeholder = 'Fabricante'; col1.appendChild(in1);
    const col2 = document.createElement('div'); col2.className = 'col-3';
    const in2 = document.createElement('input'); in2.type = 'number'; in2.className = 'form-control border-secondary'; in2.placeholder = 'Capacidad (GB)'; col2.appendChild(in2);
    const col3 = document.createElement('div'); col3.className = 'col-3';
    const in3 = document.createElement('input'); in3.type = 'text'; in3.className = 'form-control border-secondary'; in3.placeholder = 'Tipo (DDR4...)'; col3.appendChild(in3);
    const col4 = document.createElement('div'); col4.className = 'col-3';
    const in4 = document.createElement('input'); in4.type = 'number'; in4.className = 'form-control border-secondary'; in4.placeholder = 'Frecuencia (MHz)'; col4.appendChild(in4);
    row.appendChild(col1); row.appendChild(col2); row.appendChild(col3); row.appendChild(col4);
    contenedorRam.appendChild(row);
}

window.agregarAlmacenamiento = function(){
    const row = document.createElement('div');
    row.className = 'row g-3 mb-2 fila-almacenamiento';
    const c1 = document.createElement('div'); c1.className = 'col-3'; const i1 = document.createElement('input'); i1.type='text'; i1.className='form-control border-secondary'; i1.placeholder='Tipo (SSD|HDD)'; c1.appendChild(i1);
    const c2 = document.createElement('div'); c2.className = 'col-3'; const i2 = document.createElement('input'); i2.type='number'; i2.className='form-control border-secondary'; i2.placeholder='Capacidad (GB)'; c2.appendChild(i2);
    const c3 = document.createElement('div'); c3.className = 'col-3'; const i3 = document.createElement('input'); i3.type='text'; i3.className='form-control border-secondary'; i3.placeholder='Fabricante'; c3.appendChild(i3);
    const c4 = document.createElement('div'); c4.className = 'col-3'; const i4 = document.createElement('input'); i4.type='text'; i4.className='form-control border-secondary'; i4.placeholder='Modelo'; c4.appendChild(i4);
    row.appendChild(c1); row.appendChild(c2); row.appendChild(c3); row.appendChild(c4);
    contenedorAlmacenamiento.appendChild(row);
}

// Mostrar/ocultar secciones según tipo
window.cambiarTipo = function(value){
    if(value === 'desktop'){
        cardDesktop.classList.remove('d-none');
        cardLaptop.classList.add('d-none');
    } else if(value === 'laptop'){
        cardLaptop.classList.remove('d-none');
        cardDesktop.classList.add('d-none');
    } else {
        cardDesktop.classList.add('d-none');
        cardLaptop.classList.add('d-none');
    }
}

// Cargar técnicos en el select de responsable
async function cargarPersonas(){
    try{
        const resp = await obtenerPersonas();
        if(!resp.ok) return;
        const datos = await resp.json();
        const tecnicos = datos.filter(p => p.rol === 'TECNICO');
        if(!selectResponsable) return;
        selectResponsable.innerHTML = '';
        const first = document.createElement('option');
        first.value = ''; first.textContent = 'Seleccioná un responsable';
        selectResponsable.appendChild(first);
        tecnicos.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id_persona;
            opt.textContent = `${p.apellido}, ${p.nombre}`;
            selectResponsable.appendChild(opt);
        });
    }catch(e){ console.error(e); }
}

// Cargar ubicaciones en el select
async function cargarUbicaciones(){
    try{
        const resp = await obtenerUbicaciones();
        if(resp.status === 401){ window.location.href = 'index.html'; return; }
        if(!resp.ok){ showMessage('No se pudieron cargar ubicaciones','danger'); return; }
        const datos = await resp.json();
        // Limpiar y agregar opciones (creación segura)
        selectUbicacion.innerHTML = '';
        const first = document.createElement('option'); first.value = ''; first.textContent = 'Seleccioná una ubicación';
        selectUbicacion.appendChild(first);
        datos.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.id_ubicacion;
            opt.textContent = `${u.nombre} (${u.tipo})`;
            selectUbicacion.appendChild(opt);
        });
    }catch(e){
        console.error(e);
        showMessage('Error cargando ubicaciones','danger');
    }
}

// Parse query param id (editar)
function getQueryId(){
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

async function cargarParaEditar(id){
    try{
        const resp = await obtenerEquipo(id);
        if(resp.status === 401){ window.location.href = 'index.html'; return; }
        if(!resp.ok) return;
        const data = await resp.json();
        // data es InventarioCompleto { equipo, componentes }
        const equipo = data.equipo;
        const comp = data.componentes;
        // Rellenar campos del formulario
        // No hay campo id_equipo en el HTML; lo usaremos internamente
        window._editingId = equipo.id_equipo;
        // Ubicacion
        if(selectUbicacion) selectUbicacion.value = equipo.ubicacion.id_ubicacion;
        // Responsable: pre-seleccionar el técnico con asignación RESPONSABLE_TECNICO vigente
        const asigActiva = equipo.asignaciones.find(
            a => a.tipo_asignacion === 'RESPONSABLE_TECNICO' && !a.fecha_fin
        );
        if(asigActiva && selectResponsable) selectResponsable.value = asigActiva.persona.id_persona;
        // Mesa
        if(fMesa) fMesa.value = equipo.mesa ?? '';
        // Tipo y hardware
        fTipo.value = comp?.tipo ?? '';
        cambiarTipo(fTipo.value);
        fCodigo.value = comp?.codigo_inventario ?? '';
        fFabricante.value = comp?.fabricante ?? '';
        fModelo.value = comp?.modelo ?? '';
        fObservacion.value = comp?.observacion ?? '';
        fEstado.value = equipo.estado ?? '';
        fFechaAlta.value = equipo.fecha_alta ?? '';

        // Sistema operativo
        if(comp?.sistema_operativo){
            const so = comp.sistema_operativo;
            const soNombre = document.getElementById('fSoNombre'); if(soNombre) soNombre.value = so.nombre ?? '';
            const soVersion = document.getElementById('fSoVersion'); if(soVersion) soVersion.value = so.version ?? '';
            const soArq = document.getElementById('fSoArq'); if(soArq) soArq.value = so.arquitectura ?? '';
        }
        // CPU
        if(comp?.cpu){
            const cpu = comp.cpu;
            const cpuFab = document.getElementById('fCpuFab'); if(cpuFab) cpuFab.value = cpu.fabricante ?? '';
            const cpuMod = document.getElementById('fCpuMod'); if(cpuMod) cpuMod.value = cpu.modelo ?? '';
            const cpuNuc = document.getElementById('fCpuNuc'); if(cpuNuc) cpuNuc.value = cpu.nucleos ?? '';
            const cpuFrec = document.getElementById('fCpuFrec'); if(cpuFrec) cpuFrec.value = cpu.frecuencia_ghz ?? '';
        }
        // Periféricos (desktop)
        if(comp?.perifericos){
            const p = comp.perifericos;
            if(p.monitor){ const f = document.getElementById('fMonFab'); if(f) f.value = p.monitor.fabricante ?? ''; const m = document.getElementById('fMonMod'); if(m) m.value = p.monitor.modelo ?? ''; const g = document.getElementById('fMonPulg'); if(g) g.value = p.monitor.pulgadas ?? ''; }
            if(p.teclado){ const f = document.getElementById('fTecFab'); if(f) f.value = p.teclado.fabricante ?? ''; const c = document.getElementById('fTecCon'); if(c) c.value = p.teclado.conexion ?? ''; }
            if(p.mouse){ const f = document.getElementById('fMouFab'); if(f) f.value = p.mouse.fabricante ?? ''; const c = document.getElementById('fMouCon'); if(c) c.value = p.mouse.conexion ?? ''; }
        }
        // Batería y pantalla (laptop)
        if(comp?.bateria){ const e = document.getElementById('fBatEstado'); if(e) e.value = comp.bateria.estado ?? ''; const c = document.getElementById('fBatCiclos'); if(c) c.value = comp.bateria.ciclos ?? ''; }
        if(comp?.pantalla_integrada){ const p = document.getElementById('fPantPulg'); if(p) p.value = comp.pantalla_integrada.pulgadas ?? ''; const r = document.getElementById('fPantRes'); if(r) r.value = comp.pantalla_integrada.resolucion ?? ''; }

        // RAM
        contenedorRam.innerHTML = '';
        if(comp?.ram){
            comp.ram.forEach(m => {
                agregarRam();
                const last = contenedorRam.lastElementChild;
                const inputs = last.querySelectorAll('input');
                inputs[0].value = m.fabricante ?? '';
                inputs[1].value = m.capacidad_gb ?? '';
                inputs[2].value = m.tipo ?? '';
                inputs[3].value = m.frecuencia_mhz ?? '';
            });
        }
        // Almacenamiento
        contenedorAlmacenamiento.innerHTML = '';
        if(comp?.almacenamiento){
            comp.almacenamiento.forEach(d => {
                agregarAlmacenamiento();
                const last = contenedorAlmacenamiento.lastElementChild;
                const inputs = last.querySelectorAll('input');
                inputs[0].value = d.tipo ?? '';
                inputs[1].value = d.capacidad_gb ?? '';
                inputs[2].value = d.fabricante ?? '';
                inputs[3].value = d.modelo ?? '';
            });
        }

    } catch(e){ console.error(e); showMessage('Error cargando datos del equipo','danger'); }
}

// Construir payloads
function leerRam(){
    const resultado = [];
    document.querySelectorAll('.fila-ram').forEach(row =>{
        const inputs = row.querySelectorAll('input');
        const fabricante = inputs[0].value.trim();
        const capacidad = inputs[1].value ? parseInt(inputs[1].value) : undefined;
        const tipo = inputs[2].value.trim();
        const frecuencia = inputs[3].value ? parseInt(inputs[3].value) : undefined;
        if(fabricante || capacidad || tipo || frecuencia){
            resultado.push({ fabricante: fabricante || undefined, capacidad_gb: capacidad, tipo: tipo || undefined, frecuencia_mhz: frecuencia });
        }
    });
    return resultado;
}

function leerAlmacenamiento(){
    const resultado = [];
    document.querySelectorAll('.fila-almacenamiento').forEach(row =>{
        const inputs = row.querySelectorAll('input');
        const tipo = inputs[0].value.trim();
        const capacidad = inputs[1].value ? parseInt(inputs[1].value) : undefined;
        const fabricante = inputs[2].value.trim();
        const modelo = inputs[3].value.trim();
        if(tipo || capacidad || fabricante || modelo){
            resultado.push({ tipo: tipo || undefined, capacidad_gb: capacidad, fabricante: fabricante || undefined, modelo: modelo || undefined });
        }
    });
    return resultado;
}

// Validaciones que deben coincidir con las reglas del backend
function validarComponentes(componentes){

    // tipo: debe existir y ser 'desktop' o 'laptop' en creación
    if(!componentes.tipo || (componentes.tipo !== 'desktop' && componentes.tipo !== 'laptop')){
        return { ok:false, msg:'Tipo inválido. Seleccione "desktop" o "laptop".' };
    }

    // RAM: asegurar que los campos numéricos parezcan números (si se ingresaron)
    if(componentes.ram && componentes.ram.length){
        for(const m of componentes.ram){
            if(m.capacidad_gb !== undefined && m.capacidad_gb !== null){
                if(!Number.isInteger(m.capacidad_gb) && !Number.isNaN(Number(m.capacidad_gb))){
                    // permitir conversión en backend — solo advertimos si no es numérico
                }
            }
            if(m.frecuencia_mhz !== undefined && m.frecuencia_mhz !== null){
                if(!Number.isInteger(m.frecuencia_mhz) && !Number.isNaN(Number(m.frecuencia_mhz))){
                    // no rechazar: backend no impone rango
                }
            }
        }
    }

    // Almacenamiento: asegurar campos numéricos parezcan números (si se ingresaron)
    if(componentes.almacenamiento && componentes.almacenamiento.length){
        for(const d of componentes.almacenamiento){
            if(d.capacidad_gb !== undefined && d.capacidad_gb !== null){
                if(!Number.isInteger(d.capacidad_gb) && !Number.isNaN(Number(d.capacidad_gb))){
                    // no rechazar
                }
            }
        }
    }

    // No imponer límites de longitud ni regex — backend es la autoridad.
    return { ok:true };
}

// Guardar formulario (crear o actualizar)
async function guardarFormulario(){
    try{
        const tipo = fTipo.value;
        const ubicacion = selectUbicacion.value;
        if(!tipo || !ubicacion){
            showMessage('Tipo y Ubicación son obligatorios','warning');
            return;
        }

        // Construir payload componentes
        const componentes = {
            tipo,
            codigo_inventario: fCodigo.value || undefined,
            fabricante: fFabricante.value || undefined,
            modelo: fModelo.value || undefined,
            observacion: fObservacion.value || undefined,
            sistema_operativo: {
                nombre:       document.getElementById('fSoNombre')?.value || undefined,
                version:      document.getElementById('fSoVersion')?.value || undefined,
                arquitectura: document.getElementById('fSoArq')?.value || undefined,
            },
            cpu: {
                fabricante:    document.getElementById('fCpuFab')?.value || undefined,
                modelo:        document.getElementById('fCpuMod')?.value || undefined,
                nucleos:       document.getElementById('fCpuNuc')?.value ? parseInt(document.getElementById('fCpuNuc').value) : undefined,
                frecuencia_ghz: document.getElementById('fCpuFrec')?.value ? parseFloat(document.getElementById('fCpuFrec').value) : undefined,
            },
            ram: leerRam(),
            almacenamiento: leerAlmacenamiento(),
        };

        if(tipo === 'desktop'){
            componentes.perifericos = {
                monitor: {
                    fabricante: document.getElementById('fMonFab')?.value || undefined,
                    modelo:     document.getElementById('fMonMod')?.value || undefined,
                    pulgadas:   document.getElementById('fMonPulg')?.value ? parseFloat(document.getElementById('fMonPulg').value) : undefined,
                },
                teclado: {
                    fabricante: document.getElementById('fTecFab')?.value || undefined,
                    conexion:   document.getElementById('fTecCon')?.value || undefined,
                },
                mouse: {
                    fabricante: document.getElementById('fMouFab')?.value || undefined,
                    conexion:   document.getElementById('fMouCon')?.value || undefined,
                },
            };
        } else if(tipo === 'laptop'){
            componentes.bateria = {
                estado: document.getElementById('fBatEstado')?.value || undefined,
                ciclos: document.getElementById('fBatCiclos')?.value ? parseInt(document.getElementById('fBatCiclos').value) : undefined,
            };
            componentes.pantalla_integrada = {
                pulgadas:   document.getElementById('fPantPulg')?.value ? parseFloat(document.getElementById('fPantPulg').value) : undefined,
                resolucion: document.getElementById('fPantRes')?.value || undefined,
            };
        }

        // Validar componentes antes de enviar
        const v = validarComponentes(componentes);
        if(!v.ok){ showMessage(v.msg,'warning'); return; }

        // Si estamos editando
        const editingId = window._editingId || getQueryId();
        if(editingId){
            // Actualizar equipo
            const equipoPayload = {
                id_ubicacion: parseInt(ubicacion),
                mesa: (fMesa && fMesa.value) ? fMesa.value : null,
                estado: fEstado.value || undefined,
                fecha_alta: fFechaAlta.value || undefined,
            };
            const respEq = await actualizarEquipo(editingId, equipoPayload);
            if(respEq.status === 401){ window.location.href='index.html'; return; }
            if(respEq.status === 403){ showMessage('No tiene permisos para editar este equipo','danger'); return; }
            if(!respEq.ok){ showMessage('Error actualizando equipo','danger'); return; }

            // Actualizar componentes
            const compPayload = { ...componentes };
            const respComp = await actualizarComponentes(editingId, compPayload);
            if(respComp.status === 401){ window.location.href='index.html'; return; }
            if(respComp.status === 403){ showMessage('No tiene permisos para editar los componentes de este equipo','danger'); return; }
            if(!respComp.ok){ showMessage('Error actualizando componentes','danger'); return; }

            window.location.href = 'detalle.html?id=' + editingId;
            return;
        }

        // Crear nuevo: necesitamos generar un id_equipo (no hay campo en el formulario)
        const listaResp = await obtenerInventario();
        if(listaResp.status === 401){ window.location.href='index.html'; return; }
        const lista = await listaResp.json();
        const maxId = lista.reduce((acc, it) => Math.max(acc, it.equipo.id_equipo), 0);
        const nuevoId = maxId + 1;

        // Crear equipo en SQL
        const equipoPayload = {
            id_equipo: nuevoId,
            id_ubicacion: parseInt(ubicacion),
            mesa: (fMesa && fMesa.value) ? fMesa.value : null,
            estado: fEstado.value || 'operativo',
            fecha_alta: fFechaAlta.value || undefined,
        };
        const respCrearEq = await crearEquipo(equipoPayload);
        if(respCrearEq.status === 401){ window.location.href='index.html'; return; }
        if(respCrearEq.status === 403){ showMessage('No tiene permisos para crear equipos','danger'); return; }
        if(!respCrearEq.ok){ showMessage('Error creando equipo','danger'); return; }

        // Crear componentes en Mongo
        const compPayload = { id_equipo: nuevoId, ...componentes };
        const respCrearComp = await crearComponentes(compPayload);
        if(respCrearComp.status === 401){ window.location.href='index.html'; return; }
        if(respCrearComp.status === 403){ showMessage('No tiene permisos para crear componentes','danger'); return; }
        if(!respCrearComp.ok){ showMessage('Error creando componentes','danger'); return; }

        // Asignar responsable técnico si se seleccionó uno
        const responsableId = selectResponsable?.value;
        if(responsableId){
            await crearAsignacion({
                id_equipo: nuevoId,
                id_persona: parseInt(responsableId),
                tipo_asignacion: 'RESPONSABLE_TECNICO',
                fecha_inicio: fFechaAlta.value || new Date().toISOString().split('T')[0],
            });
        }

        // Ir al detalle del nuevo equipo
        window.location.href = 'detalle.html?id=' + nuevoId;

    }catch(e){ console.error(e); showMessage('Error guardando formulario','danger'); }
}

// Exponer la función para el onclick del HTML
window.guardarFormulario = guardarFormulario;

// Inicializar
(async function init(){
    await Promise.all([cargarUbicaciones(), cargarPersonas()]);
    const qid = getQueryId();
    if(qid){
        await cargarParaEditar(qid);
        document.getElementById('breadcrumbForm').textContent = 'Editar máquina';
        document.getElementById('tituloForm').textContent = 'Editar máquina';
    } else {
        // dejar una fila base para RAM y Almacenamiento
        if(contenedorRam.children.length === 0) agregarRam();
        if(contenedorAlmacenamiento.children.length === 0) agregarAlmacenamiento();
    }
})();
