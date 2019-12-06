import { JSONClient } from './json-client'
import { JSONRequest } from './protocol'

export interface Position extends JSONRequest {
  long: number
  lat: number
  speed: number
}

export class GpsClient extends JSONClient {
  async GetLatestPosition(): Promise<Position> {
    const response = await this.request({ type: 'GetLatestPosition' })
    // TODO: Validate this is a position
    return response as Position
  }
}