import net from 'net'
import os from 'os'
import crypto from 'crypto'
import { testJSONServer, testJSONServerTimeout } from './testutils'

describe('JSONServer', () => {
  test('Simple response', async () => {
    const socketPath = `${os.tmpdir()}-${crypto.randomBytes(12).toString('hex')}.sock`

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
