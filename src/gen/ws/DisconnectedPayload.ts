
interface DisconnectedPayload {
  reason?: string;
  code?: number;
  reservedStatus?: string;
  additionalProperties?: Map<string, any>;
}
export { DisconnectedPayload };