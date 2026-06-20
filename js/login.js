import {login, guardarToken, obtenerPayloadToken} from "./api.js";

// LOGIN

// Elementos del DOM
const btnIngresar = document.getElementById("btnIngresar");
const txtusuario = document.getElementById("usuario");
const txtcontrasenia = document.getElementById("password");
const alertError = document.getElementById("alertError");
const alertRed = document.getElementById("alertRed");
const mensCampos = document.getElementById("mensVacios");

// Mostrar/Ocultar contraseña  
const togglePw = document.getElementById("togglePw");
const toggleIcon = document.getElementById("toggleIcon");

/* Verificar que existen los elementos antes de agregar el evento */
if(togglePw && toggleIcon && txtcontrasenia){

    togglePw.addEventListener("click", () =>{

        // Si esta oculta la contraseña
        if(txtcontrasenia.type === "password"){
            // muestro contraseña
            txtcontrasenia.type = "text";
            // cambio icono de ojo tachado a ojo abierto
            toggleIcon.classList.remove("bi-eye-slash");
            toggleIcon.classList.add("bi-eye");

        }else{
            // oculta contraseña
            txtcontrasenia.type = "password";
            // cambio icono a ojo tachado
            toggleIcon.classList.remove("bi-eye");
            toggleIcon.classList.add("bi-eye-slash");
        }
    });
}

// Oculta las alertas
function ocultarAlertas(){
    [alertError, alertRed].forEach(alerta =>{
        alerta.classList.add("d-none");
    });
}

/* Función para iniciar sesión. Se utiliza async para esperar respuesta
del servidor sin bloquear la página*/
async function iniciarSesion() {
    
    ocultarAlertas();

    const usuario = txtusuario.value.trim();
    const password = txtcontrasenia.value;

    // Verificar campos
    if(!usuario || !password){
        mensCampos.textContent = "Complete todos los campos";
        mensCampos.classList.remove("d-none");
        return;
    }

    if(mensCampos){
        mensCampos.classList.add("d-none");
    }

    try{

        // Llamo método del api.js pasando usuario y contraseña al backend
        const response = await login(usuario, password);

        // Error 401 -> Mostrar mensaje
        if(response.status === 401){
            alertError.classList.remove("d-none");
            return;
        }

        // Cualquier otro error
        if(!response.ok){
            throw new Error("Error inesperado");
        }

        // Respuesta JSON a objeto
        const data = await response.json();

        if(!data.access_token){
            throw new Error("Token no recibido");
        }

        // Guarda el token JWT en localStorage
        guardarToken(data.access_token);
        console.log("Token guardado correctamente");

        /*Para comprobación (BORRAR LUEGO):
        console.log("Payload:", obtenerPayloadToken()); */

        // Se dirige al listado principal
        window.location.href = "listado.html";

    }catch (error){
        console.log(`Error: ${error}`);
        // Mensaje general de error de conexión
        alertRed.classList.remove("d-none");
    }

}

// Evento botón ingresar  
if(btnIngresar){
    btnIngresar.addEventListener("click", iniciarSesion);
}

// Otra forma de iniciar apretando tecla enter
document.addEventListener("keydown", (event) => {
    if(event.key === "Enter"){
        iniciarSesion();
    }
});
