import {EventPriority} from './EventPriority';
import {EventPayload} from './EventPayload';
interface ServerEventPayload {
  id?: string;
  createdAt?: number;
  priority?: EventPriority;
  payload?: EventPayload;
  additionalProperties?: Map<string, any>;
}
export { ServerEventPayload };