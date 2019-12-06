import net from 'net'
import fs from 'fs'
import { decode, JSONMessage } from './protocol'

export class JSONServer {
  private server: net.Server
  private onClosePromise: Promise<void>

  constructor(socketPath: string, callback: (sock: net.Socket, request: JSONMessage) => void) {
    try {
      fs.unlinkSync(socketPath)
    } catch (e) {
      // TODO: Test the error type and rethrow if it's not "Not found"
    }
    this.server = net.createServer(client => {
      let buffer = Buffer.alloc(0)
      client.on('data', chunk => {
        buffer = Buffer.concat([buffer, chunk])
        const offset = buffer.indexOf('\n')
        if (offset > -1) {
          const message = buffer.slice(0, offset)
          buffer = buffer.slice(offset + 1)
          const response = decode(message.toString()) as JSONMessage
          callback(client, response)
        }
      })
    })
    this.onClosePromise = new Promise(resolve => {
      this.server.on('close', () => {
        resolve()
      })
    })

    this.server.listen(socketPath)
  }
  close(): Promise<void> {
    this.server.close()
    return this.onClosePromise
  }
  onClose(): Promise<void> {
    return this.onClosePromise
  }
}
