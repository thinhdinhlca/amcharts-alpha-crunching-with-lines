window.function = function (data, overlayDataJson, width, height, type) {

  // --- Input Handling & Cleaning (Simpler: only need time/value) ---
  let dataStringValue = data.value ?? '[]';
  let overlayDataJsonStringValue = overlayDataJson.value ?? '{}';
  let chartWidth = width.value ?? 100;
  let chartHeight = height.value ?? 550;
  let chartTypeLabel = type.value ?? "Value";
  let cleanedDataString = '[]';
  try {
    let tempString = dataStringValue.trim();
    // Basic cleaning (remove known invalid JS, quote keys)
    tempString = tempString.replace(/strokeSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    tempString = tempString.replace(/fillSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, ''); // Also remove fillSettings if they existed
    tempString = tempString.replace(/bulletSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, ''); // Also remove bulletSettings
    tempString = tempString.replace(/,\s*(\})/g, '$1'); // Remove trailing commas in objects
    tempString = tempString.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3'); // Quote keys

    // We now might have value2/value3 keys, but we only care about time/value later
    // We'll just try to make it parseable JSON

    if (tempString && !tempString.startsWith('[')) { tempString = '[' + tempString; }
    if (tempString && !tempString.endsWith(']')) { tempString = tempString + ']'; }

    if (!tempString || tempString === "[]" || tempString === "") { cleanedDataString = '[]'; }
    else {
        // Test parse
        JSON.parse(tempString);
        cleanedDataString = tempString;
        console.log("DEBUG: Cleaned primary data string potentially valid JSON.");
    }
  } catch (cleaningError) {
      console.error("!!! Failed to clean primary data string !!!", cleaningError);
      cleanedDataString = '[]';
  }


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
  // Define desired fixed colors
  const primaryOutlineColor = "#09077b";
  const primaryFillColor = "#b6dbee";

  // --- Root Element and Theme ---
  var root = am5.Root.new("chartdiv");
  root.setThemes([am5themes_Animated.new(root)]);
  console.log("Root created.");

  // --- Data Parsing Function (Simplified: Only require time/value) ---
  function parseChartData(primaryStr, overlayStr) {
    let primaryData = [];
    let parsedOverlayData = null;
    let hasValidOverlay = false;

    // Parse Primary Data (Filter for time/value only)
    try {
      let rawPrimary = JSON.parse(primaryStr);
      if (Array.isArray(rawPrimary)) {
        primaryData = rawPrimary.filter(item =>
            item && typeof item === 'object' &&
            item.hasOwnProperty('time') && typeof item.time === 'string' &&
            item.hasOwnProperty('value') && typeof item.value === 'number'
        );
        console.log("Primary data parsed & filtered for time/value:", primaryData.length);
      } else { console.warn("Parsed primary data is not an array."); }
    } catch (e) { console.error("Error parsing primary data JSON:", e); primaryData = []; }

    // Parse Overlay Data (Filter for time/value only)
    try { /* ... same overlay parsing/filtering as before ... */
        if (overlayStr && overlayStr.trim() !== "" && overlayStr.trim() !== "{}") { let rawOverlay = JSON.parse(overlayStr); if (typeof rawOverlay === 'object' && rawOverlay !== null && !Array.isArray(rawOverlay)) { parsedOverlayData = {}; let validKeys = 0; for (const key in rawOverlay) { if (Object.hasOwnProperty.call(rawOverlay, key)) { const weekDataRaw = rawOverlay[key]; if(Array.isArray(weekDataRaw)) { const processedWeekData = weekDataRaw.filter(item => item && typeof item === 'object' && item.hasOwnProperty('time') && typeof item.time === 'string' && item.hasOwnProperty('value') && typeof item.value === 'number' ); if (processedWeekData.length > 0) { parsedOverlayData[key] = processedWeekData; validKeys++; } else { console.warn("Overlay data for key \\"" + key + "\\" had no valid items after filtering."); } } else { console.warn("Overlay data for key \\"" + key + "\\" was not an array."); } } } if (validKeys > 0) { hasValidOverlay = true; console.log("Overlay data parsed. Valid keys with data:", validKeys); } else { console.warn("Overlay data parsed, but no valid keys/data found."); parsedOverlayData = null; } } else { console.warn("Parsed overlay data is not a valid object."); } } else { console.log("No overlay data string provided."); }
    } catch (e) { console.error("Error parsing overlay JSON:", e); parsedOverlayData = null; }

    return { primaryData, parsedOverlayData, hasValidOverlay };
  }


  // --- Axis Category Preparation (Using primary data IN ORDER - Unchanged) ---
  function prepareAxisCategories(primaryData) { /* ... same simplified version ... */
    if (!primaryData || primaryData.length === 0) { console.warn("Primary data is empty, axis will be empty."); return []; } try { console.log("Preparing axis categories assuming input primary data is sorted."); let categoryStrings = primaryData.map(item => item.time); let uniqueCategoryStrings = categoryStrings.filter((value, index, self) => self.indexOf(value) === index); let xAxisData = uniqueCategoryStrings.map(timeStr => ({ time: timeStr })); console.log("Axis categories prepared from primary data:", xAxisData.length); return xAxisData; } catch (e) { console.error("Error preparing axis categories:", e); return []; }
  }


  // --- Chart and Axes Creation (Using CategoryAxis - Unchanged) ---
  function createChartAndAxes(root, xAxisData) { /* ... */
    console.log("Creating chart and axes (using CategoryAxis)..."); var chart = root.container.children.push(am5xy.XYChart.new(root, { panX: true, panY: true, wheelX: "panX", wheelY: "zoomX", layout: root.verticalLayout, pinchZoomX: true })); var xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 70 }); xRenderer.labels.template.setAll({ fontSize: 8, rotation: -90, centerY: am5.p50, centerX: am5.p100, paddingRight: 5 }); var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, { categoryField: "time", renderer: xRenderer, tooltip: am5.Tooltip.new(root, {}) })); if (xAxisData.length > 0) { xAxis.data.setAll(xAxisData); console.log("Set", xAxisData.length, "categories on X-Axis."); } else { console.warn("X-Axis has no data categories."); } var yRenderer = am5xy.AxisRendererY.new(root, {}); var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { maxPrecision: 2, renderer: yRenderer })); console.log("Chart and axes created."); return { chart, xAxis, yAxis };
   }


  // --- Primary Series Creation ---
  // *** MODIFIED: Only ONE series (Area), fixed colors, no bullets ***
  function createPrimarySeries(chart, root, primaryData, xAxis, yAxis) {
    console.log("Creating primary AREA series...");

    var areaSeries = chart.series.push(am5xy.LineSeries.new(root, {
      name: "Selected Week", // Name for Legend
      xAxis: xAxis, yAxis: yAxis,
      valueYField: "value",
      categoryXField: "time",
      stroke: am5.color(primaryOutlineColor), // Use defined outline color
      fill: am5.color(primaryFillColor),     // Use defined fill color
      fillOpacity: 0.8, // Make fill reasonably opaque
      connect: false, // Keep false unless connection needed
      tooltip: am5.Tooltip.new(root, {
          getFillFromSprite: false, // Don't inherit fill
          background: am5.Graphics.new(root, { // Manual background
              fill: am5.color(primaryOutlineColor), // Match outline
              fillOpacity: 0.9
          }),
          labelTextColor: am5.color(0xffffff), // White text
          labelText: "{valueY.formatNumber('#.00')} @ {categoryX}" // Keep time here
      })
    }));
    areaSeries.strokes.template.set("strokeWidth", 2); // Outline thickness
    areaSeries.fills.template.set("visible", true);
    // NO BULLETS

    areaSeries.data.setAll(primaryData);
    areaSeries.appear(1000);

    console.log("Primary AREA series created.");
    // *** Return only the area series ***
    return [areaSeries]; // Return as array for consistency in legend logic
  }


  // --- Overlay Series Creation ---
  // *** MODIFIED: Simplified tooltip ***
  function createOverlaySeries(chart, root, overlayData, colors, xAxis, yAxis) {
    let overlaySeriesList = [];
    if (!overlayData) { console.log("No valid overlay data provided."); return overlaySeriesList; }
    console.log("Creating overlay series...");
    try {
      for (const weekKey in overlayData) {
        if (Object.hasOwnProperty.call(overlayData, weekKey)) {
          const weekData = overlayData[weekKey]; // Should be {time: string, value: number}
          console.log("Creating LineSeries for: " + weekKey);
          var lineSeries = chart.series.push(am5xy.LineSeries.new(root, {
            name: weekKey,
            xAxis: xAxis, yAxis: yAxis,
            valueYField: "value",
            categoryXField: "time",
            stroke: am5.color(colors[weekKey] || root.interfaceColors.get("grid")),
            connect: false,
            tooltip: am5.Tooltip.new(root, {
                getFillFromSprite: true,
                labelTextColor: am5.color(0xffffff),
                // *** SIMPLIFIED TOOLTIP TEXT ***
                labelText: "{name}: {valueY.formatNumber('#.00')}"
            })
          }));
          lineSeries.strokes.template.set("strokeWidth", 2);
          // NO BULLETS for overlays
          lineSeries.data.setAll(weekData);
          lineSeries.appear(1000);
          overlaySeriesList.push(lineSeries);
        }
      }
    } catch (e) { console.error("Error creating overlay series:", e); }
    console.log("Overlay series creation finished:", overlaySeriesList.length);
    return overlaySeriesList;
   }


  // --- Legend Creation (Handles combined list) ---
  function createLegend(chart, root, seriesList) {
     if (!seriesList || seriesList.length === 0) {
         console.log("Skipping legend (no series)."); return null;
     }
     // Optionally hide legend if only primary area series exists
     // if (seriesList.length <= 1) { console.log("Skipping legend (only primary series)."); return null;}

     console.log("Creating legend for", seriesList.length, "series...");
     var legend = chart.children.push(am5.Legend.new(root, {
         x: am5.percent(50), centerX: am5.percent(50),
         layout: root.horizontalLayout,
         marginTop: 15, marginBottom: 15
     }));
     legend.itemContainers.template.set("toggleOnClick", true);
     legend.data.setAll(seriesList); // Contains [areaSeries, overlay1, overlay2...]
     console.log("Legend created.");
     return legend;
   }

  // --- Final Chart Configuration (Unchanged) ---
  function configureChart(chart, root, yAxis, xAxis, label) { /* ... */ console.log("Configuring final chart elements..."); var cursor = chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "none" })); cursor.lineY.set("visible", false); yAxis.children.unshift(am5.Label.new(root, { rotation: -90, text: "Average " + label + " Points", y: am5.p50, centerX: am5.p50, paddingRight: 10 })); xAxis.children.push(am5.Label.new(root, { text: "Time of Day", x: am5.p50, centerX: am5.percent(50), paddingTop: 10 })); chart.set("scrollbarX", am5.Scrollbar.new(root, { orientation: "horizontal", marginBottom: 5 })); chart.appear(1000, 100); console.log("Chart configured."); }


  // --- Main Execution Flow ---
  console.log("--- Starting Chart Build Process ---");
  const { primaryData, parsedOverlayData, hasValidOverlay } = parseChartData(primaryDataString, overlayString);
  const xAxisData = prepareAxisCategories(primaryData);
  const { chart, xAxis, yAxis } = createChartAndAxes(root, xAxisData);

  // *** primarySeries now returns only [areaSeries] ***
  const primarySeries = createPrimarySeries(chart, root, primaryData, xAxis, yAxis);
  const overlaySeries = createOverlaySeries(chart, root, parsedOverlayData, overlayColors, xAxis, yAxis);

  // Combine all series for the legend
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
