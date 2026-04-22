export type Config = {
	accessToken: string | (() => string) | (() => Promise<string>);
};
