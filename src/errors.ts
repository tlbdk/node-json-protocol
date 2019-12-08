export class JSONClientError extends Error {}
export class ParserError extends JSONClientError {}
export class ServerParserError extends ParserError {}
export class ClientParserError extends ParserError {}
export class TimeoutError extends JSONClientError {}
export class ConnectionError extends JSONClientError {}
export class ConnectionClosedError extends ConnectionError {}
export class ConnectionRefusedError extends ConnectionError {}
