window.function = function (data, overlayDataJson, width, height, type) {

  // --- Input Handling ---
  // Safely get input values or set robust defaults
  let dataStringValue = data.value ?? '[]';
  let overlayDataJsonStringValue = overlayDataJson.value ?? '{}';
  let chartWidth = width.value ?? 100; // Percentage
  let chartHeight = height.value ?? 500; // Pixels
  let chartTypeLabel = type.value ?? "Value"; // Default label if none provided

  // --- HTML Template ---
  // Using template literals for easier embedding of variables
  let ht = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Glide Yes-Code Chart</title>
  <!-- AmCharts 5 Core -->
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <!-- AmCharts 5 XY Chart Module -->
  <script src="https://cdn.amcharts.com/lib/5/xy.js"></script>
  <!-- AmCharts 5 Animated Theme -->
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
    }
    #chartdiv {
      width: ${chartWidth}%;
      height: ${chartHeight}px;
    }
  </style>
</head>
<body>
  <div id="chartdiv"></div>

<script>
// Wrap all AmCharts code in am5.ready()
am5.ready(function() {

  console.log("am5.ready() invoked.");

  // --- Configuration & Data ---
  const primaryDataString = ${JSON.stringify(dataStringValue)};
  const overlayString = ${JSON.stringify(overlayDataJsonStringValue)};
  const chartTypeLabel = ${JSON.stringify(chartTypeLabel)};
  const overlayColors = { // Define standard colors
    "This Week": "#228B22", // ForestGreen
    "Last Week": "#FFA500", // Orange
    "2 Weeks Ago": "#800080", // Purple
    "3 Weeks Ago": "#DC143C", // Crimson
    // Add more predictable keys/colors if needed
  };

  // --- Root Element and Theme ---
  var root = am5.Root.new("chartdiv");
  root.setThemes([am5themes_Animated.new(root)]);
  console.log("Root created and theme set.");

  // --- Data Parsing Function ---
  function parseChartData(primaryStr, overlayStr) {
    let primaryData = [];
    let parsedOverlayData = null;
    let hasValidOverlay = false;

    // Parse Primary Data
    try {
      primaryData = JSON.parse(primaryStr);
      if (!Array.isArray(primaryData)) {
        console.warn("Primary data parsed but is not an array. Defaulting to empty.", primaryData);
        primaryData = [];
      }
      // Basic validation of primary data items
      primaryData = primaryData.filter(item => item && typeof item === 'object' && item.hasOwnProperty('time') && item.hasOwnProperty('value'));
      console.log("Primary data parsed. Valid items:", primaryData.length);
    } catch (e) {
      console.error("Error parsing primary data JSON:", e, "\\nData String:", primaryStr);
      primaryData = []; // Ensure it's an empty array on error
    }

    // Parse Overlay Data
    try {
      if (overlayStr && overlayStr.trim() !== "" && overlayStr.trim() !== "{}") {
        parsedOverlayData = JSON.parse(overlayStr);
        if (typeof parsedOverlayData === 'object' && parsedOverlayData !== null && !Array.isArray(parsedOverlayData)) {
           // Validate structure: Keys should map to arrays of {time, value}
           let validKeys = 0;
           for (const key in parsedOverlayData) {
                if (Object.hasOwnProperty.call(parsedOverlayData, key)) {
                    const weekData = parsedOverlayData[key];
                    if(Array.isArray(weekData) && weekData.every(item => item && typeof item === 'object' && item.hasOwnProperty('time') && item.hasOwnProperty('value'))) {
                        validKeys++;
                    } else {
                         console.warn(\`Overlay data for key "${key}" is not a valid array of {time, value} objects. Ignoring this key.\`);
                         delete parsedOverlayData[key]; // Remove invalid data entry
                    }
                }
           }
           if (validKeys > 0) {
               hasValidOverlay = true;
               console.log("Overlay data parsed successfully. Valid keys found:", validKeys);
           } else {
                console.warn("Overlay data parsed, but no keys contained valid data arrays.");
                parsedOverlayData = null; // Reset if no valid keys found
           }
        } else {
          console.warn("Parsed overlay data is not a valid object (key-value pairs). Ignoring overlay data.", parsedOverlayData);
          parsedOverlayData = null;
        }
      } else {
        console.log("Overlay string is empty or '{}'. No overlay data to process.");
      }
    } catch (e) {
      console.error("Error parsing overlay JSON:", e, "\\nOverlay String:", overlayStr);
      parsedOverlayData = null; // Ensure null on error
    }

    return { primaryData, parsedOverlayData, hasValidOverlay };
  }

  // --- Axis Category Preparation Function ---
  function prepareAxisCategories(primaryData, overlayData) {
    let allDataForAxis = [...primaryData];
    if (overlayData) {
      try {
        Object.values(overlayData).forEach(weekArray => {
          if (Array.isArray(weekArray)) {
            allDataForAxis.push(...weekArray);
          }
        });
      } catch(e) {
          console.error("Error processing overlay data for axis categories:", e);
      }
    }

    // Extract unique, non-empty time categories and sort them (optional, but good practice)
    let uniqueTimes = [...new Set(allDataForAxis
        .map(item => item?.time) // Use optional chaining
        .filter(time => time !== undefined && time !== null && String(time).trim() !== ''))]
        .sort(); // Sort alphabetically/numerically

    let xAxisData = uniqueTimes.map(time => ({ time: time }));
    console.log("Axis categories prepared. Unique times:", uniqueTimes.length);
    return xAxisData;
  }

  // --- Chart and Axes Creation Function ---
  function createChartAndAxes(root, xAxisData) {
    console.log("Creating chart and axes...");
    // Create chart
    var chart = root.container.children.push(am5xy.XYChart.new(root, {
      panX: true,
      panY: false,
      wheelX: "panX",
      wheelY: "zoomX",
      layout: root.verticalLayout
    }));

    // Create X Axis (Category)
    var xRenderer = am5xy.AxisRendererX.new(root, {
      minGridDistance: 60, // Adjust spacing
    });
    // Improve label appearance
    xRenderer.labels.template.setAll({
        rotation: -45,
        centerY: am5.p50,
        centerX: am5.p100,
        paddingRight: 10
    });

    var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
      categoryField: "time",
      renderer: xRenderer,
      tooltip: am5.Tooltip.new(root, {}) // Basic tooltip for axis labels if needed
    }));

    if (xAxisData.length > 0) {
        xAxis.data.setAll(xAxisData);
    } else {
        console.warn("X-Axis has no data categories to display.");
    }

    // Create Y Axis (Value)
    var yRenderer = am5xy.AxisRendererY.new(root, {});
    var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
      maxPrecision: 2, // Max decimals on axis labels
      renderer: yRenderer
    }));

    console.log("Chart and axes created.");
    return { chart, xAxis, yAxis };
  }

  // --- Primary Series Creation Function ---
  function createPrimarySeries(chart, root, primaryData, xAxis, yAxis) {
    console.log("Creating primary series (Area/Column)...");
    // Area Series (Default Visible)
    var areaSeries = chart.series.push(am5xy.LineSeries.new(root, {
      name: "Selected Week",
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "value",
      categoryXField: "time",
      stroke: am5.color(primaryData[0]?.strokeSettings?.stroke || 0x095256), // Default color if undefined
      fill: am5.color(primaryData[0]?.strokeSettings?.stroke || 0x095256),
      fillOpacity: 0.3,
      tooltip: am5.Tooltip.new(root, {
        labelText: "{name}: {valueY.formatNumber('#.00')}"
      }),
      connect: false // Don't connect gaps
    }));
    areaSeries.strokes.template.set("strokeWidth", 2);
    areaSeries.fills.template.set("visible", true); // Ensure fill is visible
    areaSeries.data.setAll(primaryData);
    areaSeries.appear(1000);

    // Column Series (Default Hidden, toggleable via legend)
    var columnSeries = chart.series.push(am5xy.ColumnSeries.new(root, {
      name: "Selected Week (Interval)",
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "value",
      categoryXField: "time",
      fill: am5.color(0x095256), // Same base color
      stroke: am5.color(0x095256),
      opacity: 0.7,
      tooltip: am5.Tooltip.new(root, {
        labelText: "{name}: {valueY.formatNumber('#.00')}"
      }),
    }));
    columnSeries.columns.template.set("width", am5.percent(60)); // Adjust column width
    columnSeries.data.setAll(primaryData);
    columnSeries.hide(0); // Start hidden
    columnSeries.appear(1000);

    console.log("Primary series created.");
    return [areaSeries, columnSeries]; // Return both for legend
  }

  // --- Overlay Series Creation Function ---
  function createOverlaySeries(chart, root, overlayData, colors, xAxis, yAxis) {
    let overlaySeriesList = [];
    if (!overlayData) {
      console.log("No valid overlay data provided for series creation.");
      return overlaySeriesList;
    }

    console.log("Creating overlay series...");
    let colorIndex = 0; // Fallback color index

    try {
      for (const weekKey in overlayData) {
        if (Object.hasOwnProperty.call(overlayData, weekKey)) {
          const weekData = overlayData[weekKey]; // Already validated during parsing

          // Determine color
          let seriesColor = colors[weekKey]; // Try direct lookup
          if (!seriesColor) {
            // Fallback using ColorSet if key not in predefined map
            seriesColor = root.interfaceColors.get("grid"); // Default grid color as fallback
            console.warn(`No predefined color found for overlay key "${weekKey}". Using fallback.`);
          }

          console.log(`Creating LineSeries for: ${weekKey}`);
          var lineSeries = chart.series.push(am5xy.LineSeries.new(root, {
            name: weekKey,
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: "value",
            categoryXField: "time",
            stroke: am5.color(seriesColor),
            tooltip: am5.Tooltip.new(root, {
              labelText: `{name}: {valueY.formatNumber('#.00')}`
            }),
            connect: false // Do not connect gaps in data
          }));
          lineSeries.strokes.template.set("strokeWidth", 2); // Standard stroke width
          lineSeries.data.setAll(weekData);
          lineSeries.appear(1000);
          overlaySeriesList.push(lineSeries);
        }
      }
    } catch (e) {
        console.error("Error creating overlay series:", e);
    }

    console.log(`Overlay series creation finished. ${overlaySeriesList.length} series added.`);
    return overlaySeriesList;
  }

  // --- Legend Creation Function ---
  function createLegend(chart, root, seriesList) {
    if (!seriesList || seriesList.length <= 2) { // Only show legend if overlays exist
      console.log("Skipping legend creation (<= 2 series).");
      return null;
    }

    console.log("Creating legend...");
    var legend = chart.children.push(am5.Legend.new(root, { // Use children.push for positioning relative to chart
      centerX: am5.p50,
      x: am5.p50,
      marginTop: 15,
      marginBottom: 15,
    }));

    legend.itemContainers.template.setAll({
        paddingTop: 5,
        paddingBottom: 5
    });

    legend.itemContainers.template.set("toggleOnClick", true); // Allow toggling series visibility

    // Assign data AFTER configuration
    legend.data.setAll(seriesList);
    console.log("Legend created and populated.");
    return legend;
  }

  // --- Final Chart Configuration Function ---
  function configureChart(chart, root, yAxis, xAxis, label) {
    console.log("Configuring final chart elements (cursor, labels, scrollbar)...");
    // Add Cursor
    chart.set("cursor", am5xy.XYCursor.new(root, {
      behavior: "zoomX", // Enable zooming with cursor drag
      xAxis: xAxis // Link cursor to X axis
    }));
    // chart.cursor.lineY.set("visible", false); // Keep Y line if desired

    // Add Axis Labels
    yAxis.children.unshift(am5.Label.new(root, { // Use unshift to place before axis numbers
      rotation: -90,
      text: \`Average \${label} Points\`,
      y: am5.p50,
      centerX: am5.p50,
      paddingBottom: 10 // Add some padding
    }));

    xAxis.children.push(am5.Label.new(root, { // Use push to place after axis numbers/labels
      text: "Time of Day",
      x: am5.p50,
      centerX: am5.p50,
      paddingTop: 10 // Add some padding
    }));

    // Add Scrollbar
    chart.set("scrollbarX", am5.Scrollbar.new(root, {
      orientation: "horizontal",
      // height: 30 // Optional: adjust scrollbar height
    }));

    // Add appear animation
    chart.appear(1000, 100);
    console.log("Chart configured. Final appearance initiated.");
  }


  // --- Main Execution Flow ---
  console.log("--- Starting Chart Build Process ---");

  // 1. Parse Data
  const { primaryData, parsedOverlayData, hasValidOverlay } = parseChartData(primaryDataString, overlayString);

  // 2. Prepare Axis Categories (using ONLY valid data)
  const xAxisData = prepareAxisCategories(primaryData, parsedOverlayData); // Pass only valid overlay data

  // 3. Create Chart & Axes
  const { chart, xAxis, yAxis } = createChartAndAxes(root, xAxisData);

  // 4. Create Primary Series (Area + Column)
  const primarySeries = createPrimarySeries(chart, root, primaryData, xAxis, yAxis);

  // 5. Create Overlay Series (Lines)
  const overlaySeries = createOverlaySeries(chart, root, parsedOverlayData, overlayColors, xAxis, yAxis);

  // 6. Create Legend (conditionally)
  const allSeriesForLegend = [...primarySeries, ...overlaySeries];
  createLegend(chart, root, allSeriesForLegend);

  // 7. Final Configuration (Cursor, Labels, Scrollbar, Appear)
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
