'use client';

import { ConfigProvider } from 'antd';
import theme from './theme/defaultThemeConfig';
import SketcherView from '../components/Sketcher/SketcherView';
import { useAppSelector } from './hooks';
import { selectActiveSketchId } from './slices/sketchSlice';
import MainView from '@/components/3dMod/MainView';

export default function RootLayout() {
  const activeSketchId = useAppSelector(selectActiveSketchId);

  return (
    <ConfigProvider theme={theme}>
      <div>{activeSketchId !== -1 ? <SketcherView /> : <MainView />}</div>
    </ConfigProvider>
  );
}
