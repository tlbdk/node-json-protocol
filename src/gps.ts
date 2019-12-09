import { JSONClient } from './json-client'
import { JSONMessage } from './protocol'

export interface Position extends JSONMessage {
  long: number
  lat: number
  speed: number
}

export class GpsClient extends JSONClient {
  async getLatestPosition(): Promise<Position> {
    const response = await this.request({ type: 'GetLatestPosition' })
    // TODO: Validate this is a position
    return response as Position
  }
}
