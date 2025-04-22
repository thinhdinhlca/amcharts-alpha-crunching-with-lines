window.function = function (data, overlayDataJson, intervalName, width, height, type) {

  // --- Input Handling & Cleaning --- (No Changes)
  let dataStringValue = data.value ?? '[]';
  let overlayDataJsonStringValue = overlayDataJson.value ?? '{}';
  let intervalNameValue = intervalName.value ?? "Period";
  let chartWidth = width.value ?? 100;
  let chartHeight = height.value ?? 550;
  let chartTypeLabel = type.value ?? "Value";
  let cleanedDataString = '[]';
  try {
    console.log("--- Glide Input ---");
    console.log("Raw primary data input:", dataStringValue);
    console.log("Raw overlay data input:", overlayDataJsonStringValue);
    let tempString = dataStringValue.trim();
    tempString = tempString.replace(/strokeSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    tempString = tempString.replace(/fillSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    tempString = tempString.replace(/bulletSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    tempString = tempString.replace(/,\s*(\})/g, '$1');
    tempString = tempString.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');
    if (tempString && !tempString.startsWith('[')) { tempString = '[' + tempString; }
    if (tempString && !tempString.endsWith(']')) { tempString = tempString + ']'; }
    if (!tempString || tempString === "[]" || tempString === "") {
        console.log("Input data string is empty or '[]', using default '[]'.");
        cleanedDataString = '[]';
    } else {
        JSON.parse(tempString); cleanedDataString = tempString;
        console.log("DEBUG: Cleaned primary data string appears valid JSON.");
    }
  } catch (cleaningError) {
      console.error("!!! Failed to clean/parse primary data string during input handling !!!", cleaningError);
      console.error("Problematic string:", dataStringValue);
      cleanedDataString = '[]';
  }
  console.log("DEBUG: Final string for primary data passed to chart:", cleanedDataString);
  console.log("DEBUG: Final string for overlay data passed to chart:", overlayDataJsonStringValue);
  console.log("--- End Glide Input ---");


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
    .am5-tooltip { font-size: 0.85em; pointer-events: none; }
  </style>
</head>
<body>
  <div id="chartdiv"></div>

<script>
am5.ready(function() {

  console.log("am5.ready() invoked.");

  // --- Configuration & Data --- (Using version with valueOpen)
  const primaryDataString = ${JSON.stringify(cleanedDataString)};
  const overlayString = ${JSON.stringify(overlayDataJsonStringValue)};
  const intervalName = ${JSON.stringify(intervalNameValue)};
  const chartTypeLabel = ${JSON.stringify(chartTypeLabel)};
  const overlayColors = { "This Week": "#228B22", "Last Week": "#FFA500", "2 Weeks Ago": "#800080", "3 Weeks Ago": "#DC143C" };
  const primaryOutlineColor = "#09077b";
  const primaryFillColor = "#b6dbee";
  const positiveValue2Color = "#052f20";
  const negativeValue2Color = "#78080e";
  const tooltipFontSize = "0.8em";
  const whiteColor = am5.color(0xffffff);

  console.log("Chart Constants Set:"); /*...*/

  // --- Root Element and Theme --- (No Changes)
  var root = am5.Root.new("chartdiv");
  root.setThemes([am5themes_Animated.new(root)]);
  console.log("Root created.");

  // --- Data Parsing Function --- (Restored filter logic)
  function parseChartData(primaryStr, overlayStr) {
     console.log("--- Starting parseChartData ---");
     let primaryData = [];
     let parsedOverlayData = null;
     let hasValidOverlay = false;

     // Parse Primary Data (Includes valueOpen)
     console.log("Attempting to parse primary data string:", primaryStr);
     try {
         let rawPrimary = JSON.parse(primaryStr);
         console.log("Successfully parsed primary JSON:", rawPrimary);
         if (Array.isArray(rawPrimary)) {
             console.log("Primary JSON is an array. Processing items...");
             primaryData = rawPrimary.map((item, index) => {
                 if (!(item && typeof item === 'object' && item.hasOwnProperty('time') && typeof item.time === 'string' && item.hasOwnProperty('value') && typeof item.value === 'number')) {
                      console.log("Primary data item at index", index, "is invalid or missing required fields (time, value):", item);
                     return null;
                 }
                 if (item.hasOwnProperty('value2') && typeof item.value2 !== 'number') {
                      console.log("Primary data item at index", index, "has non-numeric value2, removing it:", item);
                     delete item.value2;
                 }
                 item.valueOpen = 0; // valueOpen IS included
                 return item;
             }).filter(item => item !== null);
             console.log("Primary data processed, filtered, and valueOpen added. Resulting array length:", primaryData.length);
         } else {
             console.log("WARNING: Parsed primary data is not an array. primaryData will be empty.");
         }
     } catch (e) {
         console.error("Error parsing primary data JSON inside parseChartData:", e);
         console.error("Problematic primary string:", primaryStr);
         primaryData = [];
     }

     // Parse Overlay Data
     console.log("Attempting to parse overlay data string:", overlayStr);
     try {
         if (overlayStr && overlayStr.trim() !== "" && overlayStr.trim() !== "{}") {
             let rawOverlay = JSON.parse(overlayStr);
              console.log("Successfully parsed overlay JSON:", rawOverlay);
             if (typeof rawOverlay === 'object' && rawOverlay !== null && !Array.isArray(rawOverlay)) {
                  console.log("Overlay JSON is an object. Processing keys...");
                 parsedOverlayData = {};
                 let validKeys = 0;
                 for (const key in rawOverlay) {
                     if (Object.hasOwnProperty.call(rawOverlay, key)) {
                          console.log("Processing overlay key:", key);
                         const weekDataRaw = rawOverlay[key];
                         if(Array.isArray(weekDataRaw)) {
                             console.log("Data for key", key, "is an array. Filtering items...");
                             // *** CORRECTED LINE: Restored filter logic ***
                             const processedWeekData = weekDataRaw.filter(item => {
                                const isValid = item && typeof item === 'object' && item.hasOwnProperty('time') && typeof item.time === 'string' && item.hasOwnProperty('value') && typeof item.value === 'number';
                                if (!isValid) {
                                    console.log("Invalid item found in overlay data for key", key, ":", item);
                                }
                                return isValid;
                             });
                             // *** End of corrected filter ***
                             if (processedWeekData.length > 0) {
                                 parsedOverlayData[key] = processedWeekData;
                                 validKeys++;
                                 console.log("Key", key, "has", processedWeekData.length, "valid items after filtering.");
                             } else {
                                 console.log("Overlay data for key", key, "had no valid items after filtering.");
                             }
                         } else {
                             console.log("Overlay data for key", key, "was not an array. Skipping.");
                         }
                     }
                 }
                 if (validKeys > 0) {
                     hasValidOverlay = true;
                     console.log("Overlay data parsed successfully. Valid keys with data:", validKeys);
                 } else {
                     console.log("WARNING: Overlay data parsed, but no valid keys/data found after processing.");
                     parsedOverlayData = null;
                 }
             } else {
                 console.log("WARNING: Parsed overlay data is not a valid object (expected non-array object). parsedOverlayData will be null.");
             }
         } else {
             console.log("No overlay data string provided or it's empty/'{}'. No overlay data to process.");
         }
     } catch (e) {
         console.error("Error parsing overlay JSON inside parseChartData:", e);
         console.error("Problematic overlay string:", overlayStr);
         parsedOverlayData = null;
     }

     console.log("--- Finished parseChartData ---");
     return { primaryData, parsedOverlayData, hasValidOverlay };
   }


  // --- Axis Category Preparation --- (No Changes)
  function prepareAxisCategories(primaryData) {
    console.log("--- Starting prepareAxisCategories ---");
    if (!primaryData || primaryData.length === 0) { console.log("WARNING: Primary data is empty for axis prep."); return []; }
    try {
      console.log("Preparing axis categories...");
      let categoryStrings = primaryData.map(item => item.time);
      let uniqueCategoryStrings = categoryStrings.filter((value, index, self) => self.indexOf(value) === index);
      let xAxisData = uniqueCategoryStrings.map(timeStr => ({ time: timeStr }));
      console.log("Axis categories prepared. Count:", xAxisData.length);
      console.log("--- Finished prepareAxisCategories ---");
      return xAxisData;
    } catch (e) { console.error("Error preparing axis categories:", e); return []; }
  }


  // --- Chart and Axes Creation --- (Keeping forceZero: true)
  function createChartAndAxes(root, xAxisData) {
    console.log("--- Starting createChartAndAxes ---");
    var chart = root.container.children.push(am5xy.XYChart.new(root, { panX: true, panY: true, wheelX: "panX", wheelY: "zoomX", layout: root.verticalLayout, pinchZoomX: true }));
    var xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 70 });
    xRenderer.labels.template.setAll({ fontSize: 8, rotation: -90, centerY: am5.p50, centerX: am5.p100, paddingRight: 5 });
    var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, { categoryField: "time", renderer: xRenderer, tooltip: am5.Tooltip.new(root, {}) }));
    if (xAxisData && xAxisData.length > 0) {
        xAxis.data.setAll(xAxisData); console.log("Set categories on X-Axis.");
    } else { console.log("WARNING: X-Axis has no data categories."); }
    var yRenderer = am5xy.AxisRendererY.new(root, {});
    var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { maxPrecision: 2, renderer: yRenderer }));
    yAxis.set("forceZero", true);
    console.log("Y-Axis forceZero set to true.");
    console.log("--- Finished createChartAndAxes ---");
    return { chart, xAxis, yAxis };
   }


  // --- Primary Series Creation --- (Using reversed order and openValueYField)
  function createPrimarySeries(chart, root, primaryData, xAxis, yAxis) {
    console.log("--- Starting createPrimarySeries ---");
    let valueAreaSeries, value2Series;

    // 1. Add Value2 Bar Series FIRST
    console.log("Creating Value2 Bar series (Columns)...");
    value2Series = chart.series.push(am5xy.ColumnSeries.new(root, { /* ... */ }));
    // ... adapters and settings ...
    console.log("Setting data for Value2 Bar series. Item count:", primaryData.length);
    value2Series.data.setAll(primaryData);
    value2Series.appear(1000);
    console.log("Value2 Bar series created and added.");


    // 2. Add Value Area Series SECOND (Using openValueYField)
    console.log("Creating Value Area series (Line + Fill)...");
    valueAreaSeries = chart.series.push(am5xy.LineSeries.new(root, {
      name: intervalName,
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "value",
      categoryXField: "time",
      openValueYField: "valueOpen", // Using openValueYField approach again
      stroke: am5.color(primaryOutlineColor),
      fill: am5.color(primaryFillColor),
      fillOpacity: 0.8,
      connect: false,
      toggleable: true,
      tooltip: am5.Tooltip.new(root, { // Keeping tooltip fixes
          pointerOrientation: "horizontal", getFillFromSprite: false,
          getStrokeFromSprite: true, labelTextColor: whiteColor,
          background: am5.RoundedRectangle.new(root, { fill: am5.color(primaryOutlineColor), fillOpacity: 0.9 }),
          fontSize: tooltipFontSize, labelText: intervalName + ": {valueY.formatNumber('#.00')}"
      })
    }));
    valueAreaSeries.strokes.template.set("strokeWidth", 2);
    console.log("Setting data for Value Area series. Item count:", primaryData.length);
    valueAreaSeries.data.setAll(primaryData); // Data includes valueOpen
    valueAreaSeries.appear(1000);
    console.log("Value Area series created and added. Fill opacity:", valueAreaSeries.get("fillOpacity"), "Fill color:", valueAreaSeries.get("fill"));

    console.log("--- Finished createPrimarySeries ---");
    return { valueArea: valueAreaSeries, bars: value2Series };
  }


  // --- Overlay Series Creation --- (Keep tooltip fixes)
  function createOverlaySeries(chart, root, overlayData, colors, xAxis, yAxis) {
    console.log("--- Starting createOverlaySeries ---");
    let overlaySeriesList = [];
    if (!overlayData) { /*...*/ return overlaySeriesList; }
    console.log("Creating overlay series...");
    try {
      for (const weekKey in overlayData) {
        if (Object.hasOwnProperty.call(overlayData, weekKey)) {
          const weekData = overlayData[weekKey];
          const seriesColor = am5.color(colors[weekKey] || root.interfaceColors.get("grid"));
          console.log("Creating LineSeries for overlay key:", weekKey);
          var lineSeries = chart.series.push(am5xy.LineSeries.new(root, {
              name: weekKey, /*...*/ stroke: seriesColor, connect: false,
              tooltip: am5.Tooltip.new(root, { // Keep tooltip fixes
                pointerOrientation: "horizontal", getStrokeFromSprite: true,
                labelTextColor: whiteColor,
                background: am5.RoundedRectangle.new(root, { fill: seriesColor, fillOpacity: 0.9 }),
                fontSize: tooltipFontSize, labelText: "{name}: {valueY.formatNumber('#.00')}"
              })
          }));
          lineSeries.strokes.template.set("strokeWidth", 2);
          lineSeries.data.setAll(weekData);
          lineSeries.appear(1000);
          overlaySeriesList.push(lineSeries);
        }
      }
    } catch (e) { console.error("Error creating overlay series:", e); }
    console.log("Overlay series creation finished.");
    console.log("--- Finished createOverlaySeries ---");
    return overlaySeriesList;
  }

  // --- Legend Creation --- (No Changes)
  function createLegend(chart, root, valueAreaSeries, barsSeries, otherSeries) {
     /* ... */
     return legend;
  }

  // --- Final Chart Configuration --- (No Changes)
  function configureChart(chart, root, yAxis, xAxis, label) {
    /* ... */
   }


  // --- Main Execution Flow --- (No Changes)
  console.log("--- Starting Chart Build Process ---");
  const { primaryData, parsedOverlayData, hasValidOverlay } = parseChartData(primaryDataString, overlayString);
  if (!primaryData || primaryData.length === 0) { /*...*/ return; }
  const xAxisData = prepareAxisCategories(primaryData);
  const { chart, xAxis, yAxis } = createChartAndAxes(root, xAxisData);
  const primarySeriesRefs = createPrimarySeries(chart, root, primaryData, xAxis, yAxis);
  const overlaySeries = createOverlaySeries(chart, root, parsedOverlayData, overlayColors, xAxis, yAxis);
  createLegend(chart, root, primarySeriesRefs.valueArea, primarySeriesRefs.bars, overlaySeries);
  configureChart(chart, root, yAxis, xAxis, chartTypeLabel);
  console.log("--- Chart Build Process Complete ---");

}); // end am5.ready()
</script>

</body>
</html>`;

  // --- Encode and Return URI --- (No Changes)
  console.log("Encoding HTML and returning data URI...");
  const encodedHtml = encodeURIComponent(ht);
  const dataUri = `data:text/html;charset=utf-8,${encodedHtml}`;
  console.log("Data URI created.");
  return dataUri;
}
