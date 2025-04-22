window.function = function (data, overlayDataJson, width, height, type) {

  // --- Input Handling & Cleaning (Same as before) ---
  let dataStringValue = data.value ?? '[]';
  let overlayDataJsonStringValue = overlayDataJson.value ?? '{}';
  let chartWidth = width.value ?? 100;
  let chartHeight = height.value ?? 550;
  let chartTypeLabel = type.value ?? "Value";
  let cleanedDataString = '[]';
  try { /* ... cleaning logic ... */
    let tempString = dataStringValue.trim();
    tempString = tempString.replace(/strokeSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    tempString = tempString.replace(/,\s*(\})/g, '$1');
    tempString = tempString.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
    if (tempString && !tempString.startsWith('[')) { tempString = '[' + tempString; }
    if (tempString && !tempString.endsWith(']')) { tempString = tempString + ']'; }
     if (!tempString || tempString === "[]" || tempString === "") { cleanedDataString = '[]'; }
     else { JSON.parse(tempString); cleanedDataString = tempString; console.log("DEBUG: Successfully cleaned primary data string."); }
  } catch (cleaningError) { console.error("!!! Failed to clean primary data string !!!", cleaningError); cleanedDataString = '[]'; }
  console.log("DEBUG: Final string being embedded for primary data:", cleanedDataString);


  // --- HTML Template ---
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
    html, body { margin: 0; padding: 0; height: 100%; width: 100%; }
    #chartdiv { width: ${chartWidth}%; height: ${chartHeight}px; }
  </style>
</head>
<body>
  <div id="chartdiv"></div>

<script>
am5.ready(function() {

  console.log("am5.ready() invoked.");

  // --- Configuration & Data ---
  const primaryDataString = ${JSON.stringify(cleanedDataString)};
  const overlayString = ${JSON.stringify(overlayDataJsonStringValue)};
  const chartTypeLabel = ${JSON.stringify(chartTypeLabel)};
  const overlayColors = { "This Week": "#228B22", "Last Week": "#FFA500", "2 Weeks Ago": "#800080", "3 Weeks Ago": "#DC143C" };

  // --- Root Element and Theme ---
  var root = am5.Root.new("chartdiv");
  root.setThemes([am5themes_Animated.new(root)]);
  console.log("Root created.");

  // --- Data Parsing Function (Same as before) ---
  function parseChartData(primaryStr, overlayStr) { /* ... */
    let primaryData = []; let parsedOverlayData = null; let hasValidOverlay = false;
    try { let rawPrimary = JSON.parse(primaryStr); if (Array.isArray(rawPrimary)) { primaryData = rawPrimary.filter(item => item && typeof item === 'object' && item.hasOwnProperty('time') && typeof item.time !== 'undefined' && item.time !== null && item.hasOwnProperty('value') && typeof item.value === 'number'); console.log("Primary data parsed. Valid items:", primaryData.length); if (primaryData.length !== rawPrimary.length) { console.warn("Some primary data items filtered out."); } } else { console.warn("Parsed primary data is not an array."); primaryData = []; } } catch (e) { console.error("Error parsing primary data JSON:", e); primaryData = []; }
    try { if (overlayStr && overlayStr.trim() !== "" && overlayStr.trim() !== "{}") { parsedOverlayData = JSON.parse(overlayStr); if (typeof parsedOverlayData === 'object' && parsedOverlayData !== null && !Array.isArray(parsedOverlayData)) { let validKeys = 0; for (const key in parsedOverlayData) { if (Object.hasOwnProperty.call(parsedOverlayData, key)) { const weekData = parsedOverlayData[key]; if(Array.isArray(weekData) && weekData.every(item => item && typeof item === 'object' && item.hasOwnProperty('time') && item.hasOwnProperty('value'))) { validKeys++; } else { console.warn("Overlay data for key \\"" + key + "\\" is not valid. Ignoring."); delete parsedOverlayData[key]; } } } if (validKeys > 0) { hasValidOverlay = true; console.log("Overlay data parsed. Valid keys:", validKeys); } else { console.warn("Overlay data parsed, but no valid keys found."); parsedOverlayData = null; } } else { console.warn("Parsed overlay data is not a valid object."); parsedOverlayData = null; } } else { console.log("No overlay data string provided."); } } catch (e) { console.error("Error parsing overlay JSON:", e); parsedOverlayData = null; }
    return { primaryData, parsedOverlayData, hasValidOverlay };
   }

  // --- Axis Category Preparation (Same as before - uses primaryData only) ---
  function prepareAxisCategories(primaryData) { /* ... */
    let allDataForAxis = [...primaryData]; console.log("Axis categories based SOLELY on primary data.");
    if (!primaryData || primaryData.length === 0) { console.warn("Primary data is empty, axis will be empty."); return []; }
    try { let uniqueTimes = [...new Set(allDataForAxis .map(item => item?.time) .filter(time => time !== undefined && time !== null && String(time).trim() !== ''))] .sort(); let xAxisData = uniqueTimes.map(time => ({ time: time })); console.log("Axis categories prepared (from primary). Unique times:", uniqueTimes.length); return xAxisData; } catch (e) { console.error("Error preparing axis categories from primary data:", e); return []; }
  }

  // --- Chart and Axes Creation (Same as before) ---
  function createChartAndAxes(root, xAxisData) { /* ... */
    console.log("Creating chart and axes..."); var chart = root.container.children.push(am5xy.XYChart.new(root, { panX: true, panY: true, wheelX: "panX", wheelY: "zoomX", layout: root.verticalLayout, pinchZoomX: true })); var xRenderer = am5xy.AxisRendererX.new(root, {}); xRenderer.grid.template.set("location", 0.5); xRenderer.labels.template.setAll({ fontSize: 8, location: 0.5, rotation: -90, centerY: am5.p50, centerX: am5.p100, paddingRight: 5 }); var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, { categoryField: "time", renderer: xRenderer, tooltip: am5.Tooltip.new(root, {}) })); if (xAxisData.length > 0) { xAxis.data.setAll(xAxisData); } else { console.warn("X-Axis has no data."); } var yRenderer = am5xy.AxisRendererY.new(root, {}); var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { maxPrecision: 2, renderer: yRenderer })); console.log("Chart and axes created."); return { chart, xAxis, yAxis };
   }

  // --- Primary Series Creation (Area + Column) ---
  // *** MODIFIED: Explicitly set fill color ***
  function createPrimarySeries(chart, root, primaryData, xAxis, yAxis) {
    console.log("Creating primary series...");

    // Area Series (LineSeries with fill)
    var areaSeries = chart.series.push(am5xy.LineSeries.new(root, {
      name: "Selected Week", // Name for Legend
      xAxis: xAxis, yAxis: yAxis,
      valueYField: "value",
      categoryXField: "time",
      fillOpacity: 0.5, // Opacity for the fill
      connect: false, // *** Ensure line breaks on gaps ***
      tooltip: am5.Tooltip.new(root, {
        labelText: "{valueY.formatNumber('#.00')}",
        dy: -5
      })
    }));
    areaSeries.strokes.template.set("strokeWidth", 2); // Line thickness
    areaSeries.fills.template.setAll({
      visible: true, // *** Ensure fill is visible ***
      // *** Explicitly set fill based on stroke color ***
      fill: areaSeries.get("stroke")
    });

    // Bullets
    areaSeries.bullets.push(function() {
      return am5.Bullet.new(root, {
        sprite: am5.Circle.new(root, {
          radius: 3,
          fill: areaSeries.get("stroke") // Bullets match line color
        })
      });
    });

    areaSeries.data.setAll(primaryData);
    areaSeries.appear(1000);

    // Column Series (Hidden by default)
    var columnSeries = chart.series.push(am5xy.ColumnSeries.new(root, {
      name: "Selected Week (Interval)",
      xAxis: xAxis, yAxis: yAxis,
      valueYField: "value", // Still uses primary data's 'value'
      categoryXField: "time",
      connect: false, // Columns don't really "connect", but doesn't hurt
      tooltip: am5.Tooltip.new(root, {
        labelText: "Interval: {valueY.formatNumber('#.00')}",
        dy: -10
      })
    }));
    // Adapters for column color
    columnSeries.columns.template.adapters.add("fill", function(fill, target) {
      return (target.dataItem && target.dataItem.get("valueY") < 0) ? am5.color(0x8B0000) : fill; });
    columnSeries.columns.template.adapters.add("stroke", function(stroke, target) {
      return (target.dataItem && target.dataItem.get("valueY") < 0) ? am5.color(0x8B0000) : stroke; });
    columnSeries.columns.template.setAll({ strokeWidth: 1, width: am5.percent(60) });

    columnSeries.data.setAll(primaryData);
    columnSeries.hide(0); // Start hidden
    columnSeries.appear(1000);

    console.log("Primary series created.");
    return [areaSeries, columnSeries];
  }

  // --- Overlay Series Creation (Same as before - connect:false is important) ---
  function createOverlaySeries(chart, root, overlayData, colors, xAxis, yAxis) {
    let overlaySeriesList = [];
    if (!overlayData) { console.log("No valid overlay data provided."); return overlaySeriesList; }
    console.log("Creating overlay series...");
    try {
      for (const weekKey in overlayData) {
        if (Object.hasOwnProperty.call(overlayData, weekKey)) {
          const weekData = overlayData[weekKey];
          console.log("Creating LineSeries for: " + weekKey);
          var lineSeries = chart.series.push(am5xy.LineSeries.new(root, {
            name: weekKey, xAxis: xAxis, yAxis: yAxis,
            valueYField: "value", categoryXField: "time",
            stroke: am5.color(colors[weekKey] || root.interfaceColors.get("grid")),
            connect: false, // *** Ensure overlays also break on gaps ***
            tooltip: am5.Tooltip.new(root, { labelText: "{name}: {valueY.formatNumber('#.00')}" })
          }));
          lineSeries.strokes.template.set("strokeWidth", 2);
          lineSeries.data.setAll(weekData); // Set data for this overlay
          lineSeries.appear(1000);
          overlaySeriesList.push(lineSeries);
        }
      }
    } catch (e) { console.error("Error creating overlay series:", e); }
    console.log("Overlay series creation finished:", overlaySeriesList.length);
    return overlaySeriesList;
   }

  // --- Legend Creation (Same as before) ---
  function createLegend(chart, root, seriesList) { /* ... */
     if (!seriesList || seriesList.length <= 2) { console.log("Skipping legend."); return null; } console.log("Creating legend..."); var legend = chart.children.push(am5.Legend.new(root, { x: am5.percent(50), centerX: am5.percent(50), layout: root.horizontalLayout, marginTop: 15, marginBottom: 15 })); legend.itemContainers.template.set("toggleOnClick", true); legend.data.setAll(seriesList); console.log("Legend created."); return legend;
   }

  // --- Final Chart Configuration (Same as before) ---
  function configureChart(chart, root, yAxis, xAxis, label) { /* ... */
    console.log("Configuring final chart elements..."); var cursor = chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "none" })); cursor.lineY.set("visible", false); yAxis.children.unshift(am5.Label.new(root, { rotation: -90, text: "Average " + label + " Points", y: am5.p50, centerX: am5.p50, paddingRight: 10 })); xAxis.children.push(am5.Label.new(root, { text: "Time of Day", x: am5.p50, centerX: am5.percent(50), paddingTop: 10 })); chart.set("scrollbarX", am5.Scrollbar.new(root, { orientation: "horizontal", marginBottom: 5 })); chart.appear(1000, 100); console.log("Chart configured.");
   }

  // --- Main Execution Flow (Same as before) ---
  console.log("--- Starting Chart Build Process ---");
  const { primaryData, parsedOverlayData, hasValidOverlay } = parseChartData(primaryDataString, overlayString);
  const xAxisData = prepareAxisCategories(primaryData); // Base axis on primary data ONLY
  const { chart, xAxis, yAxis } = createChartAndAxes(root, xAxisData);
  const primarySeries = createPrimarySeries(chart, root, primaryData, xAxis, yAxis);
  const overlaySeries = createOverlaySeries(chart, root, parsedOverlayData, overlayColors, xAxis, yAxis);
  const allSeriesForLegend = [...primarySeries, ...overlaySeries];
  createLegend(chart, root, allSeriesForLegend);
  configureChart(chart, root, yAxis, xAxis, chartTypeLabel);
  console.log("--- Chart Build Process Complete ---");

}); // end am5.ready()
</script>

</body>
</html>`;

  // --- Encode and Return URI ---
  const encodedHtml = encodeURIComponent(ht);
  const dataUri = `data:text/html;charset=utf-8,${encodedHtml}`;
  return dataUri;
}
