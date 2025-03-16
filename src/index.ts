import { cors } from "./cors"

export default {
  async fetch(request, env, _ctx): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname
    const fields = url.searchParams.get('fields')?.split(',') ?? []

    const headers = {
      ...cors,
      'Cache-Control': 'public, max-age=31536000, immutable',
    }

    if (path === '/hymn') {
      const includeVerses = fields.includes('verses')

      let query = `
        SELECT 
          h.id AS hymnId, h.number AS hymnNumber, h.title, h.mp3Url, h.mp3UrlInstr, h.mp3Filename, h.bibleReference
          ${includeVerses ? `,
          v.id AS verseId, v.number AS verseNumber, 
          vc.id AS contentId, vc.content
          ` : ''}
        FROM hymn h
          ${includeVerses ? `
          LEFT JOIN verse v ON v.hymnId = h.id
          LEFT JOIN verseContent vc ON vc.verseId = v.id
          ` : ''}
        ORDER BY h.id, v.number, vc.ordering
      `

      const { results } = await env.DB.prepare(query).all()

      const hymnsMap = new Map()

      results.forEach(row => {
        if (!hymnsMap.has(row.hymnId)) {
          hymnsMap.set(row.hymnId, {
            id: row.hymnId,
            number: row.hymnNumber,
            title: row.title,
            mp3Url: row.mp3Url,
            mp3UrlInstr: row.mp3UrlInstr,
            mp3Filename: row.mp3Filename,
            bibleReference: row.bibleReference,
            verses: includeVerses ? [] : undefined
          })
        }

        if (includeVerses && row.verseId) {
          let hymn = hymnsMap.get(row.hymnId)
          let verse = hymn.verses.find(v => v.id === row.verseId)

          if (!verse) {
            verse = {
              id: row.verseId,
              number: row.verseNumber,
              contents: []
            }
            hymn.verses.push(verse)
          }

          if (row.contentId && row.content) {
            verse.contents.push({
              id: row.contentId,
              content: row.content
            })
          }
        }
      })

      return Response.json([...hymnsMap.values()], { headers })
    } else if (path.startsWith("/hymn/")) {
      const id = path.split('/')[2]
  
      const hymn = await env.DB.prepare(`
        SELECT id, number, title, mp3Url, mp3UrlInstr, mp3Filename, bibleReference
        FROM hymn
        WHERE id = ?1
      `)
        .bind(id)
        .first()
  
      if (!hymn) {
        return Response.json({ error: 'Hymn not found' }, { status: 404, headers })
      }
  
      const { results: verses } = await env.DB.prepare(`
        SELECT id, number
        FROM verse
        WHERE hymnId = ?1
        ORDER BY number ASC
      `)
        .bind(id)
        .all()
  
      for (const verse of verses) {
        const { results: contents } = await env.DB.prepare(`
          SELECT id, content
          FROM verseContent
          WHERE verseId = ?1
          ORDER BY ordering ASC
        `)
          .bind(verse['id'])
          .all()
        verse['contents'] = contents
      }
  
      const { results: sequence  } = await env.DB.prepare(`
        SELECT vs.id, vs.timestamp, vs.verseContentId, vc.verseId
        FROM verseSequence vs
          INNER JOIN verseContent vc ON vc.id = vs.verseContentId
          INNER JOIN verse v ON v.id = vc.verseId
        WHERE v.hymnId = ?1
        ORDER BY vs.position ASC
      `).bind(id).all()
  
      return Response.json({ ...hymn, verses, sequence }, { headers })
    }

    return Response.json({ error: 'Not found' }, { status: 404, headers })
  },
} satisfies ExportedHandler<Env>
