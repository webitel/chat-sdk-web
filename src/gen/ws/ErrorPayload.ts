
interface ErrorPayload {
  code?: number;
  message?: string;
  details?: Map<string, any>;
  additionalProperties?: Map<string, any>;
}
export { ErrorPayload };