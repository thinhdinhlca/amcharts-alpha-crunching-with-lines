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

  // --- Helper: Parse "Day HH:MM AM/PM" to Timestamp ---
  // *** ADDED MORE DETAILED LOGGING ***
  function parseTimeStringToTimestamp(timeString) {
      if (!timeString || typeof timeString !== 'string') {
          // console.log("DEBUG parseTime: Input not a valid string", timeString);
          return null;
      }
      const originalTrimmed = timeString.trim();

      // Log character codes IF regex fails later
      let charCodes = [];
      for (let i = 0; i < originalTrimmed.length; i++) {
          charCodes.push(originalTrimmed.charCodeAt(i));
      }

      const parts = originalTrimmed.match(/(\w+)\s+(\d{1,2}):(\d{2})\s+(AM|PM)/i);
      if (!parts) {
          // Log failure reason and character codes
          console.warn("DEBUG parseTime: Regex failed for string:", "'" + originalTrimmed + "'", "CharCodes:", charCodes.join(', '));
          return null;
      }

      // If regex succeeded, proceed with parsing parts
      const dayStr = parts[1].toLowerCase();
      let hour = parseInt(parts[2], 10);
      const minute = parseInt(parts[3], 10);
      const ampm = parts[4].toUpperCase();

      const dayMap = { "monday": 1, "tuesday": 2, "wednesday": 3, "thursday": 4, "friday": 5, "saturday": 6, "sunday": 7 };
      const dayOffset = dayMap[dayStr];

      if (!dayOffset) {
          console.warn("DEBUG parseTime: Invalid day name:", dayStr, "in string:", originalTrimmed);
          return null;
      }
      if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) { // Added sanity checks
          console.warn("DEBUG parseTime: Invalid hour/minute parsed:", parts[2], parts[3], "->", hour, minute, "in string:", originalTrimmed);
          return null;
      }

      if (ampm === "PM" && hour < 12) hour += 12;
      if (ampm === "AM" && hour === 12) hour = 0; // Midnight case

      const date = new Date(Date.UTC(2024, 0, dayOffset, hour, minute));
      if (isNaN(date.getTime())) {
          console.warn("DEBUG parseTime: Failed to create valid Date object for:", originalTrimmed, "using H:", hour, "M:", minute);
          return null;
      }

      // If all checks pass, return the timestamp
      return date.getTime();
  }


  // --- Data Parsing Function ---
  // *** ADDED MORE DETAILED LOGGING FOR OVERLAY FILTER ***
  function parseChartData(primaryStr, overlayStr) {
    let primaryData = [];
    let parsedOverlayData = null;
    let hasValidOverlay = false;

    // Parse and Process Primary Data (for sorting)
    try { /* ... same sorting logic as before ... */
      let rawPrimary = JSON.parse(primaryStr);
      if (Array.isArray(rawPrimary)) {
        primaryData = rawPrimary
          .map(item => {
              if (item && typeof item === 'object' && item.hasOwnProperty('time') && item.hasOwnProperty('value') && typeof item.value === 'number') {
                  const timestamp = parseTimeStringToTimestamp(item.time); // Attempt parse
                  return timestamp !== null ? { ...item, _tempTimestamp: timestamp } : null; // Only keep if parse succeeded
              } return null; })
          .filter(item => item !== null); // Filter out items where time parse failed
        primaryData.sort((a, b) => a._tempTimestamp - b._tempTimestamp);
        console.log("Primary data parsed & sorted (based on parsable times):", primaryData.length);
      } else { console.warn("Parsed primary data is not an array."); }
    } catch (e) { console.error("Error parsing/processing primary data JSON:", e); primaryData = []; }

    // Parse Overlay Data
    try {
      if (overlayStr && overlayStr.trim() !== "" && overlayStr.trim() !== "{}") {
        let rawOverlay = JSON.parse(overlayStr);
        if (typeof rawOverlay === 'object' && rawOverlay !== null && !Array.isArray(rawOverlay)) {
            parsedOverlayData = {};
            let validKeys = 0;
            for (const key in rawOverlay) { // Iterate through keys like "Last Week", "2 Weeks Ago"
                if (Object.hasOwnProperty.call(rawOverlay, key)) {
                    const weekDataRaw = rawOverlay[key];
                    if(Array.isArray(weekDataRaw)) { // Check if the value for the key is an array
                         let invalidItemCount = 0;
                         let failureReasons = {}; // Count reasons for failure

                         const processedWeekData = weekDataRaw.filter((item, index) => {
                             let isValid = true;
                             let reason = "";

                             if (!item || typeof item !== 'object') {
                                 isValid = false; reason = "Not an object";
                             } else if (!item.hasOwnProperty('time') || typeof item.time !== 'string') {
                                 isValid = false; reason = "Missing/invalid time string";
                             } else if (!item.hasOwnProperty('value') || typeof item.value !== 'number') {
                                 isValid = false; reason = "Missing/invalid value number";
                             }

                             // Log failures concisely
                             if (!isValid) {
                                 failureReasons[reason] = (failureReasons[reason] || 0) + 1;
                                 // Log first few raw failures
                                 if (invalidItemCount < 3) {
                                     console.warn("DEBUG Overlay Filter Fail:", "Key:", key, "Idx:", index, "Reason:", reason, "Item:", JSON.stringify(item));
                                 }
                                 invalidItemCount++;
                             }
                             return isValid;
                         });

                        if (processedWeekData.length > 0) {
                            parsedOverlayData[key] = processedWeekData;
                            validKeys++;
                            if (invalidItemCount > 0) {
                                console.warn("Overlay key", key, "had", invalidItemCount, "invalid items filtered out. Reasons:", JSON.stringify(failureReasons));
                            }
                        } else {
                             // This log means *all* items failed the filter for this key
                             console.warn("Overlay data for key \\"" + key + "\\" had NO valid items after filtering. Reasons:", JSON.stringify(failureReasons));
                        }
                    } else { console.warn("Overlay data for key \\"" + key + "\\" was not an array."); }
                }
           }
           if (validKeys > 0) { hasValidOverlay = true; console.log("Overlay data parsed. Valid keys with data:", validKeys); }
           else { console.warn("Overlay data parsed, but NO valid keys/data found after filtering."); parsedOverlayData = null; }
        } else { console.warn("Parsed overlay data is not a valid object (expected key-value pairs)."); }
      } else { console.log("No overlay data string provided."); }
    } catch (e) { console.error("Error parsing overlay JSON:", e); parsedOverlayData = null; }

    return { primaryData, parsedOverlayData, hasValidOverlay };
  }


  // --- Axis Category Preparation (Uses sorted primary data - unchanged) ---
  function prepareAxisCategories(sortedPrimaryData) { /* ... unchanged ... */
      if (!sortedPrimaryData || sortedPrimaryData.length === 0) { console.warn("Primary data is empty, axis will be empty."); return []; }
      try { let categoryStrings = sortedPrimaryData.map(item => item.time); categoryStrings = [...new Set(categoryStrings)]; let xAxisData = categoryStrings.map(timeStr => ({ time: timeStr })); console.log("Axis categories prepared from sorted primary data:", xAxisData.length); return xAxisData; } catch (e) { console.error("Error preparing axis categories:", e); return []; }
  }

  // --- Chart and Axes Creation (Uses CategoryAxis - unchanged) ---
  function createChartAndAxes(root, xAxisData) { /* ... unchanged ... */
    console.log("Creating chart and axes (using CategoryAxis)..."); var chart = root.container.children.push(am5xy.XYChart.new(root, { panX: true, panY: true, wheelX: "panX", wheelY: "zoomX", layout: root.verticalLayout, pinchZoomX: true })); var xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 70 }); xRenderer.labels.template.setAll({ fontSize: 8, rotation: -90, centerY: am5.p50, centerX: am5.p100, paddingRight: 5 }); var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, { categoryField: "time", renderer: xRenderer, tooltip: am5.Tooltip.new(root, {}) })); if (xAxisData.length > 0) { xAxis.data.setAll(xAxisData); console.log("Set", xAxisData.length, "sorted categories on X-Axis."); } else { console.warn("X-Axis has no data categories."); } var yRenderer = am5xy.AxisRendererY.new(root, {}); var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { maxPrecision: 2, renderer: yRenderer })); console.log("Chart and axes created."); return { chart, xAxis, yAxis };
   }

  // --- Primary Series Creation (Uses CategoryAxis - unchanged) ---
  function createPrimarySeries(chart, root, primaryData, xAxis, yAxis) { /* ... unchanged ... */
    console.log("Creating primary series..."); var areaSeries = chart.series.push(am5xy.LineSeries.new(root, { name: "Selected Week", xAxis: xAxis, yAxis: yAxis, valueYField: "value", categoryXField: "time", fillOpacity: 0.5, connect: false, tooltip: am5.Tooltip.new(root, { labelText: "{valueY.formatNumber('#.00')} @ {categoryX}" }) })); areaSeries.strokes.template.set("strokeWidth", 2); areaSeries.fills.template.setAll({ visible: true, fill: areaSeries.get("stroke") }); areaSeries.bullets.push(function() { return am5.Bullet.new(root, { sprite: am5.Circle.new(root, { radius: 3, fill: areaSeries.get("stroke") }) }); }); areaSeries.data.setAll(primaryData); areaSeries.appear(1000); var columnSeries = chart.series.push(am5xy.ColumnSeries.new(root, { name: "Selected Week (Interval)", xAxis: xAxis, yAxis: yAxis, valueYField: "value", categoryXField: "time", connect: false, tooltip: am5.Tooltip.new(root, { labelText: "Interval: {valueY.formatNumber('#.00')} @ {categoryX}" }) })); columnSeries.columns.template.adapters.add("fill", function(fill, target) { return (target.dataItem && target.dataItem.get("valueY") < 0) ? am5.color(0x8B0000) : fill; }); columnSeries.columns.template.adapters.add("stroke", function(stroke, target) { return (target.dataItem && target.dataItem.get("valueY") < 0) ? am5.color(0x8B0000) : stroke; }); columnSeries.columns.template.setAll({ strokeWidth: 1, width: am5.percent(60) }); columnSeries.data.setAll(primaryData); columnSeries.hide(0); columnSeries.appear(1000); console.log("Primary series created."); return [areaSeries, columnSeries];
   }

  // --- Overlay Series Creation (Uses CategoryAxis - unchanged) ---
  function createOverlaySeries(chart, root, overlayData, colors, xAxis, yAxis) { /* ... unchanged ... */
    let overlaySeriesList = []; if (!overlayData) { console.log("No valid overlay data provided."); return overlaySeriesList; } console.log("Creating overlay series..."); try { for (const weekKey in overlayData) { if (Object.hasOwnProperty.call(overlayData, weekKey)) { const weekData = overlayData[weekKey]; console.log("Creating LineSeries for: " + weekKey); var lineSeries = chart.series.push(am5xy.LineSeries.new(root, { name: weekKey, xAxis: xAxis, yAxis: yAxis, valueYField: "value", categoryXField: "time", stroke: am5.color(colors[weekKey] || root.interfaceColors.get("grid")), connect: false, tooltip: am5.Tooltip.new(root, { labelText: "{name}: {valueY.formatNumber('#.00')} @ {categoryX}" }) })); lineSeries.strokes.template.set("strokeWidth", 2); lineSeries.data.setAll(weekData); lineSeries.appear(1000); overlaySeriesList.push(lineSeries); } } } catch (e) { console.error("Error creating overlay series:", e); } console.log("Overlay series creation finished:", overlaySeriesList.length); return overlaySeriesList;
   }

  // --- Legend Creation (Unchanged) ---
  function createLegend(chart, root, seriesList) { /* ... unchanged ... */
     if (!seriesList || seriesList.length <= 2) { console.log("Skipping legend."); return null; } console.log("Creating legend..."); var legend = chart.children.push(am5.Legend.new(root, { x: am5.percent(50), centerX: am5.percent(50), layout: root.horizontalLayout, marginTop: 15, marginBottom: 15 })); legend.itemContainers.template.set("toggleOnClick", true); legend.data.setAll(seriesList); console.log("Legend created."); return legend;
   }

  // --- Final Chart Configuration (Unchanged) ---
  function configureChart(chart, root, yAxis, xAxis, label) { /* ... unchanged ... */
     console.log("Configuring final chart elements..."); var cursor = chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "none" })); cursor.lineY.set("visible", false); yAxis.children.unshift(am5.Label.new(root, { rotation: -90, text: "Average " + label + " Points", y: am5.p50, centerX: am5.p50, paddingRight: 10 })); xAxis.children.push(am5.Label.new(root, { text: "Time of Day", x: am5.p50, centerX: am5.percent(50), paddingTop: 10 })); chart.set("scrollbarX", am5.Scrollbar.new(root, { orientation: "horizontal", marginBottom: 5 })); chart.appear(1000, 100); console.log("Chart configured.");
   }


  // --- Main Execution Flow (Unchanged) ---
  console.log("--- Starting Chart Build Process ---");
  const { primaryData, parsedOverlayData, hasValidOverlay } = parseChartData(primaryDataString, overlayString);
  const xAxisData = prepareAxisCategories(primaryData);
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
