import type {
	ThreadManagementSearchVariablesParams,
	WebitelImApiGatewayV1SearchVariablesResponse,
	WebitelImApiGatewayV1ThreadManagementFlushVariablesBody,
	WebitelImApiGatewayV1ThreadManagementSetVariablesBody,
	WebitelImApiGatewayV1ThreadVariables as ThreadVariablesModel,
} from '@webitel/api-services/gen/models';

type ThreadSetVariablesParams =
	WebitelImApiGatewayV1ThreadManagementSetVariablesBody;

type ThreadFlushVariablesParams =
	WebitelImApiGatewayV1ThreadManagementFlushVariablesBody;

type ThreadVariablesResponse = ThreadVariablesModel;

type ThreadSearchVariablesParams = ThreadManagementSearchVariablesParams;

type ThreadSearchVariablesResponse =
	WebitelImApiGatewayV1SearchVariablesResponse;

export type {
	ThreadFlushVariablesParams,
	ThreadSearchVariablesParams,
	ThreadSearchVariablesResponse,
	ThreadSetVariablesParams,
	ThreadVariablesModel,
	ThreadVariablesResponse,
};
