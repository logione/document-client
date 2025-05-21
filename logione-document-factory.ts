import { createInterface } from 'readline/promises'
import { DEFAULT_API_URL, LogiONEDocumentClient } from './logione-document-client'
import { DEFAULT_TOKEN_FILE_PATH, getSaveTokenToFileHandler, readTokenFromFile } from './tokenFileHandler'

export async function createLogiONEDocumentClient(config: { tokenFilePath?: string, apiUrl?: string, token?: string } = {}) {
    if (!config.tokenFilePath) {
        config.tokenFilePath = DEFAULT_TOKEN_FILE_PATH
    }
    if (!config.apiUrl) {
        config.apiUrl = DEFAULT_API_URL
    }

    let token: string | undefined
    try {
        token = await readTokenFromFile(config?.tokenFilePath)
    } catch {
    }
    if (!token) {
        token = config.token
    }
    if (!token) {
        token = process.env.LOGIONE_DOCUMENT_API_TOKEN
    }
    while (!token) {
        const rl = createInterface(process.stdin, process.stdout)
        token = await rl.question('Please enter your LogiONE API token: ')
    }
    return new LogiONEDocumentClient(token, getSaveTokenToFileHandler(config.tokenFilePath), config.apiUrl)
}
