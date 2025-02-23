import Database, { type SQLQueryBindings } from 'bun:sqlite'
import type { CromoHandler } from 'cromo'
import type { Hymn, Verse, VerseContent, VerseSequence } from '../../src/interfaces/hymn'

export const GET: CromoHandler = ({ params, responseInit }) => {
  const { id } = params

  const db = new Database('./src/database/himnario.db')

  const hymn = db
    .query<Hymn, SQLQueryBindings>(
      'SELECT id, number, title, mp3Url, mp3UrlInstr, mp3Filename, bibleReference FROM hymn WHERE id = ?1',
    )
    .get(id)

  if (!hymn) {
    return Response.json({ error: 'Hymn not found' }, 404)
  }

  let verses = db
    .query<Verse, SQLQueryBindings[]>(` 
      SELECT id, number
      FROM verse
      WHERE hymnId = ?1
      ORDER BY number ASC
    `)
    .all(id)

  verses = verses.map((verse) => {
    const contents = db
      .query<VerseContent, SQLQueryBindings[]>(`
        SELECT id, content
        FROM verseContent
        WHERE verseId = ?1
        ORDER BY ordering ASC
      `)
      .all(verse.id)

    return { ...verse, contents }
  })

  const sequence = db
    .query<VerseSequence, SQLQueryBindings[]>(`
      SELECT vs.id, vs.timestamp, vs.verseContentId, vc.verseId
      FROM verseSequence vs
      	INNER JOIN verseContent vc ON vc.id = vs.verseContentId
        INNER JOIN verse v ON v.id = vc.verseId
      WHERE v.hymnId = ?1
      ORDER BY vs.position ASC
    `)
    .all(id)

  return Response.json({ ...hymn, verses, sequence }, responseInit)
}
