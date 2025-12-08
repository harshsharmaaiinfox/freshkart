export interface AuthStateModal {
  email: string;
  token: String | Number;
  access_token: String | null;
  permissions: [];
}

export interface AuthUserStateModel {
  email: string;
  password: string;
  'store-id'?: number;
}

export interface AuthUserForgotModel {
  email: string;
}

export interface VerifyEmailOtpModel {
  email: string;
  token: string;
}

export interface AuthNumberLoginState {
  phone: number;
  country_code: number;
  'store-id'?: number;
}

export interface AuthVerifyNumberOTPState {
  phone: number;
  country_code: number;
  token: string;
}

export interface UpdatePasswordModel {
  password: string;
  password_confirmation: string;
  email: string;
  token: string;
}

export interface RegisterModal {
  name: string;
  email: string;
  phone: number;
  country_code: number;
  password: string;
  password_confirmation: string;
  'store-id'?: number;
}


