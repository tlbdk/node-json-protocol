import { JSONServer } from './json-server'
import { JSONMessage, encode } from './protocol'

export interface TestResponse extends JSONMessage {
  value: string
}

export async function testJSONServer(
  socketPath: string,
  response: TestResponse,
  useRequestId?: boolean
): Promise<JSONMessage> {
  return new Promise(resolve => {
    const jsonServer = new JSONServer(socketPath, (sock, request) => {
      if (useRequestId) {
        response.id = request.id
      }
      sock.write(`${encode(response)}\n`)
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      jsonServer.close().then(() => {
        resolve(request)
      })
    })
  })
}

export async function testJSONServerTimeout(socketPath: string): Promise<void> {
  return new Promise(resolve => {
    const jsonServer = new JSONServer(socketPath, () => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      jsonServer.close().then(() => {
        resolve()
      })
    })
  })
}
