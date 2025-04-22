window.function = function (data, overlayDataJson, width, height, type) {

  // --- Input Handling ---
  let dataStringValue = data.value ?? '[]';
  let overlayDataJsonStringValue = overlayDataJson.value ?? '{}';
  let chartWidth = width.value ?? 100; // Percentage
  let chartHeight = height.value ?? 550; // Pixels (Increased to match example)
  let chartTypeLabel = type.value ?? "Value"; // Default label

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
  // *** IMPORTANT: These variables hold the STRING data passed from the outer function ***
  const primaryDataString = ${JSON.stringify(dataStringValue)};
  const overlayString = ${JSON.stringify(overlayDataJsonStringValue)}; // <<< This holds the overlay JSON string
  const chartTypeLabel = ${JSON.stringify(chartTypeLabel)};
  const overlayColors = {
    "This Week": "#228B22", "Last Week": "#FFA500",
    "2 Weeks Ago": "#800080", "3 Weeks Ago": "#DC143C"
    // Add more week keys/colors if needed
  };

  // --- Root Element and Theme ---
  var root = am5.Root.new("chartdiv");
  root.setThemes([am5themes_Animated.new(root)]);
  console.log("Root created.");

  // --- Data Parsing Function ---
  function parseChartData(primaryStr, overlayStr) { // Takes the overlay STRING as input
    let primaryData = [];
    let parsedOverlayData = null;
    let hasValidOverlay = false;

    // Parse Primary Data
    try {
      let rawPrimary = JSON.parse(primaryStr);
      if (Array.isArray(rawPrimary)) {
        // Filter for items with AT LEAST time and value
        primaryData = rawPrimary.filter(item => item && typeof item === 'object' && item.hasOwnProperty('time') && item.hasOwnProperty('value'));
        console.log("Primary data parsed. Valid items with time/value:", primaryData.length);
        if (primaryData.length !== rawPrimary.length) {
            console.warn("Some primary data items were filtered out due to missing 'time' or 'value'.");
        }
      } else {
        console.warn("Primary data parsed but is not an array. Defaulting to empty.", rawPrimary);
      }
    } catch (e) {
      console.error("Error parsing primary data JSON:", e, "\\nData String:", primaryStr);
    }

    // Parse Overlay Data
    // *** Use the 'overlayStr' variable passed into this function ***
    try {
      if (overlayStr && overlayStr.trim() !== "" && overlayStr.trim() !== "{}") {
        parsedOverlayData = JSON.parse(overlayStr); // <<< Parse the embedded string here
        if (typeof parsedOverlayData === 'object' && parsedOverlayData !== null && !Array.isArray(parsedOverlayData)) {
           let validKeys = 0;
           for (const key in parsedOverlayData) {
                if (Object.hasOwnProperty.call(parsedOverlayData, key)) {
                    const weekData = parsedOverlayData[key];
                    // Validate each item in the week's data array
                    if(Array.isArray(weekData) && weekData.every(item => item && typeof item === 'object' && item.hasOwnProperty('time') && item.hasOwnProperty('value'))) {
                        validKeys++;
                    } else {
                         console.warn(\`Overlay data for key "\${key}" is not a valid array of {time, value} objects. Ignoring this key.\`);
                         delete parsedOverlayData[key]; // Remove invalid key
                    }
                }
           }
           if (validKeys > 0) {
               hasValidOverlay = true;
               console.log("Overlay data parsed successfully. Valid keys found:", validKeys);
           } else {
                console.warn("Overlay data parsed, but no keys contained valid data arrays.");
                parsedOverlayData = null;
           }
        } else {
          console.warn("Parsed overlay data is not a valid object (key-value pairs). Ignoring.", parsedOverlayData);
          parsedOverlayData = null;
        }
      } else {
        console.log("Overlay string is empty or '{}'. No overlay data to process.");
      }
    } catch (e) {
      console.error("Error parsing overlay JSON:", e, "\\nOverlay String:", overlayStr); // Log the string that failed
      parsedOverlayData = null;
    }

    return { primaryData, parsedOverlayData, hasValidOverlay };
  }

  // --- Axis Category Preparation ---
  function prepareAxisCategories(primaryData, overlayData) {
    let allDataForAxis = [...primaryData];
    if (overlayData) {
      try {
        Object.values(overlayData).forEach(weekArray => {
          if (Array.isArray(weekArray)) {
             // Only add items that have a 'time' property
             allDataForAxis.push(...weekArray.filter(item => item && item.hasOwnProperty('time')));
          }
        });
      } catch(e) { console.error("Error processing overlay data for axis:", e); }
    }

    let uniqueTimes = [...new Set(allDataForAxis
        .map(item => item?.time)
        .filter(time => time !== undefined && time !== null && String(time).trim() !== ''))]
        .sort(); // Sorting helps maintain consistent category order

    let xAxisData = uniqueTimes.map(time => ({ time: time }));
    console.log("Axis categories prepared. Unique times:", uniqueTimes.length);
    return xAxisData;
  }

  // --- Chart and Axes Creation ---
 function createChartAndAxes(root, xAxisData) {
    console.log("Creating chart and axes...");
    var chart = root.container.children.push(am5xy.XYChart.new(root, {
      panX: true, panY: true, // Enable panning
      wheelX: "panX", wheelY: "zoomX",
      layout: root.verticalLayout,
      pinchZoomX: true // Enable pinch zoom on touch devices
    }));

    // X Axis Renderer (styling) - Adjusted to match example
    var xRenderer = am5xy.AxisRendererX.new(root, {
       // minGridDistance: 60 // Can adjust this for label density
    });
    xRenderer.grid.template.set("location", 0.5); // Center grid lines
    xRenderer.labels.template.setAll({
        // dy: 20, // Adjust vertical position if needed
        fontSize: 8,
        location: 0.5,
        rotation: -90, // Rotate labels
        centerY: am5.p50, // Center vertically after rotation
        centerX: am5.p100, // Align to the right edge before rotation
        paddingRight: 5 // Add some space
        // multiLocation: 0.5 // Usually not needed with rotation
    });

    // Create X Axis (Category)
    var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
      categoryField: "time",
      renderer: xRenderer,
      // paddingRight: 5, // Padding moved to renderer label template
      tooltip: am5.Tooltip.new(root, {}) // Basic tooltip for axis labels
    }));

    if (xAxisData.length > 0) { xAxis.data.setAll(xAxisData); }
    else { console.warn("X-Axis has no data categories."); }

    // Create Y Axis (Value) - Adjusted precision
    var yRenderer = am5xy.AxisRendererY.new(root, {});
    var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
      maxPrecision: 2, // Allow decimals on Y-axis
      renderer: yRenderer
    }));

    console.log("Chart and axes created.");
    return { chart, xAxis, yAxis };
  }


  // --- Primary Series Creation (Area + Column) ---
  function createPrimarySeries(chart, root, primaryData, xAxis, yAxis) {
    console.log("Creating primary series...");

    // --- IMPORTANT NOTE ---
    // Your hardcoded example uses 'value', 'value2', 'value3', 'strokeSettings', 'fillSettings', 'bulletSettings'
    // This dynamic function assumes the input 'data' JSON string *only* contains arrays of '{time, value}'.
    // Features requiring other fields (like value2 for columns, specific colors per point)
    // will NOT work unless you modify this function AND provide input data in that complex format.

    // Area Series (LineSeries with fill)
    var areaSeries = chart.series.push(am5xy.LineSeries.new(root, {
      name: "Selected Week", // Name for Legend
      xAxis: xAxis, yAxis: yAxis,
      valueYField: "value", // Uses the 'value' field from input data
      categoryXField: "time",
      // stroke: am5.color(0x095256), // Hardcoded color - REMOVED, will use default theme color
      // fill: am5.color(0x095256), // Hardcoded color - REMOVED
      fillOpacity: 0.5, // Match example opacity
      tooltip: am5.Tooltip.new(root, { // Match example tooltip
        labelText: "{valueY.formatNumber('#.00')}",
        dy: -5 // Adjust position
      }),
      connect: false
    }));
    areaSeries.strokes.template.set("strokeWidth", 2); // Match example stroke width
    areaSeries.fills.template.set("visible", true); // Ensure fill is visible

    // Bullets - Basic circle bullet, cannot use templateField without complex data input
    areaSeries.bullets.push(function() {
      return am5.Bullet.new(root, {
        sprite: am5.Circle.new(root, {
          radius: 3, // Smaller radius
          fill: areaSeries.get("fill") // Use series fill color
        })
      });
    });


    areaSeries.data.setAll(primaryData); // Set data for area series
    areaSeries.appear(1000);

    // Column Series (Hidden by default)
    var columnSeries = chart.series.push(am5xy.ColumnSeries.new(root, {
      name: "Selected Week (Interval)", // Name for Legend
      xAxis: xAxis, yAxis: yAxis,
      valueYField: "value", // *** NOTE: Using 'value', NOT 'value2' like the example ***
                            // *** Change this if your input 'data' provides a different field ***
      categoryXField: "time",
      // Default colors will be from theme, adapters below will override
      tooltip: am5.Tooltip.new(root, { // Match example tooltip format
        labelText: "Interval: {valueY.formatNumber('#.00')}",
        dy: -10
      })
    }));

    // Adapters for column color based on value (like example)
    columnSeries.columns.template.adapters.add("fill", function(fill, target) {
      if (target.dataItem && target.dataItem.get("valueY") < 0) {
        return am5.color(0x8B0000); // DarkRed for negative
      }
      return fill; // Use default theme color for positive
    });
    columnSeries.columns.template.adapters.add("stroke", function(stroke, target) {
       if (target.dataItem && target.dataItem.get("valueY") < 0) {
        return am5.color(0x8B0000); // DarkRed for negative
      }
      return stroke; // Use default theme color for positive
    });

    // Column styling (like example)
    columnSeries.columns.template.setAll({
      // fillOpacity: 1, // Default is 1
      strokeWidth: 1, // Adjusted stroke width
      // cornerRadiusTL: 5, // Optional rounding
      // cornerRadiusTR: 5
      width: am5.percent(60) // Adjust width
    });

    columnSeries.data.setAll(primaryData); // Set data for column series
    columnSeries.hide(0); // Start hidden
    columnSeries.appear(1000);

    console.log("Primary series created.");
    return [areaSeries, columnSeries]; // Return both for legend
  }

  // --- Overlay Series Creation ---
  function createOverlaySeries(chart, root, overlayData, colors, xAxis, yAxis) {
    let overlaySeriesList = [];
    if (!overlayData) {
      console.log("No valid overlay data provided.");
      return overlaySeriesList;
    }
    console.log("Creating overlay series...");

    try {
      for (const weekKey in overlayData) { // Iterate through keys (e.g., "Last Week")
        if (Object.hasOwnProperty.call(overlayData, weekKey)) {
          const weekData = overlayData[weekKey]; // Get the array [{time, value}, ...]

          console.log(`Creating LineSeries for: ${weekKey}`);
          var lineSeries = chart.series.push(am5xy.LineSeries.new(root, {
            name: weekKey, // Use the key as the series name (for legend)
            xAxis: xAxis, yAxis: yAxis,
            valueYField: "value", // Assumes overlay data also uses {time, value}
            categoryXField: "time",
            stroke: am5.color(colors[weekKey] || root.interfaceColors.get("grid")), // Use mapped color or fallback
            tooltip: am5.Tooltip.new(root, {
              labelText: \`{name}: {valueY.formatNumber('#.00')}\` // Tooltip with series name
            }),
            connect: false // Don't connect gaps
          }));
          lineSeries.strokes.template.set("strokeWidth", 2); // Standard stroke width
          lineSeries.data.setAll(weekData); // Set data for this specific overlay series
          lineSeries.appear(1000);
          overlaySeriesList.push(lineSeries);
        }
      }
    } catch (e) { console.error("Error creating overlay series:", e); }

    console.log(`Overlay series creation finished. ${overlaySeriesList.length} series added.`);
    return overlaySeriesList;
  }

  // --- Legend Creation ---
  function createLegend(chart, root, seriesList) {
    // Only create legend if there are overlay series present (more than the 2 primary ones)
    if (!seriesList || seriesList.length <= 2) {
      console.log("Skipping legend creation (<= 2 series).");
      return null;
    }

    console.log("Creating legend...");
    // Using chart.children.push positions legend relative to chart plot area
    var legend = chart.children.push(am5.Legend.new(root, {
      // Position like example
      x: am5.percent(50),
      centerX: am5.percent(50),
      layout: root.horizontalLayout, // Horizontal layout like example
      marginTop: 15,
      marginBottom: 15 // Match example spacing
    }));

    legend.itemContainers.template.set("toggleOnClick", true); // Allow toggling series

    // Set data AFTER configuration
    legend.data.setAll(seriesList); // Add all series (primary + overlays)
    console.log("Legend created and populated.");
    return legend;
  }

  // --- Final Chart Configuration ---
  function configureChart(chart, root, yAxis, xAxis, label) {
    console.log("Configuring final chart elements...");
    // Add Cursor (Match example behavior)
    var cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
      behavior: "none" // "none" matches example, use "zoomX" or "panX" for interaction
    }));
    cursor.lineY.set("visible", false); // Hide Y line like example

    // Add Axis Labels (Match example text/positioning)
    yAxis.children.unshift(am5.Label.new(root, {
      rotation: -90,
      text: \`Average \${label} Points\`, // Use the dynamic label
      y: am5.p50,
      centerX: am5.p50,
      paddingRight: 10 // Add some space from axis line
    }));

    xAxis.children.push(am5.Label.new(root, {
      text: "Time of Day",
      x: am5.p50,
      centerX: am5.percent(50),
      paddingTop: 10 // Add some space from axis line
    }));

    // Add Scrollbar (Match example)
    chart.set("scrollbarX", am5.Scrollbar.new(root, {
      orientation: "horizontal",
      marginBottom: 5 // Spacing like example
    }));

    // Final appear animation
    chart.appear(1000, 100);
    console.log("Chart configured. Final appearance initiated.");
  }


  // --- Main Execution Flow ---
  console.log("--- Starting Chart Build Process ---");

  // 1. Parse Data (using the embedded strings)
  const { primaryData, parsedOverlayData, hasValidOverlay } = parseChartData(primaryDataString, overlayString); // <<< Uses overlayString

  // 2. Prepare Axis Categories
  const xAxisData = prepareAxisCategories(primaryData, parsedOverlayData);

  // 3. Create Chart & Axes
  const { chart, xAxis, yAxis } = createChartAndAxes(root, xAxisData);

  // 4. Create Primary Series (Area + Column)
  const primarySeries = createPrimarySeries(chart, root, primaryData, xAxis, yAxis);

  // 5. Create Overlay Series (Lines)
  const overlaySeries = createOverlaySeries(chart, root, parsedOverlayData, overlayColors, xAxis, yAxis);

  // 6. Create Legend (conditionally includes primary + overlays)
  const allSeriesForLegend = [...primarySeries, ...overlaySeries];
  createLegend(chart, root, allSeriesForLegend); // <<< Pass combined list

  // 7. Final Configuration
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
