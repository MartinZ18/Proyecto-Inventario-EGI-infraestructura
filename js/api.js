// Url del backend
const API_URL = "/api";

// LOGIN

/* Envía usuario y contraseña al backend. Si es correcto devuelve un JWT */
export async function login(username, password) {
    
    /* Permite colocar el resultado como lo 
    esperará el backend (como formulario) */
    const formData = new URLSearchParams();

    formData.append("username", username);
    formData.append("password", password);

    // Petición POST.
    const response = await fetch(`${API_URL}/auth/login`,
        {
            method: "POST",
            body: formData
        }
    );

    // La respuesta retorna y es procesada por app.js
    return response;
}

/* Guarda el token en el navegador. Permite mantener la sesión iniciada. */
export function guardarToken(token){
    localStorage.setItem("token", token);
}

/* Obtiene el token guardado para usarlo en futuras peticiones */
export function obtenerToken(){
    return localStorage.getItem("token");
}

/* Al cerrar sesión se elimina el token. */
export function logout(){
    localStorage.removeItem("token");
}

/* Lee la información interna del token JWT (sub, rol, exp) */
export function obtenerPayloadToken(){

    const token = obtenerToken();

    if(!token){
        return null;
    }

    try{
        // Token JWT tiene formato: HEADER.PAYLOAD.FIRMA
        return JSON.parse(
            // Convertir Base 64 a texto legible
            atob(
                // Tomo la parte de PAYLOAD
                token.split(".")[1]
            )
        );

    } catch (error){
        return null;
    }
}

/* Obtiene el nombre del usuario guardado dentro del JWT(payload) */
export function obtenerUsuario(){

    const payload = obtenerPayloadToken();

    // obtiene y retorna sub -> subject (sería el usuario autenticado)
    if(payload){
        return payload.sub;
    }else{
        return null;
    }

}

export function obtenerNombreVisible(){

    const usuario = obtenerUsuario();

    if(!usuario){
        return "Usuario";
    }

    /* if (usuario.includes("@")){
        // recorta el mail de usuario, muestra solo la parte anterior a @
        return usuario.split("@")[0];
    } */

    return usuario;
}

/* Obtiene rol del usuario */
export function obtenerRolUsu(){

    const payload = obtenerPayloadToken();

    if(payload){
        return payload.rol;
    }else{
        return null;
    }
}

// Comprueba si el token expiró.
export function isTokenExpired(){
    const payload = obtenerPayloadToken();
    if(!payload || !payload.exp) return true;
    const exp = payload.exp;
    let expSec;
    if(typeof exp === 'number'){
        expSec = exp;
    } else {
        // puede venir como string ISO
        expSec = Math.floor(new Date(exp).getTime()/1000);
    }
    return Math.floor(Date.now()/1000) >= expSec;
}

// Mensajes globales sencillos (Bootstrap alert temporal)
export function showMessage(message, type='danger', timeout=5000){
    try{
        const existing = document.getElementById('globalAlert');
        if(existing) existing.remove();
        const div = document.createElement('div');
        div.id = 'globalAlert';
        div.className = `alert alert-${type} fixed-top m-3`;
        div.role = 'alert';
        div.textContent = message;
        document.body.appendChild(div);
        setTimeout(()=>{ div.remove(); }, timeout);
    }catch(e){ console.log('showMessage error', e); }
}

// Wrapper seguro para fetch con Authorization y manejo centralizado de 401/errores.
export async function fetchWithAuth(path, options = {}){
    if(isTokenExpired()){
        logout();
        window.location.href = 'index.html';
        throw new Error('Token expirado');
    }
    const url = path.startsWith('http') ? path : `${API_URL}${path}`;
    options.headers = options.headers || {};
    // No sobrescribir Content-Type si el caller lo estableció
    options.headers['Authorization'] = `Bearer ${obtenerToken()}`;
    try{
        const resp = await fetch(url, options);
        if(resp.status === 401){
            // token inválido o expirado
            logout();
            window.location.href = 'index.html';
            return resp;
        }
        return resp;
    }catch(err){
        throw new Error('No se pudo conectar con el servidor');
    }
}

// INVENTARIO

export async function obtenerInventario(){
    return await fetchWithAuth('/inventario/', { method: 'GET' });
}

export async function eliminarEquipo(idEquipo) {
    return await fetchWithAuth(`/inventario/equipos/${idEquipo}`, { method: 'DELETE' });
}

// ----- Helpers adicionales para frontend (obtener/crear/editar recursos) -----
export async function obtenerUbicaciones(){
    return await fetchWithAuth('/inventario/ubicaciones', { method: 'GET' });
}

export async function obtenerEquipo(id){
    return await fetchWithAuth(`/inventario/${id}`, { method: 'GET' });
}

export async function crearEquipo(data){
    return await fetchWithAuth('/inventario/equipos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}

export async function actualizarEquipo(id, data){
    return await fetchWithAuth(`/inventario/equipos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}

export async function crearComponentes(data){
    return await fetchWithAuth('/inventario/componentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}

export async function actualizarComponentes(id, data){
    return await fetchWithAuth(`/inventario/componentes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}

export async function obtenerPersonas() {
    return await fetchWithAuth('/inventario/personas', { method: 'GET' });
}
