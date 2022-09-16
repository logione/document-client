import { readFile, writeFile } from 'fs/promises'

export const DEFAULT_TOKEN_FILE_PATH = '.logione-document-api-token'

export async function readTokenFromFile(file = DEFAULT_TOKEN_FILE_PATH): Promise<string> {
    return await readFile(file, 'utf8')
}

export function getSaveTokenToFileHandler(file = DEFAULT_TOKEN_FILE_PATH): (token: string) => Promise<void> {
    return async (token: string) => {
        await writeFile(file, token)
    }
}
