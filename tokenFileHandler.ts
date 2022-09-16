import { readFile, writeFile } from 'fs/promises'

export async function readTokenFromFile(file = '.token'): Promise<string> {
    return await readFile(file, 'utf8')
}

export function getSaveTokenToFileHandler(file = '.token'): (token: string) => Promise<void> {
    return async (token: string) => {
        await writeFile(file, token)
    }
}
