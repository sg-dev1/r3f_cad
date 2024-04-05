import type { ThemeConfig } from 'antd';
//import localFont from 'next/font/local';

//const myLocalFont = localFont({
//  src: '../fonts/<path-to-fontfile>.ttf'
//})

const theme: ThemeConfig = {
  /*token: {
    fontSize: 16,
    colorPrimary: '#641E8C',
    colorText: 'black',
    colorLink: '#8A00E5',
    colorInfo: '#641E8C',
  },*/
  token: {
    colorTextBase: '#0d0d0d',
    colorSuccess: '#007942',
    colorWarning: '#e2d000',
    colorError: '#da1e28',
    fontSize: 16,
    sizeStep: 4,
    sizeUnit: 4,
    borderRadius: 8,
    //colorPrimary: '#8a00e5',
    colorInfo: '#8a00e5',
    colorText: '#0d0d0d',
    colorTextSecondary: '#5f5f5f',
    colorTextTertiary: '#969696',
    colorTextQuaternary: '#c0c0c0',

    colorTextDescription: '#0d0d0d',

    colorBorder: '#c0c0c0',
    colorBorderSecondary: '#eaeaea',
    colorBgLayout: '#f2f2f2',
    fontSizeLG: 20,
    wireframe: false,
    colorPrimaryHover: '#641e8c',
    colorErrorHover: '#a7070f',
    //"fontFamily": myLocalFont.style.fontFamily
  },
  components: {
    Tag: {
      fontSize: 16,
      fontSizeIcon: 16,
      fontSizeSM: 16,
      colorTextLightSolid: '#0d0d0d',
      //colorBorder: "#c0c0c0",
      //lineWidth: 1
    },
    Input: {
      colorBorder: '#c0c0c0',
      lineWidth: 1,
      colorTextDescription: '#969696',
      colorText: '#0d0d0d',
    },
    InputNumber: {
      colorBorder: '#c0c0c0',
      lineWidth: 1,
    },
    Select: {
      colorBorder: '#c0c0c0',
      lineWidth: 1,
    },
    Statistic: {
      /* here is your component tokens */
      contentFontSize: 24,
      titleFontSize: 14,
    },
    Progress: {
      fontSize: 24,
    },
    Collapse: {
      headerBg: '#eaeaea',
      colorBorder: '#c0c0c0',
      borderRadiusLG: 8,
      lineWidth: 1,
      lineType: 'solid',
    },
    Drawer: {
      /*copied from h3 in global.css*/
      fontSizeLG: 24,
      fontWeightStrong: 400,
      colorBgElevated: '#f2f2f2',
    },
    Tooltip: {
      colorBgSpotlight: '#D7E4EE',
      colorTextLightSolid: '#0d0d0d',
    },
    Table: {
      borderColor: '#c0c0c0',
      expandIconBg: 'Transparent',
      footerBg: 'blue',
      headerBg: '#eaeaea',
      headerBorderRadius: 8,
      rowExpandedBg: '#eaeaea',
      headerSplitColor: '#eaeaea',
      /*colorPrimary: 'yellow',*/
      colorSplit: '#eaeaea',
      colorText: '#0d0d0d',
      colorTextDescription: '#0d0d0d',
      borderRadius: 8,
      lineHeight: 1 /*1.5714285714285714*/,
      lineType: 'solid',
      lineWidth: 1,
    },
  },
};

export default theme;
