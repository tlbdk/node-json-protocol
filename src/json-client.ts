import net from 'net'
import { decode, encode, JSONMessage, isJSONParseErrorMessage, JSONMessageRequest } from './protocol'
import { TimeoutError, ServerParserError, ConnectionClosedError, ConnectionError, ClientParserError } from './errors'

export class JSONClient {
  private id = 1
  private outstandingRequests: {
    [id: string]: { resolve: (obj: JSONMessage) => void; reject: (err: Error) => void }
  } = {}
  private socket: net.Socket
  private reconnect = true
  private onClosePromise: Promise<void>
  private errorListener: Array<(error: Error) => void> = []

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
        try {
          const response = decode(message.toString()) as JSONMessage
          // TODO: Validate this is a JSONMessage
          if (!this.outstandingRequests[response.id]) {
            throw new Error(`Unknown response id ${response.id}`)
            // Skip if we did not ask for this message
          } else if (isJSONParseErrorMessage(response)) {
            this.outstandingRequests[response.id].reject(new ServerParserError(response.message))
          } else {
            this.outstandingRequests[response.id].resolve(response)
          }
        } catch (e) {
          // We failed to parse the message skip this line and try the next
          for (const errorListener of this.errorListener) {
            errorListener(new ClientParserError(e.message))
          }
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

  public on(eventType: 'error', callback: (error: Error) => void): void {
    switch (eventType) {
      case 'error': {
        this.errorListener.push(callback)
        break
      }
      default: {
        throw new Error(`Unknown event type: ${eventType}`)
      }
    }
  }
}
