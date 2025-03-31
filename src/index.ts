import { cors } from "./cors"

export default {
  async fetch(request, env, _ctx): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname
    const fields = url.searchParams.get('fields')?.split(',') ?? []
    const includeVerses = fields.includes('verses')
    const search = url.searchParams.get('search')
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : null
    const page = url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!) : null
    const offset = limit && page ? (page - 1) * limit : 0

    const headers = {
      ...cors,
      'Cache-Control': 'public, max-age=31536000, immutable',
    }

    if (path === '/hymn') {
      let query = `
        WITH filtered_hymns AS (
          SELECT * FROM hymn
          WHERE 
            (${search ? 'title LIKE ?1 OR number = ?2' : '1 = 1'})
          ORDER BY number ASC
          ${limit ? 'LIMIT ?3 OFFSET ?4' : ''}
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

      const params = [
        ...(search ? [`%${search}%`, parseInt(search) || 0] : []),
        ...(limit ? [limit, offset] : []),
      ]

      const { results } = await env.DB.prepare(query).bind(...params).all()
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
          const hymn = hymnsMap.get(row.hymnId)
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
              content: row.content,
              order: row.contentOrder
            })
          }
        }
      })

      hymnsMap.forEach(hymn => {
        if (hymn.verses) {
          hymn.verses.forEach(verse => {
            verse.contents.sort((a, b) => a.order - b.order)
          })
        }
      })

      return Response.json([...hymnsMap.values()], { headers })
    } 
    
    else if (path.startsWith("/hymn/")) {
      const id = path.split('/')[2]
  
      const hymn = await env.DB.prepare(`
        SELECT id, number, title, mp3Url, mp3UrlInstr, mp3Filename, bibleReference
        FROM hymn
        WHERE id = ?1
      `).bind(id).first()
  
      if (!hymn) {
        return Response.json({ error: 'Hymn not found' }, { status: 404, headers })
      }
  
      const { results: verses } = await env.DB.prepare(`
        SELECT v.id, v.number, vc.id AS contentId, vc.content, vc.ordering AS contentOrder
        FROM verse v
        LEFT JOIN verseContent vc ON vc.verseId = v.id
        WHERE v.hymnId = ?1
        ORDER BY v.number ASC, vc.ordering ASC
      `).bind(id).all()

      const verseMap = new Map()

      for (const row of verses) {
        if (!verseMap.has(row.id)) {
          verseMap.set(row.id, {
            id: row.id,
            number: row.number,
            contents: [],
          })
        }
        if (row.contentId && row.content) {
          verseMap.get(row.id).contents.push({
            id: row.contentId,
            content: row.content,
            order: row.contentOrder
          })
        }
      }

      verseMap.forEach(verse => {
        verse.contents.sort((a, b) => a.order - b.order)
      })

      const { results: sequence  } = await env.DB.prepare(`
        SELECT vs.id, vs.timestamp, vs.verseContentId, vc.verseId
        FROM verseSequence vs
        INNER JOIN verseContent vc ON vc.id = vs.verseContentId
        INNER JOIN verse v ON v.id = vc.verseId
        WHERE v.hymnId = ?1
        ORDER BY vs.position ASC
      `).bind(id).all()
  
      return Response.json({ ...hymn, verses: [...verseMap.values()], sequence }, { headers })
    }

    return Response.json({ error: 'Not found' }, { status: 404, headers })
  },
} satisfies ExportedHandler<Env>
