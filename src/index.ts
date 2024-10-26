import { cors } from "./cors"

export default {
	async fetch(request, env, _ctx): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    if (path === '/hymn') {
      const { results } = await env.DB.prepare('SELECT id, number, title, mp3Url, mp3UrlInstr, mp3Filename FROM hymn').all()
      return Response.json(results, { headers: cors })
    } else if (path.startsWith("/hymn/")) {
      const id = path.split('/')[2]
  
      const hymn = await env.DB.prepare(`
        SELECT id, number, title, mp3Url, mp3UrlInstr, mp3Filename
        FROM hymn
        WHERE id = ?1
      `)
        .bind(id)
        .first()
  
      if (!hymn) {
        return Response.json({ error: 'Hymn not found' }, { status: 404, headers: cors })
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
  
      return Response.json({ ...hymn, verses, sequence }, { headers: cors })
    }

    return Response.json({ error: 'Not found' }, { status: 404, headers: cors })
	},
} satisfies ExportedHandler<Env>
