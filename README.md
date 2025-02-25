# Himnario Adventista API

### ¿Qué es?

Es una API que permite obtener la letra y la música (instrumental y cantado) de las canciones del Himnario Adventista **Edición 2009**.

### ¿Cómo usarla?

La API se encuentra en la siguiente dirección: <https://sdah.my.to/hymn>.

> ⚠️ Esta API está en constante desarrollo y puede cambiar en cualquier momento.

### ¿Dónde está hosteada la música?

La música está hosteada en [Google Drive](https://drive.google.com/drive/folders/13Nvg5c6K7sR0gcOxYQk-BXoRkR82nzJV?usp=sharing) y está disponible para su descarga.

## Endpoints

| Método | Endpoint | Descripción |
| --- | --- | --- |
| ![GET](https://img.shields.io/badge/GET-0D96F6?style=for-the-badge) | [/hymn](https://sdah.my.to/hymn) | Devuelve un `Array` con todas las canciones. |

### Parámetros opcionales

Estos parámetros pueden usarse en `/hymn` para modificar la respuesta:

- **`page`** y **`limit`**: se deben usar juntos para activar la paginación.
  - `page`: número de la página.
  - `limit`: cantidad de himnos por página.
  
  **Ejemplo:** `/hymn?page=1&limit=5` devuelve los primeros 5 himnos.

- **`search`**: búsqueda por número o título del himno.
  
  **Ejemplo:** `/hymn?search=señor` devuelve todos los himnos que contengan "señor" en el título.

- **`fields`**: selecciona qué campos incluir en la respuesta. Valores posibles:
  - `verses`: incluye las estrofas y su contenido.
  
  **Ejemplo:** `/hymn?fields=verses` devuelve los himnos con sus estrofas.

### Responses

| Código | Response |
| --- | --- |
| ![200](https://img.shields.io/badge/200-00C853?style=for-the-badge) | [Hymn[]](#esquemas) |

---

| Método | Endpoint | Descripción |
| --- | --- | --- |
| ![GET](https://img.shields.io/badge/GET-0D96F6?style=for-the-badge) | [/hymn/:number](https://sdah.my.to/hymn/1) | Devuelve el contenido de la canción y la secuencia de estrofas. |

### Responses

| Código | Response |
| --- | --- |
| ![200](https://img.shields.io/badge/200-00C853?style=for-the-badge) | [HymnSequence](#esquemas) |
| ![404](https://img.shields.io/badge/404-FF1744?style=for-the-badge) | Hymn not found |

## Esquemas

```typescript
interface Hymn = {
  id:             number  // ID de la canción
  number:         number  // número de la canción
  title:          string  // título de la canción
  mp3Url:         string  // URL del archivo mp3
  mp3UrlInstr:    string  // URL del archivo mp3 con la pista instrumental
  mp3Filename:    string  // nombre del archivo mp3
  bibleReference: string // referencia bíblica asociada al himno
}
```

```typescript
interface HymnSequence =  {
  id:               number  // ID de la canción
  number:           number  // número de la canción
  title:            string  // título de la canción
  mp3Url:           string  // URL del archivo mp3
  mp3UrlInstr:      string  // URL del archivo mp3 con la pista instrumental
  mp3Filename:      string  // nombre del archivo mp3
  bibleReference:   string // referencia bíblica asociada al himno
  verses: {
    id:             number  // ID de la estrofa
    number:         number  // número de la estrofa (0 si es el coro)
    contents: {
      id:           number  // ID del contenido
      content:      string  // contenido de la estrofa
    }[]
  }[]
  sequence: {
    id:             number  // ID de la secuencia
    timestamp:      number  // marca de tiempo en milisegundos del mp3
    verseId:        number  // ID de la estrofa
    verseContentId: number  // ID del contenido de la estrofa
  }[]
}
```
