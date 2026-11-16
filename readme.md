# LogiONE Document Client

Node.js client for the [LogiONE Document](https://www.logi.one/document) API. It handles authentication for you: it finds your API token, gets access tokens, and refreshes them when they expire.

Requires Node.js 18 or later. TypeScript types are included.

## Install

```bash
npm install @logi.one/document-client
```

## Quick start

```javascript
const { createLogiONEDocumentClient } = require('@logi.one/document-client')

async function run() {
    const client = await createLogiONEDocumentClient()
    const documents = await client.search('documents', {
        limit: 10,
        columnFilters: [{ column: 'extension', value: '.docx', match: true }]
    })
    console.table(documents)
}

run()
```

## API token

`createLogiONEDocumentClient()` looks for your API token in this order:

1. The token file (`.logione-document-api-token` in the current directory by default).
2. The `LOGIONE_DOCUMENT_API_TOKEN` environment variable.
3. A prompt on the command line. If the input ends before a token is entered, it throws `No LogiONE API token provided`.

Each time the client refreshes its access token, it receives a new API token and saves it to the token file. The file always holds the latest token, so keep it between runs: after the first refresh, the original token is no longer valid.

On Linux and macOS, a token file created by the client can only be read by its owner (permissions `0600`).

## Configuration

```javascript
const client = await createLogiONEDocumentClient({
    tokenFilePath: '/var/lib/my-app/.logione-document-api-token' // default: '.logione-document-api-token'
})
```

## Requests

Each method takes a resource path (for example `documents` or `documents/${id}`) and returns the parsed JSON response. With TypeScript, pass the expected type as a generic.

```typescript
import { createLogiONEDocumentClient } from '@logi.one/document-client'

const client = await createLogiONEDocumentClient()

const document = await client.get<MyDocument>(`documents/${id}`)
const created = await client.post<MyDocument>('documents', newDocument)
await client.put(`documents/${id}`, updatedDocument)
await client.get(`documents/${id}/trash`) // documents can't be deleted, only moved to the trash
await client.delete(`addresses/${addressId}`)
```

If a request gets a `401 Unauthorized`, the client refreshes the access token and retries once. Other HTTP errors are thrown as a `RequestError` from [`@logi.one/rest-client`](https://www.npmjs.com/package/@logi.one/rest-client), with the HTTP code in `status`.

## Search

`search()` sends a `GET` request with the query encoded in the URL and returns an array.

```typescript
const documents = await client.search<MyDocument>('documents', {
    text: 'invoice',
    sortColumn: 'name',
    sortAsc: false,
    limit: 50,
    skip: 100,
    columnFilters: [
        { column: 'extension', value: '.pdf', match: true },
        { column: 'isDeleted', value: false, match: true },
        { column: 'deadline.date', value: { min: '2025-01-01', max: '2025-12-31' }, match: true }
    ]
})
```

| Option | Description |
|---|---|
| `text` | Full-text search |
| `sortColumn` | Column to sort by |
| `sortAsc` | Sort order, ascending by default. Set to `false` for descending |
| `limit` | Maximum number of results |
| `skip` | Number of results to skip, for paging |
| `complete` | Set to `true` to return all fields. By default, results only contain the main fields |
| `columnFilters` | List of filters, see below |

Each filter has a `column`, a `value`, and `match`. `match: true` keeps the rows that match the filter; `match: false` excludes them. The kind of filter depends on the type of `value`:

| `value` | Filter |
|---|---|
| `string` | Text |
| `number` | Number |
| `boolean` | Boolean |
| `{ min: number, max: number }` | Number range |
| `{ min: string, max: string }` | Text range (for example, ISO dates) |

## Custom token storage

To store the API token somewhere other than a file, create the client directly with your own save function:

```typescript
import { LogiONEDocumentClient } from '@logi.one/document-client'

const client = new LogiONEDocumentClient(
    await loadToken(),
    async (newToken) => { await saveToken(newToken) } // called after every refresh
)
```

## Support

If you need support, contact us at [info@logi.one](mailto:info@logi.one). We will be happy to help.
