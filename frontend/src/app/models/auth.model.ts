export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface AuthPayload {
  name?: string;
  email: string;
  password: string;
}

export interface ProfilePayload {
  name: string;
  email: string;
}

export interface PasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse extends ApiMessageWithUser {
  token: string;
}

interface ApiMessageWithUser {
  success: boolean;
  message: string;
  user: User;
}
