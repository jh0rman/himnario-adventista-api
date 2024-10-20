
export default {
	async fetch(_request, env, _ctx): Promise<Response> {
		// const url = new URL(request.url);
    // const path = url.pathname;

    const { results } = await env.DB.prepare(
        "SELECT * FROM hymn"
      )
        .all();
    return Response.json(results);
	},
} satisfies ExportedHandler<Env>;
