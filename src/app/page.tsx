// import MainView from './components/MainView';
import { ConfigProvider } from 'antd';
import theme from './theme/defaultThemeConfig';
import SketcherView from '../components/SketcherView';

export default function RootLayout() {
  return (
    <ConfigProvider theme={theme}>
      <div>
        {/* <MainView /> */}
        <SketcherView />
      </div>
    </ConfigProvider>
  );
}
