import type {
	WebitelImApiGatewayV1ThreadManagementFlushVariablesBody,
	WebitelImApiGatewayV1ThreadManagementSetVariablesBody,
	WebitelImApiGatewayV1ThreadVariables as ThreadVariablesModel,
} from '@webitel/api-services/gen/models';

type ThreadSetVariablesParams =
	WebitelImApiGatewayV1ThreadManagementSetVariablesBody;

type ThreadFlushVariablesParams =
	WebitelImApiGatewayV1ThreadManagementFlushVariablesBody;

type ThreadVariablesResponse = ThreadVariablesModel;

export type {
	ThreadFlushVariablesParams,
	ThreadSetVariablesParams,
	ThreadVariablesModel,
	ThreadVariablesResponse,
};
