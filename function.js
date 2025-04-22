window.function = function (data, overlayDataJson, width, height, type) {

  // --- Input Handling ---
  // Get the potentially non-JSON string for primary data
  let dataStringValue = data.value ?? '[]';
  // Overlay data is still assumed to be JSON
  let overlayDataJsonStringValue = overlayDataJson.value ?? '{}';
  let chartWidth = width.value ?? 100;
  let chartHeight = height.value ?? 550;
  let chartTypeLabel = type.value ?? "Value";

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
  // *** MODIFICATION: Embed primary data string DIRECTLY as JS literal ***
  // This assumes dataStringValue is a string containing JS code for an array/object
  // e.g., '[{ time: "9:30", value: 10, other: stuff }]'
  // It does NOT need to be valid JSON here.
  const rawPrimaryDataLiteral = ${dataStringValue};
  console.log("DEBUG: Embedded rawPrimaryDataLiteral:", rawPrimaryDataLiteral); // Check what JS parsed

  // Overlay data IS still expected to be a VALID JSON string
  const overlayString = ${JSON.stringify(overlayDataJsonStringValue)};
  const chartTypeLabel = ${JSON.stringify(chartTypeLabel)};
  const overlayColors = {
    "This Week": "#228B22", "Last Week": "#FFA500",
    "2 Weeks Ago": "#800080", "3 Weeks Ago": "#DC143C"
  };

  // --- Root Element and Theme ---
  var root = am5.Root.new("chartdiv");
  root.setThemes([am5themes_Animated.new(root)]);
  console.log("Root created.");

  // --- Data Parsing Function ---
  // *** MODIFIED: Takes the raw JS literal directly, doesn't parse primaryStr ***
  function parseChartData(rawPrimaryData, overlayStr) {
    let primaryData = [];
    let parsedOverlayData = null;
    let hasValidOverlay = false;

    // Process Primary Data (already parsed by JS engine)
    try {
      // Check if the result is an array
      if (Array.isArray(rawPrimaryData)) {
        // Filter for items with AT LEAST time and value, ignoring other properties
        primaryData = rawPrimaryData.filter(item =>
            item && typeof item === 'object' &&
            item.hasOwnProperty('time') && typeof item.time !== 'undefined' && item.time !== null &&
            item.hasOwnProperty('value') && typeof item.value === 'number' // Added type check for value
        );
        console.log("Primary data processed. Valid items with time/value:", primaryData.length);
        if (primaryData.length !== rawPrimaryData.length) {
            console.warn("Some primary data items filtered out (missing time/value or wrong types).");
        }
      } else {
        console.warn("Embedded primary data is not an array. Defaulting to empty.", rawPrimaryData);
        primaryData = []; // Ensure it's an array even if input wasn't
      }
    } catch (e) {
      // This catch is less likely now for primary data unless the raw literal had severe syntax errors
      console.error("Error processing embedded primary data:", e);
      primaryData = [];
    }

    // Parse Overlay Data (still using JSON.parse for the overlay string)
    try {
      if (overlayStr && overlayStr.trim() !== "" && overlayStr.trim() !== "{}") {
        parsedOverlayData = JSON.parse(overlayStr); // <<< Still parses overlayString as JSON
        if (typeof parsedOverlayData === 'object' && parsedOverlayData !== null && !Array.isArray(parsedOverlayData)) {
           let validKeys = 0;
           for (const key in parsedOverlayData) {
                if (Object.hasOwnProperty.call(parsedOverlayData, key)) {
                    const weekData = parsedOverlayData[key];
                    if(Array.isArray(weekData) && weekData.every(item => item && typeof item === 'object' && item.hasOwnProperty('time') && item.hasOwnProperty('value'))) {
                        validKeys++;
                    } else {
                         console.warn("Overlay data for key \\"" + key + "\\" is not valid. Ignoring.");
                         delete parsedOverlayData[key];
                    }
                }
           }
           if (validKeys > 0) {
               hasValidOverlay = true;
               console.log("Overlay data parsed. Valid keys:", validKeys);
           } else {
                console.warn("Overlay data parsed, but no valid keys found.");
                parsedOverlayData = null;
           }
        } else {
          console.warn("Parsed overlay data is not a valid object.");
          parsedOverlayData = null;
        }
      } else { console.log("No overlay data string provided."); }
    } catch (e) {
      console.error("Error parsing overlay JSON:", e, "\\nString:", overlayStr);
      parsedOverlayData = null;
    }
    return { primaryData, parsedOverlayData, hasValidOverlay };
  }

  // --- Axis Category Preparation (No changes needed here) ---
  function prepareAxisCategories(primaryData, overlayData) {
    let allDataForAxis = [...primaryData];
    // ... (rest of function is the same)
    if (overlayData) {
      try {
        Object.values(overlayData).forEach(weekArray => {
          if (Array.isArray(weekArray)) {
             allDataForAxis.push(...weekArray.filter(item => item && item.hasOwnProperty('time')));
          }
        });
      } catch(e) { console.error("Error processing overlay data for axis:", e); }
    }
    let uniqueTimes = [...new Set(allDataForAxis
        .map(item => item?.time)
        .filter(time => time !== undefined && time !== null && String(time).trim() !== ''))]
        .sort();
    let xAxisData = uniqueTimes.map(time => ({ time: time }));
    console.log("Axis categories prepared:", uniqueTimes.length);
    return xAxisData;
  }

  // --- Chart/Axes/Series/Legend/Config Functions (No changes needed in these) ---
  function createChartAndAxes(root, xAxisData) { /* ... same as before ... */
    console.log("Creating chart and axes...");
    var chart = root.container.children.push(am5xy.XYChart.new(root, {
      panX: true, panY: true, wheelX: "panX", wheelY: "zoomX",
      layout: root.verticalLayout, pinchZoomX: true
    }));
    var xRenderer = am5xy.AxisRendererX.new(root, {});
    xRenderer.grid.template.set("location", 0.5);
    xRenderer.labels.template.setAll({ fontSize: 8, location: 0.5, rotation: -90,
        centerY: am5.p50, centerX: am5.p100, paddingRight: 5 });
    var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
      categoryField: "time", renderer: xRenderer, tooltip: am5.Tooltip.new(root, {}) }));
    if (xAxisData.length > 0) { xAxis.data.setAll(xAxisData); }
    else { console.warn("X-Axis has no data."); }
    var yRenderer = am5xy.AxisRendererY.new(root, {});
    var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { maxPrecision: 2, renderer: yRenderer }));
    console.log("Chart and axes created.");
    return { chart, xAxis, yAxis };
   }
  function createPrimarySeries(chart, root, primaryData, xAxis, yAxis) { /* ... same as before ... */
    console.log("Creating primary series...");
    var areaSeries = chart.series.push(am5xy.LineSeries.new(root, {
      name: "Selected Week", xAxis: xAxis, yAxis: yAxis,
      valueYField: "value", categoryXField: "time", fillOpacity: 0.5,
      tooltip: am5.Tooltip.new(root, { labelText: "{valueY.formatNumber('#.00')}", dy: -5 }),
      connect: false }));
    areaSeries.strokes.template.set("strokeWidth", 2);
    areaSeries.fills.template.set("visible", true);
    areaSeries.bullets.push(function() { return am5.Bullet.new(root, { sprite: am5.Circle.new(root, {
          radius: 3, fill: areaSeries.get("fill") }) }); });
    areaSeries.data.setAll(primaryData); // Uses the FILTERED primaryData
    areaSeries.appear(1000);

    var columnSeries = chart.series.push(am5xy.ColumnSeries.new(root, {
      name: "Selected Week (Interval)", xAxis: xAxis, yAxis: yAxis,
      valueYField: "value", categoryXField: "time",
      tooltip: am5.Tooltip.new(root, { labelText: "Interval: {valueY.formatNumber('#.00')}", dy: -10 }) }));
    columnSeries.columns.template.adapters.add("fill", function(fill, target) {
      return (target.dataItem && target.dataItem.get("valueY") < 0) ? am5.color(0x8B0000) : fill; });
    columnSeries.columns.template.adapters.add("stroke", function(stroke, target) {
      return (target.dataItem && target.dataItem.get("valueY") < 0) ? am5.color(0x8B0000) : stroke; });
    columnSeries.columns.template.setAll({ strokeWidth: 1, width: am5.percent(60) });
    columnSeries.data.setAll(primaryData); // Uses the FILTERED primaryData
    columnSeries.hide(0);
    columnSeries.appear(1000);
    console.log("Primary series created.");
    return [areaSeries, columnSeries];
   }
  function createOverlaySeries(chart, root, overlayData, colors, xAxis, yAxis) { /* ... same as before ... */
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
            tooltip: am5.Tooltip.new(root, { labelText: "{name}: {valueY.formatNumber('#.00')}" }),
            connect: false }));
          lineSeries.strokes.template.set("strokeWidth", 2);
          lineSeries.data.setAll(weekData);
          lineSeries.appear(1000);
          overlaySeriesList.push(lineSeries);
        }
      }
    } catch (e) { console.error("Error creating overlay series:", e); }
    console.log("Overlay series creation finished:", overlaySeriesList.length);
    return overlaySeriesList;
  }
  function createLegend(chart, root, seriesList) { /* ... same as before ... */
    if (!seriesList || seriesList.length <= 2) { console.log("Skipping legend."); return null; }
    console.log("Creating legend...");
    var legend = chart.children.push(am5.Legend.new(root, {
      x: am5.percent(50), centerX: am5.percent(50), layout: root.horizontalLayout,
      marginTop: 15, marginBottom: 15 }));
    legend.itemContainers.template.set("toggleOnClick", true);
    legend.data.setAll(seriesList);
    console.log("Legend created.");
    return legend;
   }
  function configureChart(chart, root, yAxis, xAxis, label) { /* ... same as before ... */
    console.log("Configuring final chart elements...");
    var cursor = chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "none" }));
    cursor.lineY.set("visible", false);
    yAxis.children.unshift(am5.Label.new(root, {
      rotation: -90, text: "Average " + label + " Points",
      y: am5.p50, centerX: am5.p50, paddingRight: 10 }));
    xAxis.children.push(am5.Label.new(root, {
      text: "Time of Day", x: am5.p50, centerX: am5.percent(50), paddingTop: 10 }));
    chart.set("scrollbarX", am5.Scrollbar.new(root, { orientation: "horizontal", marginBottom: 5 }));
    chart.appear(1000, 100);
    console.log("Chart configured.");
   }


  // --- Main Execution Flow ---
  console.log("--- Starting Chart Build Process ---");

  // *** MODIFIED: Pass the raw JS literal directly to parseChartData ***
  const { primaryData, parsedOverlayData, hasValidOverlay } = parseChartData(rawPrimaryDataLiteral, overlayString);

  // The rest of the flow uses the processed 'primaryData' which should now be clean
  const xAxisData = prepareAxisCategories(primaryData, parsedOverlayData);
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
