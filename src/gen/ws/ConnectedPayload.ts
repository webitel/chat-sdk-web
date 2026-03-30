
interface ConnectedPayload {
  ok?: boolean;
  connectionId?: string;
  serverVersion?: string;
  additionalProperties?: Map<string, any>;
}
export { ConnectedPayload };