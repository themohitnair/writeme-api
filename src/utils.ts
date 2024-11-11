import { SignJWT, importPKCS8 } from "jose";
import { env } from "process"

const privateKey = env.GH_PK
const appID = env.GH_APP_ID

interface GitHubInstallationTokenResponse {
    token: string;
}

async function generateJWT() {
    const key = await importPKCS8(privateKey, "RS256");

    const jwt = await new SignJWT({iss: appID})
    .setProtectedHeader({alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(key)

    return jwt
}

export async function getInstallationToken(installationID) {
    const jwt = await generateJWT()

    const res = await fetch(`https://api.github.com/app/installations/${installationID}/access_tokens`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${jwt}`,
            'Accept': 'application/vnd.github+json',
        },
    })

    if (!res.ok) {
        throw new Error("Failed to fetch Installation Access Token.")
    }

    const data: GitHubInstallationTokenResponse = await res.json()
    return data.token
}