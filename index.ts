import { createInterface } from 'readline/promises'

import { LogiONEDocumentClient }from './logione-document-client'
import { readTokenFromFile, getSaveTokenToFileHandler } from './tokenFileHandler'
import { SearchQuery, ColumnFilter } from './search-query'

export { 
    LogiONEDocumentClient,
    SearchQuery,
    ColumnFilter,
    readTokenFromFile,
    getSaveTokenToFileHandler,
}

export async function createLogiONEDocumentClient(config?: { tokenFilePath?: string, apiUrl?: string, token?: string }) {
    let token: string | undefined
    try {
        token = await readTokenFromFile(config?.tokenFilePath)
    } catch {
    }
    if (!token) {
        token = config?.token
    }
    if (!token) {
        token = process.env.LOGIONE_DOCUMENT_API_TOKEN
    }
    while (!token) {
        const rl = createInterface(process.stdin, process.stdout)
        token = await rl.question('Please enter your API token: ')
    }
    return new LogiONEDocumentClient(token, getSaveTokenToFileHandler(config?.tokenFilePath), config?.apiUrl)
}
