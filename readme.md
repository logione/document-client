# LogiONE Document Client

This is a client for the LogiONE Document's API.

[www.logi.one/document](https://www.logi.one/document)

## Install

```bash
npm install @logi.one/document-client
```

## Quick start

You can use `createLogiONEDocumentClient` to create a client instance.

It will try to read the API key from the `.logione-document-api-token` file. If it doesn't find the file, it will read the api token from the environment key: `LOGIONE_DOCUMENT_API_TOKEN`. If it is not set, it will ask for the API key from the command line. The client will automatically refresh the token when it expires and save it to the `.logione-document-api-token` file.

```javascript
const { createLogiONEDocumentClient } = require('@logi.one/document-client')

async function run() {    
    const client = await createLogiONEDocumentClient()     
    const documents = await client.search(`/documents`, { limit: 10, columnFilters: { name: 'My Document' } })     
    console.table(documents)
}

run()
```

## Need for support

If you need support, please feel free to contact us at [info@logi.one](mailto:info@logi.one). We will be happy to help you. 

