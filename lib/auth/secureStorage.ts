// AUTO-GENERATED.
import * as SecureStore from 'expo-secure-store';
const KEY = 'nativeflow.auth.refreshToken';
export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY);
}
export async function setRefreshToken(t: string | null): Promise<void> {
  if (t == null) await SecureStore.deleteItemAsync(KEY);
  else await SecureStore.setItemAsync(KEY, t);
}
export async function clearRefreshToken(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}
