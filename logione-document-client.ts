import { getJSON, postJSON, putJSON, deleteJSON, postStream, putStream, getStream, post } from '@logi.one/rest-client'
import { IncomingMessage } from 'http'

import { SearchQuery } from './search-query'

export const DEFAULT_API_URL = 'https://document-65qburttia-oa.a.run.app/api'

export class LogiONEDocumentClient {
    private accessToken?: string

    private refreshAccessTokenPromise: Promise<void> | undefined
    private isRefreshingToken = false

    constructor(
        private token: string,
        private readonly saveTokenHandler : (refreshToken: string) => Promise<void> | void,
        private readonly apiUrl = DEFAULT_API_URL) {
    }

    search<T>(resource: string, query: SearchQuery): Promise<T[]> {
        const searchParams = this.searchQueryToURLSearchParams(query).toString()
        if (searchParams) {
            return this.get<T[]>(`${resource}?${searchParams}`)
        } else {
            return this.get<T[]>(resource)
        }
    }

    get<T>(resource: string): Promise<T> {
        const request = () => {
            return getJSON<T>(this.getUrl(resource), { token: this.accessToken })
        }
        return this.run(request)
    }

    post<T>(resource: string, data: unknown): Promise<T> {
        const request = () => {
            return postJSON<T>(this.getUrl(resource), { token: this.accessToken, body: data })
        }
        return this.run(request)
    }

    put<T>(resource: string, data: unknown): Promise<T> {
        const request = () => {
            return putJSON<T>(this.getUrl(resource), { body: data, token: this.accessToken })
        }
        return this.run(request)
    }

    delete<T>(resource: string): Promise<T> {
        const request = () => {
            return deleteJSON<T>(this.getUrl(resource), { token: this.accessToken })
        }
        return this.run(request)
    }

    postStream(resource: string, stream: NodeJS.ReadableStream): Promise<IncomingMessage> {
        const request = () => {
            return postStream(this.getUrl(resource), stream, { token: this.accessToken })
        }
        return this.run(request)
    }

    putStream(resource: string, stream: NodeJS.ReadableStream): Promise<IncomingMessage> {
        const request = () => {
            return putStream(this.getUrl(resource), stream, { token: this.accessToken })
        }
        return this.run(request)
    }

    getStream(resource: string): Promise<NodeJS.ReadableStream> {
        const request = () => {
            return getStream(this.getUrl(resource), { token: this.accessToken })
        }
        return this.run(request)
    }

    private searchQueryToURLSearchParams(query: SearchQuery): URLSearchParams {
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
                switch (typeof filter.value) {
                    case 'number':
                        type = 'n'
                        break
                    case 'boolean':
                        type = 'b'
                        break
                    case 'object':
                        if (typeof filter.value.min === 'number') {
                            type = 'r'
                        } else {
                            type = 'i'
                        }
                        filter.value = `${filter.value.min},${filter.value.max}`
                        break
                    default:
                        type = 's'
                        break
                }
                 searchParams.append('filter', `${filter.match ? '' : '-'}${type}${filter.column}:${filter.value}`)
            }
        }
        return searchParams
    }

    private async run<T>(request: () => Promise<T>): Promise<T> {
        if (!this.accessToken) {
            await this.refreshAccessToken()
        }
        try {
            return await request()
        } catch (err: any) {
            if (err?.status === 401) {
                await this.refreshAccessToken()
                return await request()
            } else {
                throw err
            }
        }
    }

    private getUrl(resource: string) {
        return `${this.apiUrl}/${resource}`
    }

    private async refreshAccessToken() {
        if (!this.isRefreshingToken) {
            this.isRefreshingToken = true
            this.refreshAccessTokenPromise = (async () => {
                const { access_token, refresh_token } = await postJSON<{ access_token: string, refresh_token: string }>(
                    `${this.apiUrl}/auth/token`,
                    { body: { grant_type: 'refresh_token', refresh_token: this.token } }
                )
                this.accessToken = access_token
                this.token = refresh_token
                await this.saveTokenHandler(this.token)
                this.isRefreshingToken = false
            })()
        }
        await this.refreshAccessTokenPromise
    }
}

