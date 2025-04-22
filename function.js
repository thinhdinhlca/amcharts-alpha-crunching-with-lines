window.function = function (data, overlayDataJson, width, height, type) {

  // --- Input Handling & Cleaning (Still needed) ---
  let dataStringValue = data.value ?? '[]';
  let overlayDataJsonStringValue = overlayDataJson.value ?? '{}';
  let chartWidth = width.value ?? 100;
  let chartHeight = height.value ?? 550;
  let chartTypeLabel = type.value ?? "Value";
  let cleanedDataString = '[]';
  try { /* ... cleaning logic (same as before)... */
    let tempString = dataStringValue.trim();
    tempString = tempString.replace(/strokeSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    tempString = tempString.replace(/fillSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    tempString = tempString.replace(/bulletSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    tempString = tempString.replace(/,\s*(\})/g, '$1');
    tempString = tempString.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');
    if (tempString && !tempString.startsWith('[')) { tempString = '[' + tempString; }
    if (tempString && !tempString.endsWith(']')) { tempString = tempString + ']'; }
     if (!tempString || tempString === "[]" || tempString === "") { cleanedDataString = '[]'; }
     else { JSON.parse(tempString); cleanedDataString = tempString; console.log("DEBUG: Cleaned primary data string potentially valid JSON."); }
  } catch (cleaningError) { console.error("!!! Failed to clean primary data string !!!", cleaningError); cleanedDataString = '[]'; }
  // console.log("DEBUG: Final string for primary data:", cleanedDataString);


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
  // Primary Chart Colors
  const primaryOutlineColor = "#09077b";
  const primaryFillColor = "#b6dbee";
  // Value2 Bar Colors
  const positiveValue2Color = "#052f20"; // Dark Green
  const negativeValue2Color = "#78080e"; // Dark Red

  // --- Root Element and Theme ---
  var root = am5.Root.new("chartdiv");
  root.setThemes([am5themes_Animated.new(root)]);
  console.log("Root created.");

  // --- Data Parsing Function ---
  // *** Keep value2 if it exists and is a number ***
  function parseChartData(primaryStr, overlayStr) {
    let primaryData = [];
    let parsedOverlayData = null;
    let hasValidOverlay = false;

    // Parse Primary Data (Filter for time/value, keep valid value2)
    try {
      let rawPrimary = JSON.parse(primaryStr);
      if (Array.isArray(rawPrimary)) {
        primaryData = rawPrimary.map(item => {
            // Basic validation
            if (!(item && typeof item === 'object' &&
                  item.hasOwnProperty('time') && typeof item.time === 'string' &&
                  item.hasOwnProperty('value') && typeof item.value === 'number')) {
                return null; // Must have time and value
            }
            // Keep value2 only if it's a valid number
            if (item.hasOwnProperty('value2') && typeof item.value2 !== 'number') {
                delete item.value2; // Remove invalid value2
            }
            return item;
        }).filter(item => item !== null); // Remove items that failed basic validation

        console.log("Primary data parsed & filtered (kept valid value2):", primaryData.length);
      } else { console.warn("Parsed primary data is not an array."); }
    } catch (e) { console.error("Error parsing primary data JSON:", e); primaryData = []; }

    // Parse Overlay Data (Filter for time/value)
    try { /* ... same overlay parsing as before ... */
        if (overlayStr && overlayStr.trim() !== "" && overlayStr.trim() !== "{}") { let rawOverlay = JSON.parse(overlayStr); if (typeof rawOverlay === 'object' && rawOverlay !== null && !Array.isArray(rawOverlay)) { parsedOverlayData = {}; let validKeys = 0; for (const key in rawOverlay) { if (Object.hasOwnProperty.call(rawOverlay, key)) { const weekDataRaw = rawOverlay[key]; if(Array.isArray(weekDataRaw)) { const processedWeekData = weekDataRaw.filter(item => item && typeof item === 'object' && item.hasOwnProperty('time') && typeof item.time === 'string' && item.hasOwnProperty('value') && typeof item.value === 'number' ); if (processedWeekData.length > 0) { parsedOverlayData[key] = processedWeekData; validKeys++; } else { console.warn("Overlay data for key \\"" + key + "\\" had no valid items after filtering."); } } else { console.warn("Overlay data for key \\"" + key + "\\" was not an array."); } } } if (validKeys > 0) { hasValidOverlay = true; console.log("Overlay data parsed. Valid keys with data:", validKeys); } else { console.warn("Overlay data parsed, but no valid keys/data found."); parsedOverlayData = null; } } else { console.warn("Parsed overlay data is not a valid object."); } } else { console.log("No overlay data string provided."); }
    } catch (e) { console.error("Error parsing overlay JSON:", e); parsedOverlayData = null; }

    return { primaryData, parsedOverlayData, hasValidOverlay };
  }


  // --- Axis Category Preparation (Using primary data IN ORDER - Unchanged) ---
  function prepareAxisCategories(primaryData) { /* ... */
     if (!primaryData || primaryData.length === 0) { console.warn("Primary data is empty, axis will be empty."); return []; } try { console.log("Preparing axis categories assuming input primary data is sorted."); let categoryStrings = primaryData.map(item => item.time); let uniqueCategoryStrings = categoryStrings.filter((value, index, self) => self.indexOf(value) === index); let xAxisData = uniqueCategoryStrings.map(timeStr => ({ time: timeStr })); console.log("Axis categories prepared from primary data:", xAxisData.length); return xAxisData; } catch (e) { console.error("Error preparing axis categories:", e); return []; }
   }

  // --- Chart and Axes Creation (Using CategoryAxis - Unchanged) ---
  function createChartAndAxes(root, xAxisData) { /* ... */
    console.log("Creating chart and axes (using CategoryAxis)..."); var chart = root.container.children.push(am5xy.XYChart.new(root, { panX: true, panY: true, wheelX: "panX", wheelY: "zoomX", layout: root.verticalLayout, pinchZoomX: true })); var xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 70 }); xRenderer.labels.template.setAll({ fontSize: 8, rotation: -90, centerY: am5.p50, centerX: am5.p100, paddingRight: 5 }); var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, { categoryField: "time", renderer: xRenderer, tooltip: am5.Tooltip.new(root, {}) })); if (xAxisData.length > 0) { xAxis.data.setAll(xAxisData); console.log("Set", xAxisData.length, "categories on X-Axis."); } else { console.warn("X-Axis has no data categories."); } var yRenderer = am5xy.AxisRendererY.new(root, {}); var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { maxPrecision: 2, renderer: yRenderer })); console.log("Chart and axes created."); return { chart, xAxis, yAxis };
   }


  // --- Primary Series Creation ---
  // *** MODIFIED: Column based on value2, specific colors, no column tooltip ***
  function createPrimarySeries(chart, root, primaryData, xAxis, yAxis) {
    console.log("Creating primary series (Area & Value2 Column)...");

    // 1. Area Series (Value, Fixed Style, No Bullets, Not Toggleable)
    var areaSeries = chart.series.push(am5xy.LineSeries.new(root, {
      name: "Selected Week",
      xAxis: xAxis, yAxis: yAxis,
      valueYField: "value", // Base line uses 'value'
      categoryXField: "time",
      stroke: am5.color(primaryOutlineColor),
      fill: am5.color(primaryFillColor),
      fillOpacity: 0.8,
      connect: false,
      toggleable: false, // Cannot be turned off via legend
      tooltip: am5.Tooltip.new(root, {
          getFillFromSprite: false,
          background: am5.Graphics.new(root, { fill: am5.color(primaryOutlineColor), fillOpacity: 0.9 }),
          labelTextColor: am5.color(0xffffff),
          labelText: "{valueY.formatNumber('#.00')} @ {categoryX}" // Shows 'value' and time
      })
    }));
    areaSeries.strokes.template.set("strokeWidth", 2);
    areaSeries.fills.template.set("visible", true);
    // NO BULLETS
    areaSeries.data.setAll(primaryData); // Data includes value and potentially value2
    areaSeries.appear(1000);

    // 2. Column Series (Cumulative, based on value2, Red/Green, No Tooltip, Not Toggleable)
    var columnSeries = chart.series.push(am5xy.ColumnSeries.new(root, {
      name: "Selected Week (Cumulative)", // More descriptive name
      xAxis: xAxis, yAxis: yAxis,
      valueYField: "value2", // *** Height now based on 'value2' ***
                             // Columns will only render if value2 is present and numeric
      categoryXField: "time",
      toggleable: false, // *** Cannot be turned off via legend ***
      // *** NO TOOLTIP for this series ***
    }));

    // Adapter for positive/negative coloring based *only* on value2
    columnSeries.columns.template.adapters.add("fill", function(fill, target) {
      const value2 = target.dataItem?.get("valueY"); // valueY is bound to value2 field
      if (typeof value2 === 'number') {
          return value2 < 0 ? am5.color(negativeValue2Color) : am5.color(positiveValue2Color);
      }
      // If value2 is missing/invalid, theoretically no column drawn, but return default just in case
      return fill || am5.color(positiveValue2Color);
    });
    columnSeries.columns.template.adapters.add("stroke", function(stroke, target) {
       const value2 = target.dataItem?.get("valueY");
       if (typeof value2 === 'number') {
           return value2 < 0 ? am5.color(negativeValue2Color) : am5.color(positiveValue2Color);
       }
       return stroke || am5.color(positiveValue2Color);
    });

    // Column Styling: Standard width, visible stroke
    columnSeries.columns.template.setAll({
      strokeWidth: 1,
      strokeOpacity: 1, // Make stroke visible
      width: am5.percent(60) // Standard bar width
    });

    columnSeries.data.setAll(primaryData); // Use the same data; columns only appear if value2 exists
    columnSeries.appear(1000); // Show by default

    console.log("Primary series (Area & Column) created.");
    return [areaSeries, columnSeries]; // Return both for Legend list
  }


  // --- Overlay Series Creation (Tooltip background matches line) ---
  function createOverlaySeries(chart, root, overlayData, colors, xAxis, yAxis) { /* ... same as previous ... */
    let overlaySeriesList = []; if (!overlayData) { console.log("No valid overlay data provided."); return overlaySeriesList; } console.log("Creating overlay series..."); try { for (const weekKey in overlayData) { if (Object.hasOwnProperty.call(overlayData, weekKey)) { const weekData = overlayData[weekKey]; console.log("Creating LineSeries for: " + weekKey); var lineSeries = chart.series.push(am5xy.LineSeries.new(root, { name: weekKey, xAxis: xAxis, yAxis: yAxis, valueYField: "value", categoryXField: "time", stroke: am5.color(colors[weekKey] || root.interfaceColors.get("grid")), connect: false, tooltip: am5.Tooltip.new(root, { getFillFromSprite: true, labelTextColor: am5.color(0xffffff), labelText: "{name}: {valueY.formatNumber('#.00')}" }) })); lineSeries.strokes.template.set("strokeWidth", 2); lineSeries.data.setAll(weekData); lineSeries.appear(1000); overlaySeriesList.push(lineSeries); } } } catch (e) { console.error("Error creating overlay series:", e); } console.log("Overlay series creation finished:", overlaySeriesList.length); return overlaySeriesList;
   }

  // --- Legend Creation (Handles non-toggleable primary series) ---
  function createLegend(chart, root, seriesList) { /* ... same as previous ... */
     if (!seriesList || seriesList.length === 0) { console.log("Skipping legend (no series)."); return null; } console.log("Creating legend for", seriesList.length, "series..."); var legend = chart.children.push(am5.Legend.new(root, { x: am5.percent(50), centerX: am5.percent(50), layout: root.horizontalLayout, marginTop: 15, marginBottom: 15 })); legend.itemContainers.template.set("toggleOnClick", true); legend.data.setAll(seriesList); console.log("Legend created."); return legend;
   }

  // --- Final Chart Configuration (Unchanged) ---
  function configureChart(chart, root, yAxis, xAxis, label) { /* ... */ console.log("Configuring final chart elements..."); var cursor = chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "none" })); cursor.lineY.set("visible", false); yAxis.children.unshift(am5.Label.new(root, { rotation: -90, text: "Average " + label + " Points", y: am5.p50, centerX: am5.p50, paddingRight: 10 })); xAxis.children.push(am5.Label.new(root, { text: "Time of Day", x: am5.p50, centerX: am5.percent(50), paddingTop: 10 })); chart.set("scrollbarX", am5.Scrollbar.new(root, { orientation: "horizontal", marginBottom: 5 })); chart.appear(1000, 100); console.log("Chart configured."); }


  // --- Main Execution Flow (Unchanged) ---
  console.log("--- Starting Chart Build Process ---");
  const { primaryData, parsedOverlayData, hasValidOverlay } = parseChartData(primaryDataString, overlayString);
  const xAxisData = prepareAxisCategories(primaryData);
  const { chart, xAxis, yAxis } = createChartAndAxes(root, xAxisData);
  const primarySeries = createPrimarySeries(chart, root, primaryData, xAxis, yAxis); // Returns [area, column]
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
