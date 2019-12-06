export class JSONClientError extends Error {}
export class ParserError extends JSONClientError {}
export class TimeoutError extends JSONClientError {}
export class ConnectionError extends JSONClientError {}
export class ConnectionClosedError extends ConnectionError {}
export class ConnectionRefusedError extends ConnectionError {}
