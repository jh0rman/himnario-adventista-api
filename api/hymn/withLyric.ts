import Database from 'bun:sqlite'
import type { CromoHandler } from 'cromo'
import type { Hymn, HymnContent } from '../../types'

export const GET: CromoHandler = ({ responseInit }) => {
  const db = new Database('./src/database/himnario.db')
  const hymnsDb = db.query(
    'SELECT id, number, title, mp3Url, mp3UrlInstr, mp3Filename FROM hymn',
  ).all() as Hymn[]
  const hymnWithLyrics:HymnContent[] = hymnsDb.map(hymn => {
    const lyrics = db.query(
      `SELECT vc.content 
          FROM verseContent vc
          INNER JOIN verse v ON vc.verseId = v.id
      WHERE v.hymnId = ?1`,
    ).all(hymn.id).map((verseContent:any) => verseContent.content).join('\n')
    return {
      ...hymn,
      lyrics
    }
  })
  
  return Response.json(hymnWithLyrics, responseInit)
}
