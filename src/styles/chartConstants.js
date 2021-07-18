import { alpha } from '@material-ui/core/styles';

export const CHART_COLORS = {
  red: '#ff6384',
  orange: '#ff9f40',
  yellow: '#ffcd56',
  green: '#4bc0c0',
  blue: '#36a2eb',
  purple: '#9966ff',
  grey: '#c9cbcf'
};

export const COLORS = [
  CHART_COLORS.red,
  CHART_COLORS.blue,
  CHART_COLORS.green,
  CHART_COLORS.orange,
  CHART_COLORS.purple,
  CHART_COLORS.yellow,
  CHART_COLORS.grey,
];

export const ALPHA_COLORS = [
  alpha(CHART_COLORS.red,0.2),
  alpha(CHART_COLORS.blue,0.2),
  alpha(CHART_COLORS.green,0.2),
  alpha(CHART_COLORS.orange,0.2),
  alpha(CHART_COLORS.purple,0.2),
  alpha(CHART_COLORS.yellow,0.2),
  alpha(CHART_COLORS.grey,0.2),
]

export const LightTheme = {
  annotationsGripsBackroundBrush: "white",
  annotationsGripsBorderBrush: "white",
  axis3DBandsFill: "#e5e5e5",
  axisBandsFill: "white",
  axisPlaneBackgroundFill: "Transparent",
  columnFillBrush: "white",
  columnLineColor: "white",
  cursorLineBrush: "#6495ED99",
  defaultColorMapBrush: [
      { offset: 0, color: "DarkBlue" },
      { offset: 0.5, color: "CornflowerBlue" },
      { offset: 1, color: "#FF22AA" }
  ],
  downBandSeriesFillColor: "#52CC5490",
  downBandSeriesLineColor: "#E26565FF",
  downBodyBrush: "white",
  downWickColor: "white",
  gridBackgroundBrush: "white",
  gridBorderBrush: "white",
  labelBackgroundBrush: "#666666AA",
  labelBorderBrush: "#666666",
  labelForegroundBrush: "#EEEEEE",
  legendBackgroundBrush: "#1D2C35",
  lineSeriesColor: "white",
  majorGridLineBrush: "#e5e5e5",
  minorGridLineBrush: "white",
  mountainAreaBrush: "white",
  mountainLineColor: "white",
  overviewFillBrush: "white",
  planeBorderColor: "white",
  rolloverLineBrush: "#FD9F2533",
  rubberBandFillBrush: "#99999933",
  rubberBandStrokeBrush: "#99999977",
  sciChartBackground: "white",
  scrollbarBackgroundBrush: "white",
  scrollbarBorderBrush: "white",
  scrollbarGripsBackgroundBrush: "white",
  scrollbarViewportBackgroundBrush: "white",
  scrollbarViewportBorderBrush: "white",
  shadowEffectColor: "white",
  textAnnotationBackground: "#666666AA",
  textAnnotationForeground: "#EEEEEE",
  tickTextBrush: "#666666",
  upBandSeriesFillColor: "white",
  upBandSeriesLineColor: "white",
  upBodyBrush: "#666666A0",
  upWickColor: "#666666"
}
