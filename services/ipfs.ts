import { createHelia } from 'helia'
import { unixfs } from '@helia/unixfs'
import { CID } from 'multiformats/cid'

let heliaInstance: ReturnType<typeof createHelia> | null = null
let fsInstance: ReturnType<typeof unixfs> | null = null

/**
 * Initialize Helia IPFS client
 */
export async function initializeHelia() {
  if (!heliaInstance) {
    heliaInstance = await createHelia()
    fsInstance = unixfs(heliaInstance)
  }
  return { helia: heliaInstance, fs: fsInstance }
}

/**
 * Store data on IPFS using Helia
 */
export async function storeOnIPFS(data: Uint8Array): Promise<string> {
  try {
    const { fs } = await initializeHelia()
    if (!fs) throw new Error('IPFS not initialized')

    // Add the data to IPFS
    const cid = await fs.addBytes(data)
    return cid.toString()
  } catch (error) {
    console.error('Error storing data on IPFS:', error)
    throw new Error('Failed to store data on IPFS')
  }
}

/**
 * Retrieve data from IPFS using Helia
 */
export async function retrieveFromIPFS(cidString: string): Promise<Uint8Array> {
  try {
    const { fs } = await initializeHelia()
    if (!fs) throw new Error('IPFS not initialized')

    // Parse the CID string
    const cid = CID.parse(cidString)

    // Get the data from IPFS
    const chunks: Uint8Array[] = []
    for await (const chunk of fs.cat(cid)) {
      chunks.push(chunk)
    }

    // Combine all chunks into a single Uint8Array
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }

    return result
  } catch (error) {
    console.error('Error retrieving data from IPFS:', error)
    throw new Error('Failed to retrieve data from IPFS')
  }
} 