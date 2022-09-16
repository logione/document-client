import { readFile, writeFile } from 'fs/promises'

export async function readTokenFromFile(file = '.logione-document-api-token'): Promise<string> {
    return await readFile(file, 'utf8')
}

export function getSaveTokenToFileHandler(file = '.logione-document-api-token'): (token: string) => Promise<void> {
    return async (token: string) => {
        await writeFile(file, token)
    }
}
