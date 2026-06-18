# Fix necesario en el repo del frontend

Repo: `Agus-tina/Proyecto-Inventario-EGI`, rama `frontend`

---

## Archivo: `formulario.html`

En el último commit ("añadir campo mesa en formulario y manejarlo en JS")
el `src` del script quedó vacío. El formulario carga sin JavaScript y no
funciona.

**Línea 295 — cambiar:**

```html
<!-- antes (roto): -->
<script type="module" src=""></script>

<!-- después: -->
<script type="module" src="formulario.js"></script>
```

---

## Por qué `formulario.js` y no `js/formulario.js`

El mismo commit agregó un `formulario.js` en la raíz del repo con el
soporte completo del campo mesa (`fMesa`). El archivo `js/formulario.js`
también existe pero tiene `mesa: null` hardcodeado — le faltó la
actualización.

Opciones (cualquiera de las dos sirve):

**Opción A** — apuntar al archivo de la raíz (mínimo cambio):
```html
<script type="module" src="formulario.js"></script>
```

**Opción B** — mantener la convención `js/` (más consistente con el resto):
1. Copiar el contenido de `formulario.js` (raíz) a `js/formulario.js`
2. Borrar `formulario.js` de la raíz
3. Dejar el script tag como estaba originalmente:
```html
<script type="module" src="js/formulario.js"></script>
```

---

## Estado actual en producción

El bug fue parcheado manualmente en el pod de Minikube para que la demo
funcione. El próximo `git push` + deploy va a sobrescribir el parche,
así que hay que commitar el fix antes del próximo despliegue.
