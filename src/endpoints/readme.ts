import { z } from "zod"
import { OpenAPIRoute } from "chanfana"
import { RepoData } from "../types"

export class GenerateREADME extends OpenAPIRoute {
    schema = {
        tags: ["README"],
        summary: "Generate a README from Repository Content fetched through GitHub API via the writeme-bot GitHub App.",
        request: {
            query: RepoData
        },
        responses: {
            "200": {
                description: "Returns repository code as a record",
                content: {
                    "application/json": {
                        success: z.literal(true),
                        schema: z.record(z.string(), z.string())
                    }
                }
            },
            "404": {
                description: "Repository not found",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: z.literal(false),
                            error: z.string()
                        })
                    }
                }
            }
        }
    }
}