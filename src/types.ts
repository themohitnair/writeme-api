import { z } from "zod";

export const RepoData = z.object({
    owner: z.string(),
    repository: z.string(),
    branch: z.string(),
    installation_id: z.string()
})