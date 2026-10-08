import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { makeHeader, makeTabBar, makeDrawerContent } from '../components/system/SystemChrome';
import SysHeader1 from '../components/system/SysHeader1';
import SysBottomBar from '../components/system/SysBottomBar';
import { NativeFlowThemeProvider } from '../lib/theme/NativeFlowThemeProvider';
import { AuthGate } from '../lib/auth/AuthGate';

const RootHeader0 = makeHeader(SysHeader1, "Page 1", false);

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Handle deep links when app is already open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      const parsed = Linking.parse(url);
      if (parsed.path) {
        router.push(parsed.path as any);
      }
    });

    // Handle deep link that opened the app
    Linking.getInitialURL().then((url) => {
      if (url) {
        const parsed = Linking.parse(url);
        if (parsed.path) {
          router.push(parsed.path as any);
        }
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <AuthGate>
    <NativeFlowThemeProvider>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="page1" options={{ headerShown: true, header: (props) => <RootHeader0 {...props} /> }} />
    </Stack>
    </NativeFlowThemeProvider>
    </AuthGate>
  );
}
