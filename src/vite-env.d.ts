/// <reference types="vite/client" />

declare module "virtual:pwa-register/react" {
	export interface UseRegisterSWOptions {
		immediate?: boolean;
		onRegisteredSW?: (swUrl: string, registration?: ServiceWorkerRegistration | undefined) => void;
		onRegisterError?: (error: unknown) => void;
	}

	export interface UseRegisterSWReturn {
		offlineReady: boolean;
		needRefresh: boolean;
		updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
	}

	export function useRegisterSW(options?: UseRegisterSWOptions): UseRegisterSWReturn;
}
