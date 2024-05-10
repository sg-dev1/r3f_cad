'use client';

import { ConfigProvider } from 'antd';
import theme from './theme/defaultThemeConfig';
import SketcherView from '../components/SketcherView';
import { useAppSelector } from './hooks';
import { selectActiveSketchId } from './slices/sketchSlice';
import MainView from '@/components/MainView';

export default function RootLayout() {
  const activeSketchId = useAppSelector(selectActiveSketchId);

  return (
    <ConfigProvider theme={theme}>
      <div>{activeSketchId !== -1 ? <SketcherView /> : <MainView />}</div>
    </ConfigProvider>
  );
}
