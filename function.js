window.function = function (data, overlayDataJson, intervalName, width, height, type) {

  // --- Input Handling & Cleaning ---
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
    // Cleaning steps (no changes here)
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
     }
     else {
        // Test parse before assigning
        JSON.parse(tempString);
        cleanedDataString = tempString;
        console.log("DEBUG: Cleaned primary data string appears valid JSON.");
     }
  } catch (cleaningError) {
      console.error("!!! Failed to clean/parse primary data string during input handling !!!", cleaningError);
      console.error("Problematic string:", dataStringValue); // Log the original problematic string
      cleanedDataString = '[]'; // Fallback to empty array on error
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
    .am5-tooltip {
      font-size: 0.85em;
      pointer-events: none; /* Prevents tooltip from blocking cursor interactions */
    }
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
  const intervalName = ${JSON.stringify(intervalNameValue)};
  const chartTypeLabel = ${JSON.stringify(chartTypeLabel)};
  const overlayColors = { "This Week": "#228B22", "Last Week": "#FFA500", "2 Weeks Ago": "#800080", "3 Weeks Ago": "#DC143C" };
  const primaryOutlineColor = "#09077b"; // Dark blue for line and tooltip bg
  const primaryFillColor = "#b6dbee"; // Light blue for area fill
  const positiveValue2Color = "#052f20"; // Dark green
  const negativeValue2Color = "#78080e"; // Dark red
  const tooltipFontSize = "0.8em";

  console.log("Chart Constants Set:");
  console.log("  primaryDataString (in script):", primaryDataString);
  console.log("  overlayString (in script):", overlayString);
  console.log("  intervalName:", intervalName);
  console.log("  chartTypeLabel:", chartTypeLabel);

  // --- Root Element and Theme ---
  var root = am5.Root.new("chartdiv");
  root.setThemes([am5themes_Animated.new(root)]);
  console.log("Root created.");

  // --- Data Parsing Function ---
  // *** REVERTED console calls to basic comma-separated arguments ***
  function parseChartData(primaryStr, overlayStr) {
     console.log("--- Starting parseChartData ---");
     let primaryData = [];
     let parsedOverlayData = null;
     let hasValidOverlay = false;

     // Parse Primary Data
     console.log("Attempting to parse primary data string:", primaryStr);
     try {
         let rawPrimary = JSON.parse(primaryStr);
         console.log("Successfully parsed primary JSON:", rawPrimary);
         if (Array.isArray(rawPrimary)) {
             console.log("Primary JSON is an array. Processing items...");
             primaryData = rawPrimary.map((item, index) => {
                 // Basic validation
                 if (!(item && typeof item === 'object' && item.hasOwnProperty('time') && typeof item.time === 'string' && item.hasOwnProperty('value') && typeof item.value === 'number')) {
                      // *** USE BASIC CONSOLE.LOG ***
                      console.log("Primary data item at index", index, "is invalid or missing required fields (time, value):", item);
                     return null;
                 }
                 // Ensure value2 is a number if present
                 if (item.hasOwnProperty('value2') && typeof item.value2 !== 'number') {
                      // *** USE BASIC CONSOLE.LOG ***
                      console.log("Primary data item at index", index, "has non-numeric value2, removing it:", item);
                     delete item.value2;
                 }
                 // Add baseline field for zero-based fill
                 item.valueOpen = 0;
                 return item;
             }).filter(item => item !== null); // Filter out invalid items
             console.log("Primary data processed, filtered, and valueOpen added. Resulting array length:", primaryData.length);
             // console.log("Final processed primary data:", JSON.stringify(primaryData)); // Optional: Log full data (can be large)
         } else {
             console.log("WARNING: Parsed primary data is not an array. primaryData will be empty."); // Changed warn to log
         }
     } catch (e) {
         console.error("Error parsing primary data JSON inside parseChartData:", e);
         console.error("Problematic primary string:", primaryStr);
         primaryData = []; // Ensure it's an empty array on error
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
                          console.log("Processing overlay key:", key); // Simplified log
                         const weekDataRaw = rawOverlay[key];
                         if(Array.isArray(weekDataRaw)) {
                             console.log("Data for key", key, "is an array. Filtering items..."); // Simplified log
                             const processedWeekData = weekDataRaw.filter(item => {
                                const isValid = item && typeof item === 'object' && item.hasOwnProperty('time') && typeof item.time === 'string' && item.hasOwnProperty('value') && typeof item.value === 'number';
                                if (!isValid) {
                                    // *** USE BASIC CONSOLE.LOG ***
                                    console.log("Invalid item found in overlay data for key", key, ":", item);
                                }
                                return isValid;
                             });
                             if (processedWeekData.length > 0) {
                                 parsedOverlayData[key] = processedWeekData;
                                 validKeys++;
                                 console.log("Key", key, "has", processedWeekData.length, "valid items after filtering."); // Simplified log
                             } else {
                                 // *** USE BASIC CONSOLE.LOG ***
                                 console.log("Overlay data for key", key, "had no valid items after filtering.");
                             }
                         } else {
                              // *** USE BASIC CONSOLE.LOG ***
                             console.log("Overlay data for key", key, "was not an array. Skipping.");
                         }
                     }
                 }
                 if (validKeys > 0) {
                     hasValidOverlay = true;
                     console.log("Overlay data parsed successfully. Valid keys with data:", validKeys);
                     // console.log("Final processed overlay data:", JSON.stringify(parsedOverlayData)); // Optional: Log full data
                 } else {
                     console.log("WARNING: Overlay data parsed, but no valid keys/data found after processing."); // Changed warn to log
                     parsedOverlayData = null; // Ensure null if no valid data
                 }
             } else {
                 console.log("WARNING: Parsed overlay data is not a valid object (expected non-array object). parsedOverlayData will be null."); // Changed warn to log
             }
         } else {
             console.log("No overlay data string provided or it's empty/'{}'. No overlay data to process.");
         }
     } catch (e) {
         console.error("Error parsing overlay JSON inside parseChartData:", e);
         console.error("Problematic overlay string:", overlayStr);
         parsedOverlayData = null; // Ensure null on error
     }

     console.log("--- Finished parseChartData ---");
     return { primaryData, parsedOverlayData, hasValidOverlay };
   }


  // --- Axis Category Preparation ---
  function prepareAxisCategories(primaryData) {
     console.log("--- Starting prepareAxisCategories ---");
     if (!primaryData || primaryData.length === 0) {
        console.log("WARNING: Primary data is empty for axis prep, axis will be empty."); // Changed warn to log
        return [];
      }
      try {
          console.log("Preparing axis categories from primary data (assuming sorted).");
          let categoryStrings = primaryData.map(item => item.time);
          let uniqueCategoryStrings = categoryStrings.filter((value, index, self) => self.indexOf(value) === index);
          let xAxisData = uniqueCategoryStrings.map(timeStr => ({ time: timeStr }));
          console.log("Axis categories prepared. Count:", xAxisData.length);
          // console.log("Axis categories:", JSON.stringify(xAxisData)); // Optional: Log axis data
          console.log("--- Finished prepareAxisCategories ---");
          return xAxisData;
      } catch (e) {
          console.error("Error preparing axis categories:", e);
          console.log("--- Finished prepareAxisCategories (with error) ---");
          return []; // Return empty on error
      }
   }

  // --- Chart and Axes Creation ---
  function createChartAndAxes(root, xAxisData) {
    console.log("--- Starting createChartAndAxes ---");
    console.log("Creating chart and axes (using CategoryAxis)...");
    var chart = root.container.children.push(am5xy.XYChart.new(root, { panX: true, panY: true, wheelX: "panX", wheelY: "zoomX", layout: root.verticalLayout, pinchZoomX: true }));
    var xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 70 });
    xRenderer.labels.template.setAll({ fontSize: 8, rotation: -90, centerY: am5.p50, centerX: am5.p100, paddingRight: 5 });
    var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, { categoryField: "time", renderer: xRenderer, tooltip: am5.Tooltip.new(root, {}) }));
    if (xAxisData && xAxisData.length > 0) {
        xAxis.data.setAll(xAxisData);
        console.log("Set", xAxisData.length, "categories on X-Axis.");
    } else {
        console.log("WARNING: X-Axis has no data categories to set."); // Changed warn to log
    }
    var yRenderer = am5xy.AxisRendererY.new(root, {});
    var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { maxPrecision: 2, renderer: yRenderer }));
    console.log("Chart and axes created.");
    console.log("--- Finished createChartAndAxes ---");
    return { chart, xAxis, yAxis };
   }


  // --- Primary Series Creation ---
  function createPrimarySeries(chart, root, primaryData, xAxis, yAxis) {
    console.log("--- Starting createPrimarySeries ---");
    console.log("Creating primary series (Value Area, Value2 Bars)...");

    let valueAreaSeries, value2Series;

    // 1. Value Area Series
    console.log("Creating Value Area series (Line + Fill)...");
    valueAreaSeries = chart.series.push(am5xy.LineSeries.new(root, {
      name: intervalName,
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "value",
      categoryXField: "time",
      openValueYField: "valueOpen", // Fill baseline
      stroke: am5.color(primaryOutlineColor),
      fill: am5.color(primaryFillColor),
      fillOpacity: 0.8,
      connect: false,
      toggleable: true,
      tooltip: am5.Tooltip.new(root, {
          pointerOrientation: "horizontal",
          getFillFromSprite: false,
          getStrokeFromSprite: true,
          labelTextColor: am5.color(0xffffff),
          background: am5.RoundedRectangle.new(root, {
              fill: am5.color(primaryOutlineColor),
              fillOpacity: 0.9
          }),
          fontSize: tooltipFontSize,
          labelText: intervalName + ": {valueY.formatNumber('#.00')}"
      })
    }));
    valueAreaSeries.strokes.template.set("strokeWidth", 2);
    console.log("Setting data for Value Area series. Item count:", primaryData.length);
    valueAreaSeries.data.setAll(primaryData);
    valueAreaSeries.appear(1000);
    console.log("Value Area series created.");

    // 2. Value2 Bar Series
    console.log("Creating Value2 Bar series (Columns)...");
    value2Series = chart.series.push(am5xy.ColumnSeries.new(root, {
      name: intervalName + " (Cumulative)",
      xAxis: xAxis, yAxis: yAxis, valueYField: "value2", categoryXField: "time",
      toggleable: true,
      tooltip: am5.Tooltip.new(root, {
          getFillFromSprite: true,
          labelTextColor: am5.color(0xffffff),
          fontSize: tooltipFontSize,
          labelText: intervalName + " (Cumulative): {valueY.formatNumber('#.##')}"
      })
    }));
    // Adapters for color
    value2Series.columns.template.adapters.add("fill", function(fill, target) {
      const v2 = target.dataItem?.get("valueY");
      return typeof v2 === 'number' ? (v2 < 0 ? am5.color(negativeValue2Color) : am5.color(positiveValue2Color)) : am5.color(0xffffff, 0);
    });
    value2Series.columns.template.adapters.add("stroke", function(stroke, target) {
       const v2 = target.dataItem?.get("valueY");
       return typeof v2 === 'number' ? (v2 < 0 ? am5.color(negativeValue2Color) : am5.color(positiveValue2Color)) : am5.color(0xffffff, 0);
    });
    value2Series.columns.template.setAll({
        strokeWidth: 1,
        strokeOpacity: 1,
        width: am5.percent(60)
    });
     console.log("Setting data for Value2 Bar series. Item count:", primaryData.length);
    value2Series.data.setAll(primaryData);
    value2Series.appear(1000);
    console.log("Value2 Bar series created.");

    console.log("--- Finished createPrimarySeries ---");
    return { valueArea: valueAreaSeries, bars: value2Series };
  }


  // --- Overlay Series Creation ---
  function createOverlaySeries(chart, root, overlayData, colors, xAxis, yAxis) {
     console.log("--- Starting createOverlaySeries ---");
     let overlaySeriesList = [];
     if (!overlayData) {
         console.log("No valid overlay data provided to createOverlaySeries.");
         console.log("--- Finished createOverlaySeries (no data) ---");
         return overlaySeriesList;
     }
     console.log("Creating overlay series...");
     try {
       for (const weekKey in overlayData) {
         if (Object.hasOwnProperty.call(overlayData, weekKey)) {
           const weekData = overlayData[weekKey];
           console.log("Creating LineSeries for overlay key:", weekKey, "with", weekData.length, "items."); // Simplified log
           var lineSeries = chart.series.push(am5xy.LineSeries.new(root, {
               name: weekKey,
               xAxis: xAxis,
               yAxis: yAxis,
               valueYField: "value",
               categoryXField: "time",
               stroke: am5.color(colors[weekKey] || root.interfaceColors.get("grid")),
               connect: false,
               tooltip: am5.Tooltip.new(root, {
                 pointerOrientation: "horizontal",
                 getStrokeFromSprite: true,
                 labelTextColor: am5.color(0xffffff),
                 fontSize: tooltipFontSize,
                 labelText: "{name}: {valueY.formatNumber('#.00')}"
               })
           }));
           lineSeries.strokes.template.set("strokeWidth", 2);
           lineSeries.data.setAll(weekData);
           lineSeries.appear(1000);
           overlaySeriesList.push(lineSeries);
         }
       }
     } catch (e) {
       console.error("Error creating overlay series:", e);
     }
     console.log("Overlay series creation finished. Series count:", overlaySeriesList.length);
     console.log("--- Finished createOverlaySeries ---");
     return overlaySeriesList;
   }

  // --- Legend Creation ---
  function createLegend(chart, root, valueAreaSeries, barsSeries, otherSeries) {
     console.log("--- Starting createLegend ---");
     const legendSeries = [valueAreaSeries, barsSeries, ...otherSeries];

     if (legendSeries.length === 0) {
         console.log("Skipping legend (no series defined).");
         console.log("--- Finished createLegend (no series) ---");
         return null;
      }

     console.log("Creating legend for", legendSeries.length, "toggleable series...");
     var legendContainer = chart.children.push(am5.Container.new(root, {
        width: am5.percent(100),
        layout: root.verticalLayout,
        x: am5.p50, centerX: am5.p50,
        paddingBottom: 10
     }));
     var legend = legendContainer.children.push(am5.Legend.new(root, {
         x: am5.percent(50), centerX: am5.percent(50),
         layout: root.horizontalLayout,
         marginTop: 5,
         marginBottom: 5
     }));
     legendContainer.children.push(am5.Label.new(root, {
         text: "(Click legend items to toggle visibility)",
         fontSize: "0.75em",
         fill: am5.color(0x888888),
         x: am5.p50, centerX: am5.p50
     }));

     console.log("Setting data for legend...");
     legend.data.setAll(legendSeries);
     console.log("Legend created.");
     console.log("--- Finished createLegend ---");
     return legend;
   }

  // --- Final Chart Configuration ---
  function configureChart(chart, root, yAxis, xAxis, label) {
    console.log("--- Starting configureChart ---");
    console.log("Configuring final chart elements (cursor, titles, scrollbar)...");

    var cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
        behavior: "zoomX", // Changed behavior slightly for potentially better UX
        xAxis: xAxis
    }));
    cursor.lineY.set("visible", false); // Keep vertical line hidden

    // Y Axis Title
    yAxis.children.unshift(am5.Label.new(root, {
        rotation: -90,
        text: "Average " + label + " Points",
        y: am5.p50,
        centerX: am5.p50,
        paddingRight: 10
    }));

    // X Axis Title
    xAxis.children.push(am5.Label.new(root, {
        text: "Time of Day",
        x: am5.p50,
        centerX: am5.p50,
        paddingTop: 10
    }));

    // Scrollbar X
    chart.set("scrollbarX", am5.Scrollbar.new(root, {
        orientation: "horizontal",
        marginBottom: 25
    }));

    // Appearance Animation
    chart.appear(1000, 100);
    console.log("Chart configured.");
    console.log("--- Finished configureChart ---");
   }


  // --- Main Execution Flow ---
  console.log("--- Starting Chart Build Process ---");

  // Parse data (includes adding valueOpen=0 to primaryData)
  const { primaryData, parsedOverlayData, hasValidOverlay } = parseChartData(primaryDataString, overlayString);

  // Check if primary data exists before proceeding
  if (!primaryData || primaryData.length === 0) {
    console.log("WARNING: No valid primary data to display after parsing. Chart generation stopped."); // Changed warn to log
    // Display a message in the chart div
    try {
        document.getElementById('chartdiv').innerHTML = '<p style="text-align: center; padding: 20px; color: grey;">No valid primary data available to display the chart.</p>';
    } catch(e) {
        console.error("Could not find #chartdiv to display error message.");
    }
    return; // Exit early if no primary data
  }

  // Prepare Axis Categories
  const xAxisData = prepareAxisCategories(primaryData);

  // Create Chart and Axes
  const { chart, xAxis, yAxis } = createChartAndAxes(root, xAxisData);

  // Create Primary Series (uses openValueYField="valueOpen")
  const primarySeriesRefs = createPrimarySeries(chart, root, primaryData, xAxis, yAxis);

  // Create Overlay Series
  const overlaySeries = createOverlaySeries(chart, root, parsedOverlayData, overlayColors, xAxis, yAxis);

  // Create Legend
  createLegend(chart, root, primarySeriesRefs.valueArea, primarySeriesRefs.bars, overlaySeries);

  // Configure Final Elements (Cursor, Titles, Scrollbar)
  configureChart(chart, root, yAxis, xAxis, chartTypeLabel);

  console.log("--- Chart Build Process Complete ---");

}); // end am5.ready()
</script>

</body>
</html>`;

  // --- Encode and Return URI ---
  console.log("Encoding HTML and returning data URI...");
  const encodedHtml = encodeURIComponent(ht);
  const dataUri = `data:text/html;charset=utf-8,${encodedHtml}`;
  console.log("Data URI created.");
  return dataUri;
}
