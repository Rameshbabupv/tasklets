interface User {
    id: number;
    email: string;
    name: string;
    role: string;
    tenantId: number;
    clientId: number | null;
    isInternal: boolean;
}
interface AuthState {
    token: string | null;
    user: User | null;
    setAuth: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: () => boolean;
}
export declare const useAuthStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AuthState>>;
export {};
//# sourceMappingURL=auth.d.ts.map