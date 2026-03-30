
interface WsPeer {
  sub?: string;
  iss?: string;
  reservedName?: string;
  reservedType?: string;
  isBot?: boolean;
  additionalProperties?: Map<string, any>;
}
export { WsPeer };