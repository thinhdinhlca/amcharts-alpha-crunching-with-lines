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
  // console.log("Primary Data String:", primaryDataString); // Optional: Log full data strings
  // console.log("Overlay String:", overlayString);

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
              // console.log("Parsed Overlay Data:", parsedOverlayData); // Optional: Log parsed object
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
      try { // Add try-catch around this loop too
          const overlayKeysForAxis = Object.keys(parsedOverlayData);
          console.log("Axis Loop: Found keys:", overlayKeysForAxis);
          for (const key of overlayKeysForAxis) { // Use 'key' to avoid potential naming conflict
              console.log("Axis Loop: Processing key:", key);
              let weekData = parsedOverlayData[key];
              if (weekData && Array.isArray(weekData) && weekData.length > 0) {
                   let validItems = weekData.filter(item => item && typeof item === 'object' && item.hasOwnProperty('time'));
                   if (validItems.length > 0) {
                       allDataForAxis.push(...validItems);
                       hasValidOverlayData = true; // Set flag here, indicates we *should* have overlays later
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
  var xRenderer = am5xy.AxisRendererX.new(root, { /* ... */ });
  var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, { /* ... */ }));
  if (xAxisData.length > 0) { xAxis.data.setAll(xAxisData); }
  else { console.warn("No valid category data found for X-Axis."); }
  console.log("X Axis configured.");

  // --- Y Axis ---
  var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { /* ... */ }));
  console.log("Y Axis configured.");

  // --- Area Series ---
  var areaSeries = chart.series.push(am5xy.LineSeries.new(root, { /* ... */ }));
  // ... area series config ...
  areaSeries.data.setAll(primaryData);
  areaSeries.appear(1000);
  console.log("Area series configured.");

  // --- Column Series ---
  var columnSeries = chart.series.push(am5xy.ColumnSeries.new(root, { /* ... */ }));
  // ... column series config ...
  columnSeries.data.setAll(primaryData);
  columnSeries.appear(1000);
  columnSeries.hide(0);
  console.log("Column series configured.");

  // --- Overlay Line Series ---
  const overlayColors = { "This Week": "#228B22", "Last Week": "#FFA500", "2 Weeks Ago": "#800080", "3 Weeks Ago": "#DC143C" };
  let legendData = [areaSeries, columnSeries];
  console.log("--- Starting Overlay Series Processing ---"); // Log 1
  console.log("Checking condition: hasValidOverlayData && parsedOverlayData && typeof parsedOverlayData === 'object'"); // Log 2
  console.log("Values:", hasValidOverlayData, !!parsedOverlayData, typeof parsedOverlayData); // Log 3

  // *** USE THE FLAG 'hasValidOverlayData' set during axis prep ***
  if (hasValidOverlayData && parsedOverlayData && typeof parsedOverlayData === 'object') {
      console.log("Condition met, entering overlay series creation block."); // Log 4
      try { // Wrap the entire series creation loop block
          const overlayKeys = Object.keys(parsedOverlayData);
          console.log("Series Loop: Found keys:", overlayKeys); // Log 5

          for (const weekKey of overlayKeys) { // weekKey defined for this block
              // *** LOG IMMEDIATELY INSIDE LOOP ***
              console.log("Series Loop: Processing weekKey:", weekKey); // Log 6

              let weekData = parsedOverlayData[weekKey];
              // Log 7 (Optional but helpful):
              // console.log("Series Loop: Data for key:", weekKey, weekData ? \`(${weekData.length} items)\` : 'null/undefined');

              console.log("Series Loop: Validating data for key:", weekKey); // Log 8
              if (weekData && Array.isArray(weekData) && weekData.length > 0 && weekData.every(item => item && typeof item === 'object' && item.hasOwnProperty('time') && item.hasOwnProperty('value'))) {
                   console.log("Series Loop: Data VALID for key:", weekKey, ". Creating series..."); // Log 9
                   var lineSeries = chart.series.push(am5xy.LineSeries.new(root, {
                      // Using weekKey here should be safe if Log 6 executed without error for this key
                      name: weekKey,
                      xAxis: xAxis, yAxis: yAxis,
                      valueYField: "value", categoryXField: "time",
                      stroke: am5.color(overlayColors[weekKey] || root.interfaceColors.get("grid")),
                      tooltip: am5.Tooltip.new(root, { labelText: \`{name}: {valueY.formatNumber('#.00')}\` }),
                      connect: false
                   }));
                   console.log("Series Loop: Series object created for key:", weekKey); // Log 10
                   lineSeries.data.setAll(weekData);
                   console.log("Series Loop: Data set for key:", weekKey); // Log 11
                   lineSeries.appear(1000);
                   legendData.push(lineSeries);
                   console.log("Series Loop: Series configured and added to legend for key:", weekKey); // Log 12
              } else {
                   // Using weekKey here should be safe if Log 6 executed without error for this key
                   console.warn(\`Series Loop: Skipping overlay series "${weekKey}" due to invalid data format or missing properties.\`); // Log 13
              }
              console.log("Series Loop: Finished iteration for key:", weekKey); // Log 14
          } // End of for...of block
          console.log("Series Loop: Finished processing all overlay keys."); // Log 15
      } catch (seriesLoopError) {
          // Log any unexpected error during the loop itself
          console.error("!!!! ERROR INSIDE OVERLAY SERIES CREATION LOOP !!!!", seriesLoopError); // Log 16
      }
  } else {
      console.log("Condition NOT met, skipping overlay series creation block."); // Log 17
  }
  console.log("--- Finished Overlay Series Processing ---"); // Log 18

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
  xAxis.children.push( am5.Label.new(root, { /* ... */ }) );
  yAxis.children.unshift( am5.Label.new(root, { /* ... */ }) );
  console.log("Axis labels added.");

  // --- Scrollbar ---
  chart.set("scrollbarX", am5.Scrollbar.new(root, { /* ... */ }));
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
