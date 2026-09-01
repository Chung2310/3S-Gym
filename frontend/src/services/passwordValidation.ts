export const PASSWORD_ERROR = 'Mật khẩu phải gồm đúng 6 chữ số.';
export const PASSWORD_HINT = 'Nhập đúng 6 chữ số';
export const PASSWORD_INPUT_PATTERN = '[0-9]{6}';

export function isSixDigitPassword(value: string): boolean {
  return /^\d{6}$/.test(value);
}
