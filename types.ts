export interface Hymn  {
  id:           number  // ID de la canción
  number:       number  // número de la canción
  title:        string  // título de la canción
  mp3Url:       string  // URL del archivo mp3
  mp3UrlInstr:  string  // URL del archivo mp3 con la pista instrumental
  mp3Filename:  string  // nombre del archivo mp3
}
export interface HymnSequence   {
  id:               number  // ID de la canción
  number:           number  // número de la canción
  title:            string  // título de la canción
  mp3Url:           string  // URL del archivo mp3
  mp3UrlInstr:      string  // URL del archivo mp3 con la pista instrumental
  mp3Filename:      string  // nombre del archivo mp3
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

export interface HymnContent extends Hymn {
  lyrics:     string
}
