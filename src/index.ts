import { fromHono } from "chanfana"
import { GenerateREADME } from "endpoints/readme"
import { Hono } from "hono"

const app = new Hono()

const openapi = fromHono(app, {
	docs_url: "/",
})

openapi.get("/readmegen/", GenerateREADME)

export default app