import { JSONServer } from './json-server'
import net from 'net'
import { JSONMessage, encode } from './protocol'

interface TestResponse extends JSONMessage {
  value: string
}

async function testJSONServer(socketPath: string, response: TestResponse): Promise<JSONMessage> {
  return new Promise((resolve, reject) => {
    const jsonServer = new JSONServer(socketPath, (sock, request) => {
      sock.write(`${encode(response)}\n`)
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      jsonServer.close().then(() => {
        resolve(request)
      })
    })
  })
}

describe('JSONServer', () => {
  test('Simple response', async () => {
    const socketPath = 'socketpath.sock' // TODO: Pick random name so we can run multiple tests at the same time

    const request = testJSONServer(socketPath, { id: '1234', type: 'MyTest', value: 'test' })

    // Create simple request
    const socket = net.createConnection({ path: socketPath })
    socket.on('error', err => {
      console.log(err)
    })
    socket.write('{ "id": "1234", "type": "MyTest" }\n')
    socket.end()
    // TODO: Also test on response

    await expect(request).resolves.toEqual({ id: '1234', type: 'MyTest' })
  })
})
