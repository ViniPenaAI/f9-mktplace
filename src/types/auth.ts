export interface AuthProfile {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    document: string | null;
    document_type: "cpf" | "cnpj" | null;
    razao_social: string | null;
}

export interface AuthUser {
    id: string;
    email: string;
}

export interface AuthState {
    user: AuthUser | null;
    profile: AuthProfile | null;
    loading: boolean;
}
