export interface Hymn {
  id: number
  number: number
  title: string
  mp3Url: string
  mp3UrlInstr: string
  mp3Filename: string
  bibleReference: string
  verses?: Verse[]
}

export interface Verse {
  id: number
  number: number
  contents?: VerseContent[]
}

export interface VerseContent {
  id: number
  content: string
  order: number
}

export interface VerseSequence {
  id: number
  timestamp: number
  verseContentId: number
  verseId: number
}
