import { createInterface } from 'node:readline/promises'
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
    if (!token) {
        const rl = createInterface(process.stdin, process.stdout)
        // If the input ends (Ctrl+D, end of piped input), cancel the pending question:
        // otherwise it never resolves and the process exits silently.
        const inputClosed = new AbortController()
        rl.on('close', () => inputClosed.abort())
        try {
            while (!token) {
                token = (await rl.question('Please enter your LogiONE API token: ', { signal: inputClosed.signal })).trim()
            }
        } catch (err) {
            if (inputClosed.signal.aborted) {
                throw new Error('No LogiONE API token provided')
            }
            throw err
        } finally {
            rl.close()
        }
    }
    return new LogiONEDocumentClient(token, getSaveTokenToFileHandler(config.tokenFilePath), config.apiUrl)
}
