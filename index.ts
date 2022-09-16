import { createInterface } from 'readline/promises'

import * as logioneCLient from './logione-client'
import * as tokenFileHandler from './tokenFileHandler'
import * as searchQuery from './search-query'

export const LogiONEClient = logioneCLient.LogiONEClient
export const SearchQuery = searchQuery.SearchQuery
export type ColumnFilter = searchQuery.ColumnFilter
export const readTokenFromFile = tokenFileHandler.readTokenFromFile
export const getSaveTokenToFileHandler = tokenFileHandler.getSaveTokenToFileHandler

export async function createLogiONEClient(config: { tokenFilePath?: string, apiUrl?: string, token?: string }) {
    let token: string | undefined = await readTokenFromFile(config.tokenFilePath)
    if (!token) {
        token = config.token
    }
    while (!token) {
        const rl = createInterface(process.stdin, process.stdout)
        token = await rl.question('Please enter your API token: ')
    }
    return new LogiONEClient(token, getSaveTokenToFileHandler(config.tokenFilePath), config.apiUrl)
}
