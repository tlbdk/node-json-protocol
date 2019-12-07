import crypto from 'crypto'
import os from 'os'
import { JSONClient } from './json-client'
import { testJSONServer, testJSONServerTimeout } from './testutils'
import { TimeoutError } from './errors'

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

  test('Timeout', async () => {
    const socketPath = `${os.tmpdir()}-${crypto.randomBytes(12).toString('hex')}.sock`
    const serverClosedPromise = testJSONServerTimeout(socketPath)

    const jsonClient = new JSONClient(socketPath)
    const response = jsonClient.request({ type: 'MyTest' }, 1)
    await expect(response).rejects.toEqual(new TimeoutError())
    await jsonClient.close()

    await serverClosedPromise
  })
})
