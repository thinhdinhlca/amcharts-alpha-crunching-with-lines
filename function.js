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

  // --- Root Element and Theme ---
  var root = am5.Root.new("chartdiv");
  root.setThemes([am5themes_Animated.new(root)]);
  console.log("Root created.");

  // --- Data Parsing Function (Simplified - Unchanged) ---
  function parseChartData(primaryStr, overlayStr) { /* ... */
    let primaryData = []; let parsedOverlayData = null; let hasValidOverlay = false;
    try { let rawPrimary = JSON.parse(primaryStr); if (Array.isArray(rawPrimary)) { primaryData = rawPrimary.filter(item => item && typeof item === 'object' && item.hasOwnProperty('time') && typeof item.time === 'string' && item.hasOwnProperty('value') && typeof item.value === 'number'); console.log("Primary data parsed & filtered:", primaryData.length); if (primaryData.length !== rawPrimary.length) { console.warn("Some primary data items were filtered out."); } } else { console.warn("Parsed primary data is not an array."); } } catch (e) { console.error("Error parsing primary data JSON:", e); primaryData = []; }
    try { if (overlayStr && overlayStr.trim() !== "" && overlayStr.trim() !== "{}") { let rawOverlay = JSON.parse(overlayStr); if (typeof rawOverlay === 'object' && rawOverlay !== null && !Array.isArray(rawOverlay)) { parsedOverlayData = {}; let validKeys = 0; for (const key in rawOverlay) { if (Object.hasOwnProperty.call(rawOverlay, key)) { const weekDataRaw = rawOverlay[key]; if(Array.isArray(weekDataRaw)) { const processedWeekData = weekDataRaw.filter(item => item && typeof item === 'object' && item.hasOwnProperty('time') && typeof item.time === 'string' && item.hasOwnProperty('value') && typeof item.value === 'number' ); if (processedWeekData.length > 0) { parsedOverlayData[key] = processedWeekData; validKeys++; } else { console.warn("Overlay data for key \\"" + key + "\\" had no valid items after filtering."); } } else { console.warn("Overlay data for key \\"" + key + "\\" was not an array."); } } } if (validKeys > 0) { hasValidOverlay = true; console.log("Overlay data parsed. Valid keys:", validKeys); } else { console.warn("Overlay data parsed, but no valid keys/data found."); parsedOverlayData = null; } } else { console.warn("Parsed overlay data is not a valid object."); } } else { console.log("No overlay data string provided."); } } catch (e) { console.error("Error parsing overlay JSON:", e); parsedOverlayData = null; }
    return { primaryData, parsedOverlayData, hasValidOverlay };
  }

  // --- Axis Category Preparation (Simplified - Unchanged) ---
  function prepareAxisCategories(primaryData) { /* ... */
    if (!primaryData || primaryData.length === 0) { console.warn("Primary data is empty, axis will be empty."); return []; } try { console.log("Preparing axis categories assuming input primary data is sorted."); let categoryStrings = primaryData.map(item => item.time); let uniqueCategoryStrings = categoryStrings.filter((value, index, self) => self.indexOf(value) === index); let xAxisData = uniqueCategoryStrings.map(timeStr => ({ time: timeStr })); console.log("Axis categories prepared from primary data:", xAxisData.length); return xAxisData; } catch (e) { console.error("Error preparing axis categories:", e); return []; }
  }

  // --- Chart and Axes Creation (Using CategoryAxis - Unchanged) ---
  function createChartAndAxes(root, xAxisData) { /* ... */
    console.log("Creating chart and axes (using CategoryAxis)..."); var chart = root.container.children.push(am5xy.XYChart.new(root, { panX: true, panY: true, wheelX: "panX", wheelY: "zoomX", layout: root.verticalLayout, pinchZoomX: true })); var xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 70 }); xRenderer.labels.template.setAll({ fontSize: 8, rotation: -90, centerY: am5.p50, centerX: am5.p100, paddingRight: 5 }); var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, { categoryField: "time", renderer: xRenderer, tooltip: am5.Tooltip.new(root, {}) })); if (xAxisData.length > 0) { xAxis.data.setAll(xAxisData); console.log("Set", xAxisData.length, "categories on X-Axis."); } else { console.warn("X-Axis has no data categories."); } var yRenderer = am5xy.AxisRendererY.new(root, {}); var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { maxPrecision: 2, renderer: yRenderer })); console.log("Chart and axes created."); return { chart, xAxis, yAxis };
   }


  // --- Primary Series Creation ---
  // *** MODIFIED: Set fixed colors, add column series, fix tooltips ***
  function createPrimarySeries(chart, root, primaryData, xAxis, yAxis) {
    console.log("Creating primary series...");

    // 1. Area Series (LineSeries with fill)
    var areaSeries = chart.series.push(am5xy.LineSeries.new(root, {
      name: "Selected Week",
      xAxis: xAxis, yAxis: yAxis,
      valueYField: "value",
      categoryXField: "time",
      // *** Set fixed colors (adjust as needed) ***
      stroke: am5.color(0x06038D), // Dark Blue border
      fill: am5.color(0xADD8E6),   // Light Blue fill
      fillOpacity: 0.7,             // Adjust opacity
      connect: false,
      tooltip: am5.Tooltip.new(root, {
          getFillFromSprite: true, // Inherit background from series fill/stroke
          labelTextColor: am5.color(0xffffff), // White text
          labelText: "{valueY.formatNumber('#.00')} @ {categoryX}"
      })
    }));
    areaSeries.strokes.template.set("strokeWidth", 2); // Keep border thickness
    areaSeries.fills.template.set("visible", true); // Ensure fill is shown
    // Bullets
    areaSeries.bullets.push(function() {
      return am5.Bullet.new(root, {
        sprite: am5.Circle.new(root, {
          radius: 3,
          fill: areaSeries.get("stroke") // Match bullet to border color
        })
      });
    });
    areaSeries.data.setAll(primaryData);
    areaSeries.appear(1000);

    // 2. Column Series (reintroduced)
    var columnSeries = chart.series.push(am5xy.ColumnSeries.new(root, {
      name: "Selected Week (Interval)", // Legend name
      xAxis: xAxis, yAxis: yAxis,
      valueYField: "value", // *** Use 'value' field from primary data ***
      categoryXField: "time",
      // Default colors will be overridden by adapter below
      tooltip: am5.Tooltip.new(root, {
          getFillFromSprite: true, // Inherit background color
          labelTextColor: am5.color(0xffffff), // White text
          labelText: "Interval: {valueY.formatNumber('#.00')} @ {categoryX}" // Uses 'value'
      })
    }));
    // Adapter for positive/negative coloring (like old chart)
    columnSeries.columns.template.adapters.add("fill", function(fill, target) {
      // Use a default positive color (e.g., dark green) if none is set by theme
      const defaultPositiveColor = am5.color(0x006400); // DarkGreen
      if (target.dataItem && target.dataItem.get("valueY") < 0) {
        return am5.color(0x8B0000); // DarkRed for negative
      }
      return fill || defaultPositiveColor; // Use theme color or default green
    });
    columnSeries.columns.template.adapters.add("stroke", function(stroke, target) {
       // Match stroke to fill
      const defaultPositiveColor = am5.color(0x006400);
      if (target.dataItem && target.dataItem.get("valueY") < 0) {
        return am5.color(0x8B0000);
      }
       return stroke || defaultPositiveColor;
    });
    // Column Styling
    columnSeries.columns.template.setAll({
      // fillOpacity: 1, // Usually default
      strokeWidth: 1, // Thinner stroke for columns
      width: am5.percent(60) // Adjust width as needed
      // cornerRadiusTL: 5, // Optional rounding
      // cornerRadiusTR: 5
    });
    columnSeries.data.setAll(primaryData); // Use the same primary data
    columnSeries.hide(0); // Start hidden
    columnSeries.appear(1000);

    console.log("Primary series (Area & Column) created.");
    // Return BOTH series for the legend
    return [areaSeries, columnSeries];
  }


  // --- Overlay Series Creation ---
  // *** MODIFIED: Fix tooltip color ***
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
            name: weekKey,
            xAxis: xAxis, yAxis: yAxis,
            valueYField: "value",
            categoryXField: "time",
            stroke: am5.color(colors[weekKey] || root.interfaceColors.get("grid")),
            connect: false,
            tooltip: am5.Tooltip.new(root, {
                getFillFromSprite: true, // Inherit background color
                labelTextColor: am5.color(0xffffff), // White text
                labelText: "{name}: {valueY.formatNumber('#.00')} @ {categoryX}"
            })
          }));
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


  // --- Legend Creation (Unchanged) ---
  function createLegend(chart, root, seriesList) {
     // Now receives [areaSeries, columnSeries, overlay1, overlay2, ...]
     if (!seriesList || seriesList.length === 0) { // Check if list is empty
         console.log("Skipping legend (no series)."); return null;
     }
     // Optionally hide legend if only primary series exist:
     // if (seriesList.length <= 2) { console.log("Skipping legend (only primary series)."); return null;}

     console.log("Creating legend for", seriesList.length, "series...");
     var legend = chart.children.push(am5.Legend.new(root, {
         x: am5.percent(50), centerX: am5.percent(50),
         layout: root.horizontalLayout,
         marginTop: 15, marginBottom: 15
     }));
     legend.itemContainers.template.set("toggleOnClick", true); // Allow toggle
     legend.data.setAll(seriesList);
     console.log("Legend created.");
     return legend;
   }

  // --- Final Chart Configuration (Unchanged) ---
  function configureChart(chart, root, yAxis, xAxis, label) { /* ... */
     console.log("Configuring final chart elements..."); var cursor = chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "none" })); cursor.lineY.set("visible", false); yAxis.children.unshift(am5.Label.new(root, { rotation: -90, text: "Average " + label + " Points", y: am5.p50, centerX: am5.p50, paddingRight: 10 })); xAxis.children.push(am5.Label.new(root, { text: "Time of Day", x: am5.p50, centerX: am5.percent(50), paddingTop: 10 })); chart.set("scrollbarX", am5.Scrollbar.new(root, { orientation: "horizontal", marginBottom: 5 })); chart.appear(1000, 100); console.log("Chart configured.");
   }


  // --- Main Execution Flow ---
  console.log("--- Starting Chart Build Process ---");
  const { primaryData, parsedOverlayData, hasValidOverlay } = parseChartData(primaryDataString, overlayString);
  const xAxisData = prepareAxisCategories(primaryData);
  const { chart, xAxis, yAxis } = createChartAndAxes(root, xAxisData);

  // *** primarySeries now returns [areaSeries, columnSeries] ***
  const primarySeries = createPrimarySeries(chart, root, primaryData, xAxis, yAxis);
  const overlaySeries = createOverlaySeries(chart, root, parsedOverlayData, overlayColors, xAxis, yAxis);

  // *** Combine ALL series for the legend ***
  const allSeriesForLegend = [...primarySeries, ...overlaySeries]; // Spread primarySeries array

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
