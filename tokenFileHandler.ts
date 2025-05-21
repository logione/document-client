import { readFile, writeFile } from 'fs/promises'

export const DEFAULT_TOKEN_FILE_PATH = '.logione-document-api-token'

export async function readTokenFromFile(file = DEFAULT_TOKEN_FILE_PATH): Promise<string> {
    return await readFile(file, 'utf8')
}

export function getSaveTokenToFileHandler(file = DEFAULT_TOKEN_FILE_PATH): (token: string) => Promise<void> {
    const saveHandler = async (token: string, tryNumber: number = 0) => {
        try {
            await writeFile(file, token)
        } catch (err) {
            tryNumber++
            if (tryNumber > 10) {
                throw err
            }
            await new Promise((resolve) => setTimeout(resolve, 100 * tryNumber))
            await saveHandler(token, tryNumber)
        }
    }
    return saveHandler
}
