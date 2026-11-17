import { IRestClient, RestClient } from '@logi.one/rest-client'

import { SearchQuery } from './search-query'
import { DEFAULT_TOKEN_FILE_PATH, TokenStorage, createTokenFileStorage, findToken } from './token-storage'

export const DEFAULT_API_URL = 'https://doc.logi.one/api/v2'

export class LogiONEDocumentClient {
    private readonly client: RestClient

    /**
     * Creates a client and gets its first access token, so an invalid API token fails here.
     * The API token is loaded from the token storage (a file by default), the LOGIONE_DOCUMENT_API_TOKEN
     * environment variable or a prompt, and the new one is saved to the token storage after every refresh.
     */
    static async create(tokenFilePath?: string, apiUrl?: string): Promise<LogiONEDocumentClient>
    static async create(tokenStorage: TokenStorage, apiUrl?: string): Promise<LogiONEDocumentClient>
    static async create(tokenConfig?: string | TokenStorage, apiUrl?: string): Promise<LogiONEDocumentClient> {
        let tokenStorage: TokenStorage
        if (tokenConfig && typeof tokenConfig === 'object') {
            tokenStorage = tokenConfig
        } else {
            tokenStorage = createTokenFileStorage(tokenConfig || DEFAULT_TOKEN_FILE_PATH)
        }
        const token = await findToken(tokenStorage)
        const documentClient = new LogiONEDocumentClient(token, tokenStorage, apiUrl || DEFAULT_API_URL)
        documentClient.client.token = await documentClient.renewAccessToken(documentClient.client)
        return documentClient
    }

    private constructor(
        private token: string,
        private readonly tokenStorage: TokenStorage,
        apiUrl: string) {
        this.client = new RestClient({
            baseUrl: apiUrl,
            retry: 2,
            onUnauthorized: (_error, client) => this.renewAccessToken(client)
        })
    }

    search<T>(resource: string, query: SearchQuery): Promise<T[]> {
        const searchParams = this.searchQueryToString(query)
        if (searchParams) {
            return this.get<T[]>(`${resource}?${searchParams}`)
        } else {
            return this.get<T[]>(resource)
        }
    }

    get<T>(resource: string): Promise<T> {
        return this.client.getJSON<T>(resource)
    }

    post<T>(resource: string, data: unknown): Promise<T> {
        return this.client.postJSON<T>(resource, { body: data })
    }

    put<T>(resource: string, data: unknown): Promise<T> {
        return this.client.putJSON<T>(resource, { body: data })
    }

    delete<T>(resource: string): Promise<T> {
        return this.client.deleteJSON<T>(resource)
    }

    searchQueryToString(query: SearchQuery): string {
        const searchParams = new URLSearchParams()
        if (query.complete) {
            searchParams.append('complete', query.complete.toString())
        }
        if (query.limit !== undefined && query.limit > 0) {
            searchParams.append('limit', query.limit.toString())
        }
        if (query.skip !== undefined && query.skip > 0) {
            searchParams.append('skip', query.skip.toString())
        }
        if (query.sortAsc === false) {
            searchParams.append('asc', 'false')
        }
        if (query.sortColumn) {
            searchParams.append('sort', query.sortColumn)
        }
        if (query.text) {
            searchParams.append('text', query.text)
        }
        if (query.columnFilters) {
            for (const filter of query.columnFilters) {
                let type: string
                let value: string | number | boolean
                switch (typeof filter.value) {
                    case 'number':
                        type = 'n'
                        value = filter.value
                        break
                    case 'boolean':
                        type = 'b'
                        value = filter.value
                        break
                    case 'object':
                        if (typeof filter.value.min === 'number') {
                            type = 'r'
                        } else {
                            type = 'i'
                        }
                        value = `${filter.value.min},${filter.value.max}`
                        break
                    default:
                        type = 's'
                        value = filter.value
                        break
                }
                searchParams.append('filter', `${filter.match ? '' : '-'}${type}${filter.column}:${value}`)
            }
        }
        return searchParams.toString().replace(/%3A/g, ':')
    }

    private async renewAccessToken(client: IRestClient): Promise<string> {
        const { access_token, refresh_token } = await client.postJSON<{ access_token: string, refresh_token: string }>(
            'auth/token',
            { body: { grant_type: 'refresh_token', refresh_token: this.token }, token: '' }
        )
        this.token = refresh_token
        await this.tokenStorage.save(this.token)
        return access_token
    }
}
