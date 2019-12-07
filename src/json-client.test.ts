import crypto from 'crypto'
import os from 'os'
import { JSONClient } from './json-client'
import { testJSONServer } from './testutils'

describe('JSONClient', () => {
  test('Simple request', async () => {
    const socketPath = `${os.tmpdir()}-${crypto.randomBytes(12).toString('hex')}.sock`
    const requestPromise = testJSONServer(socketPath, { id: '1234', type: 'MyTest', value: 'test' }, true)

    const jsonClient = new JSONClient(socketPath)
    const response = await jsonClient.request({ type: 'MyTest' })
    expect(response).toEqual({ id: expect.stringMatching('.+'), type: 'MyTest', value: 'test' })
    await jsonClient.close()

    const request = await requestPromise
    expect(request).toEqual({ id: expect.stringMatching('.+'), type: 'MyTest' })
  })
})
