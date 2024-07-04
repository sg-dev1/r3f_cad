/** This component contains main page of the application. */
'use client';

import { ConfigProvider } from 'antd';
import theme from './theme/defaultThemeConfig';
import SketcherView from '../components/Sketcher/SketcherView';
import { useAppSelector } from './hooks';
import { selectActiveSketchId } from './slices/sketchSlice';
import MainView from '@/components/3dMod/MainView';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor } from './store';
import { GlobalBitByBitProvider } from './global_bitbybit_provider';

export default function RootLayout() {
  const activeSketchId = useAppSelector(selectActiveSketchId);

  return (
    <PersistGate loading={null} persistor={persistor}>
      <GlobalBitByBitProvider>
        <ConfigProvider theme={theme}>
          <div>{activeSketchId !== -1 ? <SketcherView /> : <MainView />}</div>
        </ConfigProvider>
      </GlobalBitByBitProvider>
    </PersistGate>
  );
}
