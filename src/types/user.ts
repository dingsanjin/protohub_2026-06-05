export interface User {
  id: number;
  username: string;
  role: 'super_admin' | 'admin';
  status: 'active' | 'disabled';
  created_at: string;
  updated_at: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    id: number;
    username: string;
    role: 'super_admin' | 'admin';
    token: string;
  };
  message?: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
}

export interface UpdateUserRequest {
  username?: string;
  password?: string;
  status?: 'active' | 'disabled';
}
