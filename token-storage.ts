import { readFile, writeFile } from 'fs/promises'
import { createInterface } from 'node:readline/promises'

export const DEFAULT_TOKEN_FILE_PATH = '.logione-document-api-token'

/** Where the API token is kept between runs. The client saves the new token after every refresh. */
export interface TokenStorage {
    /** Returns the saved token, or undefined (or '') when there is none yet. */
    load(): Promise<string | undefined> | string | undefined
    save(token: string): Promise<void> | void
}

/** Keeps the token in a file, readable only by its owner when the client creates it. */
export function createTokenFileStorage(file = DEFAULT_TOKEN_FILE_PATH): TokenStorage {
    return {
        load: async () => {
            try {
                return (await readFile(file, 'utf8')).trim()
            } catch (err: any) {
                // Only a missing file means no token yet: with an unreadable file, the token found elsewhere
                // would be used up by the first refresh and the new one couldn't be saved.
                if (err?.code === 'ENOENT') {
                    return undefined
                }
                throw err
            }
        },
        save: async (token: string) => {
            for (let tryNumber = 1; ; tryNumber++) {
                try {
                    await writeFile(file, token, { mode: 0o600 })
                    return
                } catch (err) {
                    if (tryNumber > 10) {
                        throw err
                    }
                    await new Promise((resolve) => setTimeout(resolve, 100 * tryNumber))
                }
            }
        }
    }
}

/**
 * Finds the API token: in the storage, then in the LOGIONE_DOCUMENT_API_TOKEN environment variable,
 * then with a prompt on the command line.
 */
export async function findToken(tokenStorage: TokenStorage): Promise<string> {
    let token = (await tokenStorage.load())?.trim()
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
    return token
}
