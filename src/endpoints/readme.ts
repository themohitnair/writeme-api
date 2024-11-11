import { z } from "zod"
import { OpenAPIRoute } from "chanfana"
import { RepoData } from "../types"
import { getInstallationToken } from "utils"

export class GenerateREADME extends OpenAPIRoute {
    schema = {
        tags: ["README"],
        summary: "Generate a README from Repository Content fetched through GitHub API via the writeme-bot GitHub App.",
        request: {
            query: RepoData,
        },
        responses: {
            "200": {
                description: "Returns repository code as a record",
                content: {
                    "application/json": {
                        success: z.literal(true),
                        schema: z.record(z.string(), z.string()),
                    },
                },
            },
            "404": {
                description: "Repository not found",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: z.literal(false),
                            error: z.string(),
                        }),
                    },
                },
            },
        },
    };

    async handle(c) {
        const data = await this.getValidatedData<typeof this.schema>();
        const { owner, repository, branch, installation_id } = data.query

        let token;
        try {
            token = await getInstallationToken(installation_id);
        } catch (error) {
            return c.json({
                success: false,
                error: `Failed to get GitHub installation token: ${error.message}`,
            }, { status: 403 })
        }

        const repoRecord: Record<string, string> = {};

        const excludedPaths = [
            "node_modules", ".git", ".DS_Store", ".venv", "vendor", "build", "__pycache__", "target", "dist", "out", "logs", "*.log", "*.tmp", "*.swp", "*.class", "*.mod", ".sum"
        ]

        async function fetchRepoContent(path = "") {
            const url = `https://api.github.com/repos/${owner}/${repository}/contents/${path}?ref=${branch}`;
            const res = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                throw new Error(`Failed to fetch content at ${path}`)
            }

            const data = await res.json()

            if (!Array.isArray(data)) {
                throw new Error("Expected data to be an array, received a non-iterable type")
            }

            for (const item of data) {
                const { type, path, download_url } = item

                if (excludedPaths.some(exclusion => path.includes(exclusion))) {
                    continue
                }

                if (type === "file") {
                    const fileRes = await fetch(download_url)
                    if (!fileRes.ok) continue

                    const fileContent = await fileRes.text()
                    repoRecord[path] = fileContent
                } else if (type === "dir") {
                    await fetchRepoContent(path)
                }
            }
        }

        try {
            await fetchRepoContent()
            return c.json(repoRecord)
        } catch (error) {
            return c.json({
                success: false,
                error: `Error fetching repository: ${error.message}`,
            }, { status: 404 })
        }
    }
}