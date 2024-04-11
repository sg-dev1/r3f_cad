'use client';

// import MainView from './components/MainView';
import { ConfigProvider } from 'antd';
import theme from './theme/defaultThemeConfig';
import SketcherView from '../components/SketcherView';
import { useAppDispatch, useAppSelector } from './hooks';
import { createSketch, selectActiveSketchId } from './slices/sketchSlice';
import { useEffect } from 'react';

export default function RootLayout() {
  const activeSketchId = useAppSelector(selectActiveSketchId);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (-1 === activeSketchId) {
      dispatch(createSketch());
    }
  }, []);

  return (
    <ConfigProvider theme={theme}>
      <div>
        {activeSketchId !== -1 ? <SketcherView /> : ''}
        {/* <MainView /> */}
      </div>
    </ConfigProvider>
  );
}
