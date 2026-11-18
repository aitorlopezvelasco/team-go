# Team GO

Constructor de equipos PvP para Pokémon GO. Una sola página, sin backend, que se publica en GitHub Pages y se actualiza sola cada martes con el meta de [PvPoke](https://github.com/pvpoke/pvpoke).

## Qué hace cada archivo

| Archivo | Para qué sirve | ¿Se edita a mano? |
|---|---|---|
| `tools/plantilla.html` | La app completa (HTML, CSS y JavaScript) sin datos. | Sí: aquí está el `CALENDARIO`. |
| `tools/build.js` | Descarga el meta de PvPoke y genera `index.html` y `sw.js`. | No |
| `.github/workflows/actualizar.yml` | Tarea de GitHub Actions: genera y publica. | No |
| `index.html` | La página publicada. La genera el build. | **No** (se sobrescribe) |
| `sw.js` | Service worker: permite abrir la app sin conexión. Lo genera el build. | **No** |
| `manifest.json`, `icono.svg`, `icono-192.png`, `icono-512.png` | Hacen que se instale como app en el móvil. | No |

## Cuándo se actualiza

- **Cada martes a las 22:30 UTC** (23:30 en la península en invierno, 00:30 en verano), después de la rotación de ligas.
- **Cada vez que guardas un cambio** en la rama `main`.
- **A mano:** pestaña *Actions* → *Actualizar y publicar Team GO* → *Run workflow*.

Si PvPoke no responde, la tarea falla y la página anterior sigue publicada.

## Lo único que hay que tocar: el calendario

PvPoke publica los rankings, pero no qué ligas están activas cada semana. Eso está en `tools/plantilla.html`, en el bloque `CALENDARIO` (busca esa palabra). Una línea por semana, fechas en UTC:

```js
{ini:'2026-12-01T21:00:00Z', fin:'2026-12-08T21:00:00Z', ligas:['great','ultra']},
```

Los nombres de `ligas` son los `id` del bloque `LIGAS`, justo encima. Las rotaciones son los martes a las 21:00 UTC. Hay que revisarlo cuando Pokémon GO anuncia una temporada nueva (cada tres meses, aproximadamente). Si el calendario caduca, la app sigue funcionando y muestra un aviso.

### Añadir una copa nueva

Añade una línea en `LIGAS` con su nombre, límite de PC, color y la ruta de su ranking en PvPoke, por ejemplo `pvpoke:'fantasy/overall/rankings-1500'`. Si la ruta no existe, el build omite esa liga sin fallar.

## Probar en local

```
node tools/build.js
npx serve .        # o: python -m http.server
```

Hace falta Node 22 o superior. No hay dependencias.

## Dónde se guardan «Mis Pokémon»

En el navegador del móvil (`localStorage`). No se sincronizan entre dispositivos y se pierden si borras los datos del sitio en Chrome.

## Aviso

GitHub desactiva las tareas programadas de un repositorio público tras 60 días sin actividad. Esta tarea guarda un commit cada semana, lo que debería mantenerla activa. Si un día deja de actualizarse, entra en *Actions* y vuelve a activarla.
