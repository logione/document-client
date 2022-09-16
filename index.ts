import { createInterface } from 'readline/promises'

import * as logioneCLient from './logione-document-client'
import * as tokenFileHandler from './tokenFileHandler'
import * as searchQuery from './search-query'

export const LogiONEDocumentClient = logioneCLient.LogiONEDocumentClient
export const SearchQuery = searchQuery.SearchQuery
export type ColumnFilter = searchQuery.ColumnFilter
export const readTokenFromFile = tokenFileHandler.readTokenFromFile
export const getSaveTokenToFileHandler = tokenFileHandler.getSaveTokenToFileHandler

export async function createLogiONEDocumentClient(config: { tokenFilePath?: string, apiUrl?: string, token?: string }) {
    let token: string | undefined
    try {
        token = await readTokenFromFile(config.tokenFilePath)
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
        token = await rl.question('Please enter your API token: ')
    }
    return new LogiONEDocumentClient(token, getSaveTokenToFileHandler(config.tokenFilePath), config.apiUrl)
}
