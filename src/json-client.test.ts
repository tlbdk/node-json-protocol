import crypto from 'crypto'
import os from 'os'
import { JSONClient } from './json-client'
import { testJSONServer, testJSONServerTimeout } from './testutils'
import { TimeoutError } from './errors'
import { JSONServer } from './json-server'
import net from 'net'

describe('JSONClient', () => {
  let jsonServer: JSONServer
  let socketPath: string

  beforeAll(async () => {
    socketPath = `${os.tmpdir()}-${crypto.randomBytes(12).toString('hex')}.sock`
    jsonServer = new JSONServer(socketPath, (socket, request) => {
      switch (request.type) {
        case 'TestRequest': {
          socket.write(JSON.stringify({ id: request.id, type: 'TestRequest', value: 'test' }) + '\n')
          break
        }
        case 'TestTimeout': {
          break
        }
        default: {
          throw Error(`Unknown request type`)
        }
      }
    })
    await jsonServer.onListening()
  })

  afterAll(async () => {
    await jsonServer.close(true)
  })

  test('Simple request', async () => {
    let jsonClient: JSONClient | null = null
    try {
      jsonClient = new JSONClient(socketPath)
      const response = await jsonClient.request({ type: 'TestRequest' })
      expect(response).toEqual({ id: expect.stringMatching('.+'), type: 'TestRequest', value: 'test' })
      await jsonClient.close()
    } finally {
      // TODO: Also wait on server
      await jsonClient?.close()
    }
  })

  test('Timeout', async () => {
    let jsonClient: JSONClient | null = null
    try {
      jsonClient = new JSONClient(socketPath)
      const response = jsonClient.request({ type: 'TestTimeout' }, 1)
      await expect(response).rejects.toEqual(new TimeoutError())
    } finally {
      await jsonClient?.close()
    }
  })
})
