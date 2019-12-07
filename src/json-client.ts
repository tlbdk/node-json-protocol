import net from 'net'
import { decode, encode, JSONMessage, isJSONParseErrorMessage, JSONMessageRequest } from './protocol'
import { TimeoutError, ParserError, ConnectionClosedError, ConnectionError } from './errors'

export class JSONClient {
  private id = 1
  private outstandingRequests: {
    [id: string]: { resolve: (obj: JSONMessage) => void; reject: (err: Error) => void }
  } = {}
  private socket: net.Socket
  private reconnect = true
  private onClosePromise: Promise<void>

  constructor(socketPath: string) {
    // Create socket connection
    this.socket = net.createConnection({ path: socketPath })

    this.onClosePromise = new Promise(resolve => {
      this.socket.on('close', () => {
        for (const id of Object.keys(this.outstandingRequests)) {
          this.outstandingRequests[id].reject(new ConnectionClosedError(`request '${id}' connection was closed`))
        }

        if (this.reconnect) {
          // If the connection closes retry again in 1 sec
          setTimeout(() => {
            this.socket.connect(socketPath)
          }, 1000)
        } else {
          resolve()
        }
      })
    })

    // Catch connection errors and Send reject to all outstandingRequests
    this.socket.on('error', err => {
      for (const id of Object.keys(this.outstandingRequests)) {
        this.outstandingRequests[id].reject(new ConnectionError(`request '${id}' failed: ${err.message}`))
      }
    })

    // Do message chunking and basic decoding
    // TODO: Do more efficient buffering and check a max size
    let buffer = Buffer.alloc(0)
    this.socket.on('data', chunk => {
      buffer = Buffer.concat([buffer, chunk])
      const offset = buffer.indexOf('\n')
      if (offset > -1) {
        const message = buffer.slice(0, offset)
        buffer = buffer.slice(offset + 1)
        const response = decode(message.toString()) as JSONMessage
        if (isJSONParseErrorMessage(response)) {
          this.outstandingRequests[response.id].reject(new ParserError(response.message))
        } else {
          this.outstandingRequests[response.id].resolve(response)
        }
      }
    })
  }

  async request(obj: JSONMessageRequest, timeout = 1000): Promise<JSONMessage> {
    // TODO: Validate that it's a JSONMessageRequest
    const request = { id: this.id++ + '', ...obj } as JSONMessage
    const message = encode(request)
    this.socket.write(message + '\n')

    return new Promise<JSONMessage>((resolve, reject) => {
      this.outstandingRequests[request.id] = { resolve, reject }
      setTimeout(() => {
        reject(new TimeoutError())
      }, timeout)
    })
  }

  async close(): Promise<void> {
    this.reconnect = false
    this.socket.end()
    return this.onClosePromise
  }
}
