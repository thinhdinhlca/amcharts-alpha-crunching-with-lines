window.function = function (data, overlayDataJson, width, height, type) {

  let dataStringValue = data.value ?? '[]';
  let overlayDataJsonStringValue = overlayDataJson.value ?? '{}';
  let chartWidth = width.value ?? 100;
  let chartHeight = height.value ?? 500;
  let chartTypeLabel = type.value ?? "Value";

  let ht = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Glide Yes-Code Chart</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/xy.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
    }
    #chartdiv {
      width: ${chartWidth}%;
      height: ${chartHeight}px;
    }
  </style>
</head>
<body>
  <div id="chartdiv"></div>

<script>
am5.ready(function() {

  const primaryDataString = ${JSON.stringify(dataStringValue)};
  const overlayString = ${JSON.stringify(overlayDataJsonStringValue)};
  const chartTypeLabel = ${JSON.stringify(chartTypeLabel)};
  const overlayColors = {
    "This Week": "#228B22",
    "Last Week": "#FFA500",
    "2 Weeks Ago": "#800080",
    "3 Weeks Ago": "#DC143C",
  };

  var root = am5.Root.new("chartdiv");
  root.setThemes([am5themes_Animated.new(root)]);

  function parseChartData(primaryStr, overlayStr) {
    let primaryData = [];
    let parsedOverlayData = null;
    let hasValidOverlay = false;

    try {
      primaryData = JSON.parse(primaryStr);
      if (!Array.isArray(primaryData)) {
        primaryData = [];
      }
      primaryData = primaryData.filter(item => item && typeof item === 'object' && item.hasOwnProperty('time') && item.hasOwnProperty('value'));
    } catch (e) {
      primaryData = [];
    }

    try {
      if (overlayStr && overlayStr.trim() !== "" && overlayStr.trim() !== "{}") {
        parsedOverlayData = JSON.parse(overlayStr);
        if (typeof parsedOverlayData === 'object' && parsedOverlayData !== null && !Array.isArray(parsedOverlayData)) {
          let validKeys = 0;
          for (const key in parsedOverlayData) {
            if (Object.hasOwnProperty.call(parsedOverlayData, key)) {
              const weekData = parsedOverlayData[key];
              if (Array.isArray(weekData) && weekData.every(item => item && typeof item === 'object' && item.hasOwnProperty('time') && item.hasOwnProperty('value'))) {
                validKeys++;
              } else {
                delete parsedOverlayData[key];
              }
            }
          }
          if (validKeys > 0) {
            hasValidOverlay = true;
          } else {
            parsedOverlayData = null;
          }
        } else {
          parsedOverlayData = null;
        }
      }
    } catch (e) {
      parsedOverlayData = null;
    }

    return { primaryData, parsedOverlayData, hasValidOverlay };
  }

  function prepareAxisCategories(primaryData, overlayData) {
    let allDataForAxis = [...primaryData];
    if (overlayData) {
      try {
        Object.values(overlayData).forEach(weekArray => {
          if (Array.isArray(weekArray)) {
            allDataForAxis.push(...weekArray);
          }
        });
      } catch(e) {}
    }

    let uniqueTimes = [...new Set(allDataForAxis.map(item => item?.time).filter(time => time !== undefined && time !== null && String(time).trim() !== ''))].sort();
    let xAxisData = uniqueTimes.map(time => ({ time: time }));
    return xAxisData;
  }

  function createChartAndAxes(root, xAxisData) {
    var chart = root.container.children.push(am5xy.XYChart.new(root, {
      panX: true,
      panY: false,
      wheelX: "panX",
      wheelY: "zoomX",
      layout: root.verticalLayout
    }));

    var xRenderer = am5xy.AxisRendererX.new(root, {
      minGridDistance: 60,
    });
    xRenderer.labels.template.setAll({
        rotation: -45,
        centerY: am5.p50,
        centerX: am5.p100,
        paddingRight: 10
    });

    var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
      categoryField: "time",
      renderer: xRenderer,
      tooltip: am5.Tooltip.new(root, {})
    }));

    if (xAxisData.length > 0) {
        xAxis.data.setAll(xAxisData);
    }

    var yRenderer = am5xy.AxisRendererY.new(root, {});
    var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
      maxPrecision: 2,
      renderer: yRenderer
    }));

    return { chart, xAxis, yAxis };
  }

  function createPrimarySeries(chart, root, primaryData, xAxis, yAxis) {
    var areaSeries = chart.series.push(am5xy.LineSeries.new(root, {
      name: "Selected Week",
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "value",
      categoryXField: "time",
      stroke: am5.color(primaryData[0]?.strokeSettings?.stroke || 0x095256),
      fill: am5.color(primaryData[0]?.strokeSettings?.stroke || 0x095256),
      fillOpacity: 0.3,
      tooltip: am5.Tooltip.new(root, {
        labelText: "{name}: {valueY.formatNumber('#.00')}"
      }),
      connect: false
    }));
    areaSeries.strokes.template.set("strokeWidth", 2);
    areaSeries.fills.template.set("visible", true);
    areaSeries.data.setAll(primaryData);
    areaSeries.appear(1000);

    var columnSeries = chart.series.push(am5xy.ColumnSeries.new(root, {
      name: "Selected Week (Interval)",
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "value",
      categoryXField: "time",
      fill: am5.color(0x095256),
      stroke: am5.color(0x095256),
      opacity: 0.7,
      tooltip: am5.Tooltip.new(root, {
        labelText: "{name}: {valueY.formatNumber('#.00')}"
      }),
    }));
    columnSeries.columns.template.set("width", am5.percent(60));
    columnSeries.data.setAll(primaryData);
    columnSeries.hide(0);
    columnSeries.appear(1000);

    return [areaSeries, columnSeries];
  }

  function createOverlaySeries(chart, root, overlayData, colors, xAxis, yAxis) {
    let overlaySeriesList = [];
    if (!overlayData) {
      return overlaySeriesList;
    }

    let colorIndex = 0;

    try {
      for (const weekKey in overlayData) {
        if (Object.hasOwnProperty.call(overlayData, weekKey)) {
          const weekData = overlayData[weekKey];
          let seriesColor = colors[weekKey];
          if (!seriesColor) {
            seriesColor = root.interfaceColors.get("grid");
          }

          var lineSeries = chart.series.push(am5xy.LineSeries.new(root, {
            name: weekKey,
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: "value",
            categoryXField: "time",
            stroke: am5.color(seriesColor),
            tooltip: am5.Tooltip.new(root, {
              labelText: `{name}: {valueY.formatNumber('#.00')}`
            }),
            connect: false
          }));
          lineSeries.strokes.template.set("strokeWidth", 2);
          lineSeries.data.setAll(weekData);
          lineSeries.appear(1000);
          overlaySeriesList.push(lineSeries);
        }
      }
    } catch (e) {}

    return overlaySeriesList;
  }

  function createLegend(chart, root, seriesList) {
    if (!seriesList || seriesList.length <= 2) {
      return null;
    }

    var legend = chart.children.push(am5.Legend.new(root, {
      centerX: am5.p50,
      x: am5.p50,
      marginTop: 15,
      marginBottom: 15,
    }));

    legend.itemContainers.template.setAll({
        paddingTop: 5,
        paddingBottom: 5
    });

    legend.itemContainers.template.set("toggleOnClick", true);

    legend.data.setAll(seriesList);
    return legend;
  }

  function configureChart(chart, root, yAxis, xAxis, label) {
    chart.set("cursor", am5xy.XYCursor.new(root, {
      behavior: "zoomX",
      xAxis: xAxis
    }));

    yAxis.children.unshift(am5.Label.new(root, {
      rotation: -90,
      text: \`Average \${label} Points\`,
      y: am5.p50,
      centerX: am5.p50,
      paddingBottom: 10
    }));

    xAxis.children.push(am5.Label.new(root, {
      text: "Time of Day",
      x: am5.p50,
      centerX: am5.p50,
      paddingTop: 10
    }));

    chart.set("scrollbarX", am5.Scrollbar.new(root, {
      orientation: "horizontal",
    }));

    chart.appear(1000, 100);
  }

  console.log("--- Starting Chart Build Process ---");

  const { primaryData, parsedOverlayData, hasValidOverlay } = parseChartData(primaryDataString, overlayString);

  const xAxisData = prepareAxisCategories(primaryData, parsedOverlayData);

  const { chart, xAxis, yAxis } = createChartAndAxes(root, xAxisData);

  const primarySeries = createPrimarySeries(chart, root, primaryData, xAxis, yAxis);

  const overlaySeries = createOverlaySeries(chart, root, parsedOverlayData, overlayColors, xAxis, yAxis);

  const allSeriesForLegend = [...primarySeries, ...overlaySeries];
  createLegend(chart, root, allSeriesForLegend);

  configureChart(chart, root, yAxis, xAxis, chartTypeLabel);

  console.log("--- Chart Build Process Complete ---");

}); 
</script>

</body>
</html>`;

  const encodedHtml = encodeURIComponent(ht);
  const dataUri = `data:text/html;charset=utf-8,${encodedHtml}`;
  return dataUri;
}
