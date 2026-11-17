# LogiONE Document Client

Node.js client for the [LogiONE Document](https://www.logi.one/document) API. It handles authentication for you: it finds your API token, gets access tokens, and refreshes them when they expire.

Requires Node.js 20.3 or later. TypeScript types are included.

## Install

```bash
npm install @logi.one/document-client
```

## Quick start

```javascript
const { LogiONEDocumentClient } = require('@logi.one/document-client')

async function run() {
    const client = await LogiONEDocumentClient.create()
    const documents = await client.search('documents', {
        limit: 10,
        columnFilters: [{ column: 'extension', value: '.docx', match: true }]
    })
    console.table(documents)
}

run()
```

## API token

`LogiONEDocumentClient.create()` looks for your API token in this order:

1. The token file (`.logione-document-api-token` in the current directory by default), or your [token storage](#custom-token-storage).
2. The `LOGIONE_DOCUMENT_API_TOKEN` environment variable.
3. A prompt on the command line. If the input ends before a token is entered, it throws `No LogiONE API token provided`.

`create()` gets an access token before returning the client.

Each time the client refreshes its access token, it receives a new API token and saves it to the token file. The file always holds the latest token, so keep it between runs: after the first refresh, the original token is no longer valid.

On Linux and macOS, a token file created by the client can only be read by its owner (permissions `0600`).

## Configuration

`create()` takes the token file path (default: `.logione-document-api-token`) and the API URL (default: `https://doc.logi.one/api/v2`):

```javascript
const client = await LogiONEDocumentClient.create('/var/lib/my-app/.logione-document-api-token')

// Only the API URL
const client = await LogiONEDocumentClient.create(undefined, 'https://my-server/api/v2')
```

### Custom token storage

To keep the API token somewhere other than a file, such as a database or a secret store, pass a token storage with a `load` and a `save` function instead of the file path:

```typescript
import { LogiONEDocumentClient } from '@logi.one/document-client'

const client = await LogiONEDocumentClient.create({
    load: () => db.getToken(), // the saved token, or undefined when there is none yet
    save: (newToken) => db.setToken(newToken) // called after every refresh
})
```

The API URL can be given as the second argument, as with a file path.

Both can be async. When `load` returns no token, the client falls back to the `LOGIONE_DOCUMENT_API_TOKEN` environment variable, then to the prompt, as with the token file.


## Requests

Each method takes a resource path (for example `documents` or `documents/${id}`) and returns the parsed JSON response. With TypeScript, pass the expected type as a generic.

```typescript
import { LogiONEDocumentClient } from '@logi.one/document-client'

const client = await LogiONEDocumentClient.create()

const document = await client.get<MyDocument>(`documents/${id}`)
const created = await client.post<MyDocument>('documents', newDocument)
await client.put(`documents/${id}`, updatedDocument)
await client.get(`documents/${id}/trash`) // documents can't be deleted, only moved to the trash
await client.delete(`addresses/${addressId}`)
```

If a request gets a `401 Unauthorized`, the client refreshes the access token and retries once. Concurrent requests share a single refresh. `GET`, `PUT` and `DELETE` requests are also retried up to 2 times after a network error or a `408`, `429`, `500`, `502`, `503` or `504` response; `POST` requests are not, since they could be processed twice. Other HTTP errors are thrown as a `RequestError` from [`@logi.one/rest-client`](https://www.npmjs.com/package/@logi.one/rest-client), with the HTTP code in `status`.

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


## Support

If you need support, contact us at [info@logi.one](mailto:info@logi.one). We will be happy to help.
