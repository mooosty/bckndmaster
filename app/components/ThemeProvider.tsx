'use client';

import { ConfigProvider, theme } from 'antd';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorBgContainer: '#1a1a18',
          colorBgElevated: '#2a2a28',
          colorBorder: '#f5efdb1a',
          colorText: '#f5efdb',
          colorTextSecondary: '#f5efdb99',
          borderRadius: 8,
          colorPrimary: '#f5efdb',
          colorBgLayout: '#1a1a18',
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
} 