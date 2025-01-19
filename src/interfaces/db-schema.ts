export interface Hymn {
  id: number
  number: number
  title: string
  mp3Url: string
  mp3UrlInstr: string
  mp3Filename: string
  bibleReference: string
}

export interface Verse {
  id: number
  number: number
}

export interface VerseSequence {
  id: number
  timestamp: number
  verseContentId: number
  verseId: number
}
