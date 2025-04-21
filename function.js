window.function = function (data, overlayDataJson, width, height, type) {

  // Safely get input values or defaults
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

  console.log("am5.ready executed."); // Initial log

  // --- Root and Theme ---
  var root = am5.Root.new("chartdiv");
  root.setThemes([
    am5themes_Animated.new(root)
  ]);

  // *** Define colorSet ***
  var colorSet = am5.ColorSet.new(root, {});
  console.log("colorSet defined.");

  // --- Data Parsing ---
  const primaryDataString = ${JSON.stringify(dataStringValue)};
  const overlayString = ${JSON.stringify(overlayDataJsonStringValue)};
  console.log("Data strings embedded.");

  var primaryData = [];
  try {
    primaryData = JSON.parse(primaryDataString);
    if (!Array.isArray(primaryData)) {
        console.error("Primary data is not an array:", primaryData);
        primaryData = [];
    }
    console.log("Primary data parsed successfully.", primaryData.length, "items");
  } catch(e) {
    console.error("Error parsing primary data JSON:", e, "\\nData String:", primaryDataString);
  }

  var parsedOverlayData = null;
  try {
      if (overlayString && overlayString.trim() !== "" && overlayString.trim() !== "{}") {
          parsedOverlayData = JSON.parse(overlayString);
          if (typeof parsedOverlayData !== 'object' || parsedOverlayData === null || Array.isArray(parsedOverlayData)) {
              console.error("Parsed overlay data is not a valid object:", parsedOverlayData);
              parsedOverlayData = null;
          } else {
              console.log("Overlay data parsed successfully.");
          }
      } else {
          console.log("Overlay string is empty or '{}'. No overlay data to parse.");
      }
  } catch (e) {
      console.error("Error parsing overlay JSON:", e, "\\nOverlay String:", overlayString);
      parsedOverlayData = null;
  }

  // --- Chart Setup ---
  var chart = root.container.children.push(am5xy.XYChart.new(root, { /* ... config ... */ }));
  console.log("Chart initialized.");

  // --- Cursor ---
  var cursor = chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "none" }));
  cursor.lineY.set("visible", false);
  console.log("Cursor set.");

  // --- Prepare Combined Data for Category Axis ---
  let allDataForAxis = [...primaryData];
  let hasValidOverlayData = false;
  console.log("Starting axis data preparation.");

  if (parsedOverlayData && typeof parsedOverlayData === 'object') {
      console.log("Processing parsed overlay data for axis categories.");
      try {
          const overlayKeysForAxis = Object.keys(parsedOverlayData);
          console.log("Axis Loop: Found keys:", overlayKeysForAxis);
          for (const key of overlayKeysForAxis) { // Defines 'key' for THIS loop
              console.log("Axis Loop: Processing key:", key);
              let weekData = parsedOverlayData[key];
              if (weekData && Array.isArray(weekData) && weekData.length > 0) {
                   let validItems = weekData.filter(item => item && typeof item === 'object' && item.hasOwnProperty('time'));
                   if (validItems.length > 0) {
                       allDataForAxis.push(...validItems);
                       hasValidOverlayData = true;
                       console.log("Axis Loop: Added", validItems.length, "valid items for key:", key);
                   } else {
                        console.warn(\`Axis Loop: Overlay data for key "${key}" has items but none have a 'time' property.\`);
                   }
              }
          }
          console.log("Axis Loop: Finished processing keys.");
      } catch (axisLoopError) {
           console.error("!!!! ERROR DURING AXIS DATA PREPARATION LOOP !!!!", axisLoopError);
      }
  } else {
      console.log("No valid parsed overlay data object to process for axis categories.");
  }
  console.log("Axis data preparation complete. Total items for axis:", allDataForAxis.length, "Has valid overlay data flag:", hasValidOverlayData);


  // Extract unique time categories
  let uniqueTimes = [...new Set(allDataForAxis.map(item => item ? item.time : null).filter(time => time !== undefined && time !== null && time !== ''))];
  let xAxisData = uniqueTimes.map(time => ({ time: time }));
  console.log("Unique time categories extracted:", uniqueTimes.length);

  // --- X Axis ---
  var xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 70, /* ... */ });
  var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, { categoryField: "time", renderer: xRenderer, /* ... */ }));
  if (xAxisData.length > 0) { xAxis.data.setAll(xAxisData); }
  else { console.warn("No valid category data found for X-Axis."); }
  console.log("X Axis configured.");

  // --- Y Axis ---
  var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { maxPrecision: 2, /* ... */ }));
  console.log("Y Axis configured.");

  // --- Area Series ---
  var areaSeries = chart.series.push(am5xy.LineSeries.new(root, { name: "Selected Week", /* ... */ }));
  areaSeries.data.setAll(primaryData);
  areaSeries.appear(1000);
  console.log("Area series configured.");

  // --- Column Series ---
  var columnSeries = chart.series.push(am5xy.ColumnSeries.new(root, { name: "Selected Week (Interval)", /* ... */ }));
  columnSeries.data.setAll(primaryData);
  columnSeries.appear(1000);
  columnSeries.hide(0);
  console.log("Column series configured.");

  // --- Overlay Line Series ---
  const overlayColors = { "This Week": "#228B22", "Last Week": "#FFA500", "2 Weeks Ago": "#800080", "3 Weeks Ago": "#DC143C" };
  let legendData = [areaSeries, columnSeries];
  console.log("--- Starting Overlay Series Processing ---");

  if (hasValidOverlayData && parsedOverlayData && typeof parsedOverlayData === 'object') {
      console.log("Condition met, entering overlay series creation block.");
      try {
          const overlayKeys = Object.keys(parsedOverlayData);
          console.log("Series Loop: Found keys:", overlayKeys);

          for (const weekKey of overlayKeys) { // Defines 'weekKey' for THIS loop
              console.log("Series Loop: Processing weekKey:", weekKey); // CORRECTED: Use weekKey

              let weekData = parsedOverlayData[weekKey];

              console.log("Series Loop: Validating data for weekKey:", weekKey); // CORRECTED: Use weekKey
              if (weekData && Array.isArray(weekData) && weekData.length > 0 && weekData.every(item => item && typeof item === 'object' && item.hasOwnProperty('time') && item.hasOwnProperty('value'))) {
                   console.log("Series Loop: Data VALID for weekKey:", weekKey, ". Creating series..."); // CORRECTED: Use weekKey
                   var lineSeries = chart.series.push(am5xy.LineSeries.new(root, {
                      name: weekKey,
                      xAxis: xAxis, yAxis: yAxis,
                      valueYField: "value", categoryXField: "time",
                      stroke: am5.color(overlayColors[weekKey] || root.interfaceColors.get("grid")),
                      tooltip: am5.Tooltip.new(root, { labelText: \`{name}: {valueY.formatNumber('#.00')}\` }),
                      connect: false
                   }));
                   console.log("Series Loop: Series object created for weekKey:", weekKey); // CORRECTED: Use weekKey
                   lineSeries.data.setAll(weekData);
                   console.log("Series Loop: Data set for weekKey:", weekKey); // CORRECTED: Use weekKey
                   lineSeries.appear(1000);
                   legendData.push(lineSeries);
                   console.log("Series Loop: Series configured and added to legend for weekKey:", weekKey); // CORRECTED: Use weekKey
              } else {
                   console.warn(\`Series Loop: Skipping overlay series "${weekKey}" due to invalid data format or missing properties.\`); // CORRECTED: Use weekKey
              }
              console.log("Series Loop: Finished iteration for weekKey:", weekKey); // CORRECTED: Use weekKey
          } // End of for...of block
          console.log("Series Loop: Finished processing all overlay keys.");
      } catch (seriesLoopError) {
          console.error("!!!! ERROR INSIDE OVERLAY SERIES CREATION LOOP !!!!", seriesLoopError);
      }
  } else {
      console.log("Condition NOT met, skipping overlay series creation block.");
  }
  console.log("--- Finished Overlay Series Processing ---");

 // --- Legend (Conditional) ---
  console.log("Checking legend condition. Legend data length:", legendData.length);
  if (legendData.length > 2) {
       var legend = chart.set("legend", am5.Legend.new(root, { /* ... */ }));
       legend.itemContainers.template.set("toggleOnClick", true);
       legend.data.setAll(legendData);
       console.log("Legend created and populated.");
  } else {
       console.log("Legend not created (less than 3 series).");
  }

  // --- Axis Labels ---
  xAxis.children.push( am5.Label.new(root, { text: "Time of Day", /* ... */ }) );
  yAxis.children.unshift( am5.Label.new(root, { rotation: -90, text: \`Average \${chartTypeLabel} Points\`, /* ... */ }) );
  console.log("Axis labels added.");

  // --- Scrollbar ---
  chart.set("scrollbarX", am5.Scrollbar.new(root, { orientation: "horizontal", /* ... */ }));
  console.log("Scrollbar set.");

  // --- Final Appear Animation ---
  chart.appear(1000, 100);
  console.log("Final chart appear initiated.");


}); // end am5.ready()
</script>

  </body>
</html>`;

  // --- Encode and Return URI ---
  let enc = encodeURIComponent(ht);
  let uri = `data:text/html;charset=utf-8,${enc}`;
  return uri;
}
