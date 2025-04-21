window.function = function (data, overlayDataJson, width, height, type) {

  // Safely get input values or defaults from the outer function's scope
  let dataStringValue = data.value ?? '[]';
  let overlayDataJsonStringValue = overlayDataJson.value ?? '{}';
  let chartWidth = width.value ?? 100;
  let chartHeight = height.value ?? 500;
  let chartTypeLabel = type.value ?? "SPX";

  // --- HTML Template ---
  let ht = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Glide Yes-Code Chart</title>
     <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
     <script src="https://cdn.amcharts.com/lib/5/xy.js"></script>
     <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  </head>
  <body>
  <div id="chartdiv"></div>

  <style>
    #chartdiv {
      width: ${chartWidth}%;
      height: ${chartHeight}px;
    }
  </style>

<script>
am5.ready(function() { // Use am5.ready wrapper

  // --- Root and Theme ---
  var root = am5.Root.new("chartdiv");
  root.setThemes([
    am5themes_Animated.new(root)
  ]);

  // *** Define colorSet ***
  var colorSet = am5.ColorSet.new(root, {});

  // --- Data Parsing ---
  // These constants hold the STRING content passed from the outer function
  const primaryDataString = ${JSON.stringify(dataStringValue)};
  const overlayString = ${JSON.stringify(overlayDataJsonStringValue)}; // Embedded overlay string

  var primaryData = []; // Default value
  try {
    primaryData = JSON.parse(primaryDataString);
    if (!Array.isArray(primaryData)) {
        console.error("Primary data is not an array:", primaryData);
        primaryData = [];
    }
  } catch(e) {
    console.error("Error parsing primary data JSON:", e, "\\nData String:", primaryDataString);
  }

  var parsedOverlayData = null; // Default value
  try {
      // *** THIS IS THE CORRECTED LINE: Use overlayString ***
      if (overlayString && overlayString.trim() !== "" && overlayString.trim() !== "{}") {
          parsedOverlayData = JSON.parse(overlayString); // Parse the string from THIS scope
          // Validate the parsed result
          if (typeof parsedOverlayData !== 'object' || parsedOverlayData === null || Array.isArray(parsedOverlayData)) {
              console.error("Parsed overlay data is not a valid object:", parsedOverlayData);
              parsedOverlayData = null; // Reset on validation failure
          }
      }
      // No 'else' needed, parsedOverlayData remains null if string is empty/{}
  } catch (e) {
      // Log the string from THIS scope that failed
      console.error("Error parsing overlay JSON:", e, "\\nOverlay String:", overlayString);
      parsedOverlayData = null; // Ensure reset on error
  }


  // --- Chart Setup ---
  var chart = root.container.children.push(am5xy.XYChart.new(root, {
    panX: true, panY: true, wheelX: "panX", wheelY: "zoomX",
    layout: root.verticalLayout, pinchZoomX: true
  }));

  // --- Cursor ---
  var cursor = chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "none" }));
  cursor.lineY.set("visible", false);

  // --- Prepare Combined Data for Category Axis ---
  // Use the PARSED variables (primaryData, parsedOverlayData)
  let allDataForAxis = [...primaryData];
  let hasValidOverlayData = false;

  if (parsedOverlayData && typeof parsedOverlayData === 'object') {
      const overlayKeys = Object.keys(parsedOverlayData);
      for (const weekKey of overlayKeys) { // weekKey defined for this block
          let weekData = parsedOverlayData[weekKey];
          if (weekData && Array.isArray(weekData) && weekData.length > 0) {
               let validItems = weekData.filter(item => item && typeof item === 'object' && item.hasOwnProperty('time'));
               if (validItems.length > 0) {
                   allDataForAxis.push(...validItems);
                   hasValidOverlayData = true;
               } else {
                    console.warn(\`Overlay data for key "${weekKey}" has items but none have a 'time' property.\`);
               }
          }
      } // End of for...of block
  } // End check for parsedOverlayData object

  // Extract unique time categories
  let uniqueTimes = [...new Set(allDataForAxis
      .map(item => item ? item.time : null)
      .filter(time => time !== undefined && time !== null && time !== '')
  )];
  let xAxisData = uniqueTimes.map(time => ({ time: time }));

  // --- X Axis ---
  var xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 70 });
  xRenderer.grid.template.set("location", 0.5);
  xRenderer.labels.template.setAll({ fontSize: 8, location: 0.5, rotation: -90, multiLocation: 0.5, centerX: am5.p50 });
  var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
    categoryField: "time", renderer: xRenderer,
    tooltip: am5.Tooltip.new(root, { labelText: "{categoryX}" })
  }));
  if (xAxisData.length > 0) { xAxis.data.setAll(xAxisData); }
  else { console.warn("No valid category data found for X-Axis."); }

  // --- Y Axis ---
  var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
    maxPrecision: 2, renderer: am5xy.AxisRendererY.new(root, {})
  }));

  // --- Area Series ---
  var areaSeries = chart.series.push(am5xy.LineSeries.new(root, {
    name: "Selected Week", xAxis: xAxis, yAxis: yAxis,
    valueYField: "value", categoryXField: "time",
    tooltip: am5.Tooltip.new(root, { labelText: "Selected: {valueY.formatNumber('#.00')}", dy:-5 })
  }));
  areaSeries.strokes.template.setAll({ templateField: "strokeSettings", strokeWidth: 2 });
  areaSeries.strokes.template.set("stroke", areaSeries.get("stroke"));
  areaSeries.fills.template.setAll({ visible: true, fillOpacity: 0.5, templateField: "fillSettings" });
  areaSeries.fills.template.set("fill", areaSeries.get("fill"));
  areaSeries.bullets.push(() => {
    return am5.Bullet.new(root, {
      sprite: am5.Circle.new(root, {
        templateField: "bulletSettings", radius: 3,
        fill: areaSeries.get("fill"), stroke: areaSeries.get("stroke")
      })
    });
  });
  areaSeries.data.setAll(primaryData); // Use parsed primary data
  areaSeries.appear(1000);


  // --- Column Series ---
  var columnSeries = chart.series.push(am5xy.ColumnSeries.new(root, {
    name: "Selected Week (Interval)", xAxis: xAxis, yAxis: yAxis,
    valueYField: "value2", categoryXField: "time",
    fill: am5.color("#023020"), stroke: am5.color("#023020"),
    tooltip: am5.Tooltip.new(root, { labelText: "Interval: {valueY.formatNumber('#.00')}", dy:-10 })
  }));
  columnSeries.columns.template.adapters.add("fill", (fill, target) => {
    return (target.dataItem && target.dataItem.get("valueY") < 0) ? am5.color("#8B0000") : fill;
  });
  columnSeries.columns.template.adapters.add("stroke", (stroke, target) => {
     return (target.dataItem && target.dataItem.get("valueY") < 0) ? am5.color("#8B0000") : stroke;
  });
  columnSeries.columns.template.setAll({ strokeWidth: 1, cornerRadiusTL: 3, cornerRadiusTR: 3, maxWidth: 10 });
  columnSeries.data.setAll(primaryData); // Use parsed primary data
  columnSeries.appear(1000);
  columnSeries.hide(0);


  // --- Overlay Line Series ---
  const overlayColors = { "This Week": "#228B22", "Last Week": "#FFA500", "2 Weeks Ago": "#800080", "3 Weeks Ago": "#DC143C" };
  let legendData = [areaSeries, columnSeries];

  // Use the PARSED parsedOverlayData variable
  if (hasValidOverlayData && parsedOverlayData && typeof parsedOverlayData === 'object') {
      const overlayKeys = Object.keys(parsedOverlayData);
      for (const weekKey of overlayKeys) { // weekKey defined for this block
          let weekData = parsedOverlayData[weekKey];
          // Validate data before creating series
          if (weekData && Array.isArray(weekData) && weekData.length > 0 && weekData.every(item => item && typeof item === 'object' && item.hasOwnProperty('time') && item.hasOwnProperty('value'))) {
              var lineSeries = chart.series.push(am5xy.LineSeries.new(root, {
                  name: weekKey,
                  xAxis: xAxis, yAxis: yAxis,
                  valueYField: "value", categoryXField: "time",
                  stroke: am5.color(overlayColors[weekKey] || root.interfaceColors.get("grid")),
                  tooltip: am5.Tooltip.new(root, { labelText: \`{name}: {valueY.formatNumber('#.00')}\` }),
                  connect: false
              }));
              lineSeries.data.setAll(weekData); // Set specific week data
              lineSeries.appear(1000);
              legendData.push(lineSeries);
          } else {
               console.warn(\`Skipping overlay series "${weekKey}" due to invalid data format or missing 'time'/'value'.\`);
          }
      } // End of for...of block
  } // End check for parsedOverlayData object

  // --- Legend (Conditional) ---
  if (legendData.length > 2) { // Only show legend if overlays were added
       var legend = chart.set("legend", am5.Legend.new(root, {
           centerX: am5.percent(50), x: am5.percent(50),
           layout: root.horizontalLayout, marginTop: 15, marginBottom: 15
       }));
       legend.itemContainers.template.set("toggleOnClick", true);
       legend.data.setAll(legendData);
  }

  // --- Axis Labels ---
  xAxis.children.push( am5.Label.new(root, { text: "Time of Day", x: am5.percent(50), centerX: am5.percent(50), paddingTop: 5 }) );
  yAxis.children.unshift( am5.Label.new(root, { rotation: -90, text: \`Average \${chartTypeLabel} Points\`, y: am5.percent(50), centerX: am5.percent(50) }) );

  // --- Scrollbar ---
  chart.set("scrollbarX", am5.Scrollbar.new(root, { orientation: "horizontal", marginBottom: 10 }));

  // --- Final Appear Animation ---
  chart.appear(1000, 100);

}); // end am5.ready()
</script>

  </body>
</html>`;

  // --- Encode and Return URI ---
  let enc = encodeURIComponent(ht);
  let uri = `data:text/html;charset=utf-8,${enc}`;
  return uri;
}
