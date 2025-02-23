import Database, { type SQLQueryBindings } from 'bun:sqlite'
import type { CromoHandler } from 'cromo'
import type { Hymn } from '../../src/interfaces/hymn'
import type { HymnQueryResult } from '../../src/interfaces/hymn-query'

export const GET: CromoHandler = ({ query, responseInit }) => {
  const db = new Database('./src/database/himnario.db')

  const includeVerses = query['fields']?.split(',')?.includes('verses') ?? false
  const limit = query['limit'] ? parseInt(query['limit']) : null
  const page = query['page'] ? parseInt(query['page']) : null
  const search = query['search'] ? `%${query['search']}%` : null
  const offset = limit && page ? (page - 1) * limit : 0

  const hymnsQuery = `
    WITH filtered_hymns AS (
      SELECT * FROM hymn
      WHERE 
        (${search ? 'title LIKE $search OR number = $searchNumber' : '1 = 1'})
      ORDER BY number ASC
      ${limit ? 'LIMIT $limit OFFSET $offset' : ''}
    )
    SELECT 
      h.id AS hymnId, h.number AS hymnNumber, h.title, h.mp3Url, h.mp3UrlInstr, h.mp3Filename, h.bibleReference,
      v.id AS verseId, v.number AS verseNumber,
      vc.id AS contentId, vc.content, vc.ordering AS contentOrder
    FROM filtered_hymns h
    LEFT JOIN verse v ON v.hymnId = h.id
    LEFT JOIN verseContent vc ON vc.verseId = v.id
    ORDER BY h.number ASC, v.number ASC, vc.ordering ASC
  `

  const params: SQLQueryBindings = {
    ...(search ? { $search: search, $searchNumber: parseInt(query['search']) || 0 } : {}),
    ...(limit ? { $limit: limit, $offset: offset } : {}),
  }

  const results = db.query<HymnQueryResult, SQLQueryBindings[]>(hymnsQuery).all(params)

  const hymnsMap = new Map<number, Hymn>()

  for (const row of results) {
    if (!hymnsMap.has(row.hymnId)) {
      hymnsMap.set(row.hymnId, {
        id: row.hymnId,
        number: row.hymnNumber,
        title: row.title,
        mp3Url: row.mp3Url,
        mp3UrlInstr: row.mp3UrlInstr,
        mp3Filename: row.mp3Filename,
        bibleReference: row.bibleReference,
        verses: includeVerses ? [] : undefined,
      })
    }

    if (includeVerses && row.verseId) {
      const hymn = hymnsMap.get(row.hymnId)!
      let verse = hymn.verses?.find((v) => v.id === row.verseId)

      if (!verse) {
        verse = {
          id: row.verseId,
          number: row.verseNumber,
          contents: [],
        }
        hymn.verses?.push(verse)
      }

      if (row.content) {
        verse.contents?.push({
          id: row.contentId,
          content: row.content,
          order: row.contentOrder,
        })
      }
    }
  }

  hymnsMap.forEach((hymn) => {
    if (hymn.verses) {
      hymn.verses.forEach((verse) => {
        verse.contents?.sort((a, b) => a.order - b.order)
      })
    }
  })

  return Response.json(Array.from(hymnsMap.values()), responseInit)
}
