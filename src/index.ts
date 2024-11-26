import { Client, createHandle } from "@buape/carbon"
import { createHandler } from "@buape/carbon/adapters/cloudflare"
import KanbanCommand from "./commands/kanban.js"

export type Env = {
	DISCORD_CLIENT_ID: string
	DISCORD_PUBLIC_KEY: string
	DISCORD_BOT_TOKEN: string
	DEPLOY_SECRET: string
	db: KVNamespace
}

const handle = createHandle((env) => {
	const client = new Client(
		{
			baseUrl: "https://kanban.theshadow.workers.dev",
			clientId: String(env.DISCORD_CLIENT_ID),
			publicKey: String(env.DISCORD_PUBLIC_KEY),
			token: String(env.DISCORD_BOT_TOKEN),
			deploySecret: String(env.DEPLOY_SECRET)
		},
		[
			new KanbanCommand(env as unknown as Env),
		]
	)
	return [client]
})

const handler = createHandler(handle)
export default { fetch: handler }