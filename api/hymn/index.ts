import Database, { type SQLQueryBindings } from 'bun:sqlite'
import type { CromoHandler } from 'cromo'
import type { Hymn, Verse } from '../../src/interfaces/db-schema'

export const GET: CromoHandler = ({ query, responseInit }) => {
  const fields = query['fields']?.split(',') ?? []

  const db = new Database('./src/database/himnario.db')

  let hymns = db
    .query<Hymn, SQLQueryBindings[]>(
      'SELECT id, number, title, mp3Url, mp3UrlInstr, mp3Filename, bibleReference FROM hymn',
    )
    .all()

  if (fields.includes('verses')) {
    hymns = hymns.map((hymn) => {
      let verses = db
        .query<Verse, SQLQueryBindings[]>(`
          SELECT id, number
          FROM verse
          WHERE hymnId = ?1
          ORDER BY number ASC
        `)
        .all(hymn.id)

      verses = verses.map((verse) => {
        const contents = db
          .query(`
            SELECT id, content
            FROM verseContent
            WHERE verseId = ?1
            ORDER BY ordering ASC
          `)
          .all(verse.id)

        return { ...verse, contents }
      })

      return { ...hymn, verses }
    })
  }

  return Response.json(hymns, responseInit)
}
