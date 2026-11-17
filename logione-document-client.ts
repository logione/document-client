import { IRestClient, RestClient } from '@logi.one/rest-client'

import { SearchQuery } from './search-query'

export const DEFAULT_API_URL = 'https://doc.logi.one/api/v2'

export class LogiONEDocumentClient {
    private readonly client: RestClient

    private firstAccessTokenPromise: Promise<void> | undefined

    constructor(
        private token: string,
        private readonly saveTokenHandler : (refreshToken: string) => Promise<void> | void,
        apiUrl = DEFAULT_API_URL) {
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
        return this.run(() => this.client.getJSON<T>(resource))
    }

    post<T>(resource: string, data: unknown): Promise<T> {
        return this.run(() => this.client.postJSON<T>(resource, { body: data }))
    }

    put<T>(resource: string, data: unknown): Promise<T> {
        return this.run(() => this.client.putJSON<T>(resource, { body: data }))
    }

    delete<T>(resource: string): Promise<T> {
        return this.run(() => this.client.deleteJSON<T>(resource))
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

    private async run<T>(request: () => Promise<T>): Promise<T> {
        // onUnauthorized only renews a token that was sent, so the first access token is fetched here
        if (!this.client.token) {
            await this.getFirstAccessToken()
        }
        return request()
    }

    private getFirstAccessToken(): Promise<void> {
        if (!this.firstAccessTokenPromise) {
            this.firstAccessTokenPromise = (async () => {
                try {
                    this.client.token = await this.renewAccessToken(this.client)
                } finally {
                    this.firstAccessTokenPromise = undefined
                }
            })()
        }
        return this.firstAccessTokenPromise
    }

    private async renewAccessToken(client: IRestClient): Promise<string> {
        const { access_token, refresh_token } = await client.postJSON<{ access_token: string, refresh_token: string }>(
            'auth/token',
            { body: { grant_type: 'refresh_token', refresh_token: this.token }, token: '' }
        )
        this.token = refresh_token
        await this.saveTokenHandler(this.token)
        return access_token
    }
}
