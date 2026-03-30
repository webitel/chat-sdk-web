
interface AckPayload {
  id?: string;
  reservedStatus?: string;
  additionalProperties?: Map<string, any>;
}
export { AckPayload };