window.function = function (data, overlayDataJson, width, height, type) {

  // --- Input Handling & Cleaning (Still needed for the legacy format) ---
  let dataStringValue = data.value ?? '[]';
  let overlayDataJsonStringValue = overlayDataJson.value ?? '{}';
  let chartWidth = width.value ?? 100;
  let chartHeight = height.value ?? 550;
  let chartTypeLabel = type.value ?? "Value";
  let cleanedDataString = '[]';
  try {
    let tempString = dataStringValue.trim();
    tempString = tempString.replace(/strokeSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, ''); // Remove strokeSettings
    tempString = tempString.replace(/,\s*(\})/g, '$1'); // Remove trailing commas in objects
    // Quote keys more reliably, handling spaces
    tempString = tempString.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');
    if (tempString && !tempString.startsWith('[')) { tempString = '[' + tempString; }
    if (tempString && !tempString.endsWith(']')) { tempString = tempString + ']'; }
     if (!tempString || tempString === "[]" || tempString === "") { cleanedDataString = '[]'; }
     else { JSON.parse(tempString); cleanedDataString = tempString; console.log("DEBUG: Cleaned primary data string potentially valid JSON."); }
  } catch (cleaningError) { console.error("!!! Failed to clean primary data string !!!", cleaningError); cleanedDataString = '[]'; }
  console.log("DEBUG: Final string for primary data:", cleanedDataString);


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

  // --- Helper: Parse "Day HH:MM AM/PM" to Timestamp ---
  // Assigns days relative to an arbitrary start (e.g., Jan 1, 2024 was a Monday)
  function parseTimeStringToTimestamp(timeString) {
      if (!timeString || typeof timeString !== 'string') return null;
      const parts = timeString.match(/(\w+)\s+(\d{1,2}):(\d{2})\s+(AM|PM)/i);
      if (!parts) return null;

      const dayStr = parts[1].toLowerCase();
      let hour = parseInt(parts[2], 10);
      const minute = parseInt(parts[3], 10);
      const ampm = parts[4].toUpperCase();

      // Basic day mapping (adjust year/month start day if needed)
      const dayMap = { "monday": 1, "tuesday": 2, "wednesday": 3, "thursday": 4, "friday": 5, "saturday": 6, "sunday": 7 };
      const dayOffset = dayMap[dayStr] || 1; // Default to Monday if unknown

      if (ampm === "PM" && hour < 12) hour += 12;
      if (ampm === "AM" && hour === 12) hour = 0; // Midnight

      // Using an arbitrary start date (Jan 1, 2024 was a Monday)
      const date = new Date(2024, 0, dayOffset, hour, minute); // Year, Month (0-indexed), Day, Hour, Minute
      return date.getTime(); // Return milliseconds timestamp
  }

  // --- Data Parsing Function ---
  // *** MODIFIED: Add 'timestamp' field ***
  function parseChartData(primaryStr, overlayStr) {
    let primaryData = [];
    let parsedOverlayData = null;
    let hasValidOverlay = false;

    // Parse and Process Primary Data
    try {
      let rawPrimary = JSON.parse(primaryStr);
      if (Array.isArray(rawPrimary)) {
        primaryData = rawPrimary
          .map(item => {
              if (item && typeof item === 'object' && item.hasOwnProperty('time') && item.hasOwnProperty('value')) {
                  const timestamp = parseTimeStringToTimestamp(item.time);
                  if (timestamp !== null && typeof item.value === 'number') {
                      // Keep original 'time' if needed for tooltips, add 'timestamp'
                      return { ...item, timestamp: timestamp };
                  }
              }
              return null; // Exclude invalid items
          })
          .filter(item => item !== null); // Remove nulls

        console.log("Primary data parsed & processed. Valid items:", primaryData.length);
      } else { console.warn("Parsed primary data is not an array."); }
    } catch (e) { console.error("Error parsing/processing primary data JSON:", e); }

    // Parse and Process Overlay Data
    try {
      if (overlayStr && overlayStr.trim() !== "" && overlayStr.trim() !== "{}") {
        let rawOverlay = JSON.parse(overlayStr);
        if (typeof rawOverlay === 'object' && rawOverlay !== null && !Array.isArray(rawOverlay)) {
            parsedOverlayData = {}; // Initialize object for processed data
            let validKeys = 0;
            for (const key in rawOverlay) {
                if (Object.hasOwnProperty.call(rawOverlay, key)) {
                    const weekDataRaw = rawOverlay[key];
                    if(Array.isArray(weekDataRaw)) {
                         const processedWeekData = weekDataRaw
                            .map(item => {
                                if (item && typeof item === 'object' && item.hasOwnProperty('time') && item.hasOwnProperty('value')) {
                                    const timestamp = parseTimeStringToTimestamp(item.time);
                                    if (timestamp !== null && typeof item.value === 'number') {
                                        return { ...item, timestamp: timestamp };
                                    }
                                }
                                return null;
                            })
                            .filter(item => item !== null);

                        if (processedWeekData.length > 0) {
                            parsedOverlayData[key] = processedWeekData; // Add processed data
                            validKeys++;
                        } else {
                             console.warn("Overlay data for key \\"" + key + "\\" had no valid items after processing.");
                        }
                    } else {
                        console.warn("Overlay data for key \\"" + key + "\\" was not an array.");
                    }
                }
           }
           if (validKeys > 0) { hasValidOverlay = true; console.log("Overlay data parsed & processed. Valid keys:", validKeys); }
           else { console.warn("Overlay data parsed, but no valid keys/data found."); parsedOverlayData = null; }
        } else { console.warn("Parsed overlay data is not a valid object."); }
      } else { console.log("No overlay data string provided."); }
    } catch (e) { console.error("Error parsing/processing overlay JSON:", e); parsedOverlayData = null; }

    return { primaryData, parsedOverlayData, hasValidOverlay };
  }

  // --- Chart and Axes Creation ---
  // *** MODIFIED: Use DateAxis for X-Axis ***
  function createChartAndAxes(root) { // No xAxisData needed as input
    console.log("Creating chart and axes (using DateAxis)...");
    var chart = root.container.children.push(am5xy.XYChart.new(root, {
      panX: true, panY: true, wheelX: "panX", wheelY: "zoomX",
      layout: root.verticalLayout, pinchZoomX: true
    }));

    // --- Create X Axis (DateAxis) ---
    var xRenderer = am5xy.AxisRendererX.new(root, {
        minGridDistance: 70 // Adjust for label density
    });
    // Optional: Customize date label formatting
    xRenderer.labels.template.setAll({
        fontSize: 8,
        rotation: -45, // Less rotation might be okay now
        centerY: am5.p50,
        centerX: am5.p100,
        paddingRight: 7
    });

    var xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
      // Define the base interval of your data (e.g., 5 minutes)
      baseInterval: { timeUnit: "minute", count: 5 }, // *** ADJUST THIS TO MATCH YOUR DATA FREQUENCY ***
      renderer: xRenderer,
      tooltip: am5.Tooltip.new(root, {
          // Format the date/time shown in the axis tooltip
          dateFormat: "EEE HH:mm" // Example: Mon 09:30
      })
    }));
    // Set date formats for labels at different zoom levels (optional but nice)
    xAxis.get("dateFormats")["minute"] = "HH:mm"; // Show HH:mm when zoomed in
    xAxis.get("dateFormats")["hour"] = "HH:mm";
    xAxis.get("dateFormats")["day"] = "MMM dd"; // Show Month Day when zoomed out
    xAxis.get("dateFormats")["week"] = "MMM dd";
    xAxis.get("dateFormats")["month"] = "MMM";
    xAxis.get("dateFormats")["year"] = "yyyy";

    // --- Create Y Axis (ValueAxis - unchanged) ---
    var yRenderer = am5xy.AxisRendererY.new(root, {});
    var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
      maxPrecision: 2, // Or 0 if you prefer integers
      renderer: yRenderer
    }));

    console.log("Chart and axes created.");
    return { chart, xAxis, yAxis };
  }

  // --- Primary Series Creation (Area + Column) ---
  // *** MODIFIED: Use valueXField, connect:false crucial ***
  function createPrimarySeries(chart, root, primaryData, xAxis, yAxis) {
    console.log("Creating primary series...");

    // Area Series (LineSeries with fill)
    var areaSeries = chart.series.push(am5xy.LineSeries.new(root, {
      name: "Selected Week",
      xAxis: xAxis, yAxis: yAxis,
      valueYField: "value",
      valueXField: "timestamp", // *** Use timestamp for X value ***
      fillOpacity: 0.5,
      connect: false, // *** Keep false to break gaps (like overnight) ***
      tooltip: am5.Tooltip.new(root, {
        // Pointer date format needs to match axis/data
        pointerOrientation: "horizontal",
        labelText: "{valueY.formatNumber('#.00')} @ {valueX.formatDate('EEE HH:mm')}" // Show value and time
      })
    }));
    areaSeries.strokes.template.set("strokeWidth", 2);
    areaSeries.fills.template.setAll({
      visible: true,
      fill: areaSeries.get("stroke") // Fill color from line
    });
    // Bullets (optional)
    areaSeries.bullets.push(function() {
      return am5.Bullet.new(root, { sprite: am5.Circle.new(root, {
          radius: 3, fill: areaSeries.get("stroke") }) }); });

    areaSeries.data.setAll(primaryData);
    areaSeries.appear(1000);

    // Column Series (Hidden by default)
    var columnSeries = chart.series.push(am5xy.ColumnSeries.new(root, {
      name: "Selected Week (Interval)",
      xAxis: xAxis, yAxis: yAxis,
      valueYField: "value",
      valueXField: "timestamp", // *** Use timestamp for X value ***
      connect: false,
      tooltip: am5.Tooltip.new(root, {
        labelText: "Interval: {valueY.formatNumber('#.00')} @ {valueX.formatDate('EEE HH:mm')}"
      })
    }));
    // Column coloring adapters (same as before)
    columnSeries.columns.template.adapters.add("fill", function(fill, target) { /* ... */ return (target.dataItem && target.dataItem.get("valueY") < 0) ? am5.color(0x8B0000) : fill; });
    columnSeries.columns.template.adapters.add("stroke", function(stroke, target) { /* ... */ return (target.dataItem && target.dataItem.get("valueY") < 0) ? am5.color(0x8B0000) : stroke; });
    columnSeries.columns.template.setAll({ strokeWidth: 1, width: am5.percent(60) });

    columnSeries.data.setAll(primaryData);
    columnSeries.hide(0);
    columnSeries.appear(1000);

    console.log("Primary series created.");
    return [areaSeries, columnSeries];
  }

  // --- Overlay Series Creation ---
  // *** MODIFIED: Use valueXField ***
  function createOverlaySeries(chart, root, overlayData, colors, xAxis, yAxis) {
    let overlaySeriesList = [];
    if (!overlayData) { console.log("No valid overlay data provided."); return overlaySeriesList; }
    console.log("Creating overlay series...");
    try {
      for (const weekKey in overlayData) {
        if (Object.hasOwnProperty.call(overlayData, weekKey)) {
          const weekData = overlayData[weekKey]; // This is now processed data with timestamps
          console.log("Creating LineSeries for: " + weekKey);
          var lineSeries = chart.series.push(am5xy.LineSeries.new(root, {
            name: weekKey,
            xAxis: xAxis, yAxis: yAxis,
            valueYField: "value",
            valueXField: "timestamp", // *** Use timestamp for X value ***
            stroke: am5.color(colors[weekKey] || root.interfaceColors.get("grid")),
            connect: false, // *** Keep false to break gaps ***
            tooltip: am5.Tooltip.new(root, {
               labelText: "{name}: {valueY.formatNumber('#.00')} @ {valueX.formatDate('EEE HH:mm')}"
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

  // --- Legend Creation (Same as before) ---
  function createLegend(chart, root, seriesList) { /* ... */
    if (!seriesList || seriesList.length <= 2) { console.log("Skipping legend."); return null; } console.log("Creating legend..."); var legend = chart.children.push(am5.Legend.new(root, { x: am5.percent(50), centerX: am5.percent(50), layout: root.horizontalLayout, marginTop: 15, marginBottom: 15 })); legend.itemContainers.template.set("toggleOnClick", true); legend.data.setAll(seriesList); console.log("Legend created."); return legend;
   }

  // --- Final Chart Configuration (Same as before) ---
  function configureChart(chart, root, yAxis, xAxis, label) { /* ... */
     console.log("Configuring final chart elements..."); var cursor = chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "none" })); cursor.lineY.set("visible", false); yAxis.children.unshift(am5.Label.new(root, { rotation: -90, text: "Average " + label + " Points", y: am5.p50, centerX: am5.p50, paddingRight: 10 })); xAxis.children.push(am5.Label.new(root, { text: "Time of Day", x: am5.p50, centerX: am5.percent(50), paddingTop: 10 })); chart.set("scrollbarX", am5.Scrollbar.new(root, { orientation: "horizontal", marginBottom: 5 })); chart.appear(1000, 100); console.log("Chart configured.");
   }

  // --- Main Execution Flow ---
  console.log("--- Starting Chart Build Process ---");
  const { primaryData, parsedOverlayData, hasValidOverlay } = parseChartData(primaryDataString, overlayString); // Now returns data with timestamps

  // *** Axis creation doesn't need xAxisData anymore ***
  const { chart, xAxis, yAxis } = createChartAndAxes(root); // Create axes

  // Series creation uses the processed data with timestamps
  const primarySeries = createPrimarySeries(chart, root, primaryData, xAxis, yAxis);
  const overlaySeries = createOverlaySeries(chart, root, parsedOverlayData, overlayColors, xAxis, yAxis);

  // Legend and final config are the same
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
