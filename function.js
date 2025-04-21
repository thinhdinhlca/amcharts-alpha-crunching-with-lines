window.function = function (data, overlayDataJson, width, height, type) {

  // Safely get input values or defaults
  let dataString = data.value ?? '[]';
  let overlayDataJsonString = overlayDataJson.value ?? '{}';
  let chartWidth = width.value ?? 100;
  let chartHeight = height.value ?? 500;
  let chartTypeLabel = type.value ?? "SPX"; // Changed variable name for clarity

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

  // --- Root and Theme ---
  var root = am5.Root.new("chartdiv");
  root.setThemes([
    am5themes_Animated.new(root)
  ]);

  // *** IMPORTANT: Define colorSet - needed if data uses it ***
  var colorSet = am5.ColorSet.new(root, {});

  // --- Data Parsing and Validation ---
  var primaryData;
  try {
    primaryData = JSON.parse(${JSON.stringify(dataString)}); // Parse the primary data string
    if (!Array.isArray(primaryData)) {
        console.error("Primary data is not an array. Received:", primaryData);
        primaryData = []; // Default to empty array
    }
  } catch(e) {
    console.error("Error parsing primary data JSON:", e, "\\nData String:", ${JSON.stringify(dataString)});
    primaryData = []; // Default to empty array on error
  }

  var parsedOverlayData = null;
  try {
      // Only parse if the string is not empty/null and looks like an object
      let overlayString = ${JSON.stringify(overlayDataJsonString)};
      if (overlayString && overlayString.trim() !== "" && overlayString.trim() !== "{}") {
          parsedOverlayData = JSON.parse(overlayString);
          // Ensure it's an object
          if (typeof parsedOverlayData !== 'object' || parsedOverlayData === null || Array.isArray(parsedOverlayData)) {
              console.error("Parsed overlay data is not a valid object. Received:", parsedOverlayData);
              parsedOverlayData = null;
          }
      } else {
           // console.log("Overlay data string is empty or '{}'. No overlays will be added.");
      }
  } catch (e) {
      console.error("Error parsing overlay JSON:", e, "\\nOverlay String:", ${JSON.stringify(overlayDataJsonString)});
      parsedOverlayData = null; // Reset on error
  }

  // --- Chart Setup ---
  var chart = root.container.children.push(am5xy.XYChart.new(root, {
    panX: true,
    panY: true,
    wheelX: "panX",
    wheelY: "zoomX",
    layout: root.verticalLayout,
    pinchZoomX: true
  }));

  // --- Cursor ---
  var cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
    behavior: "none"
  }));
  cursor.lineY.set("visible", false);

  // --- Prepare Combined Data for Category Axis ---
  let allDataForAxis = [...primaryData]; // Start with primary data
  let hasValidOverlayData = false; // Flag to track if we actually add overlays

  if (parsedOverlayData) { // Check if overlay data was successfully parsed into an object
      Object.keys(parsedOverlayData).forEach(function(weekKey) {
          let weekData = parsedOverlayData[weekKey];
          // Validate overlay week data
          if (weekData && Array.isArray(weekData) && weekData.length > 0) {
               // Check if items have 'time' property before adding
               let validItems = weekData.filter(item => item && typeof item === 'object' && item.hasOwnProperty('time'));
               if (validItems.length > 0) {
                   allDataForAxis.push(...validItems); // Add only valid items
                   hasValidOverlayData = true; // Mark that we found potentially plottable overlay data
               } else {
                    console.warn(\`Overlay data for key "${weekKey}" has items but none have a 'time' property.\`);
               }
          } else {
               // console.log(\`Overlay data for key "${weekKey}" is empty or not an array.\`);
          }
      });
  }

  // Extract unique time categories from ALL relevant data, filtering invalid entries
  let uniqueTimes = [...new Set(allDataForAxis
      .map(item => item ? item.time : null) // Safely access time property
      .filter(time => time !== undefined && time !== null && time !== '') // Filter out invalid time values
  )];

  // Create the data array specifically for the xAxis
  let xAxisData = uniqueTimes.map(time => ({ time: time }));

  // --- X Axis (CategoryAxis) ---
  var xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 70 }); // Added minGridDistance
  xRenderer.grid.template.set("location", 0.5);
  xRenderer.labels.template.setAll({
    // dy: 20, // Often better to let theme handle dy
    fontSize: 8,
    location: 0.5,
    rotation: -90,
    multiLocation: 0.5,
    centerX: am5.p50 // Center labels under ticks
  });

  var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
    categoryField: "time",
    renderer: xRenderer,
    // paddingRight: 5, // Usually not needed with proper category setup
    tooltip: am5.Tooltip.new(root, {
        labelText: "{categoryX}" // Show category in tooltip
    })
  }));

  // *** Set the combined, unique category data to the xAxis ***
  if (xAxisData.length > 0) {
      xAxis.data.setAll(xAxisData);
  } else {
      console.warn("No valid category data found for X-Axis after processing primary and overlay data.");
  }


  // --- Y Axis (ValueAxis) ---
  var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
    maxPrecision: 2, // Allow decimals if needed
    renderer: am5xy.AxisRendererY.new(root, {})
  }));

  // --- Area Series (Selected Week) ---
  var areaSeries = chart.series.push(am5xy.LineSeries.new(root, {
    name: "Selected Week",
    xAxis: xAxis,
    yAxis: yAxis,
    valueYField: "value",        // Assumes primary data has "value"
    categoryXField: "time",      // Assumes primary data has "time"
    tooltip: am5.Tooltip.new(root, {
      labelText: "Selected: {valueY.formatNumber('#.00')}",
      dy:-5
    })
  }));

  areaSeries.strokes.template.setAll({
    templateField: "strokeSettings", // For dynamic stroke color from data
    strokeWidth: 2
  });
  // Ensure default stroke if strokeSettings isn't in data
  areaSeries.strokes.template.set("stroke", areaSeries.get("stroke"));

  areaSeries.fills.template.setAll({
    visible: true,
    fillOpacity: 0.5,
    templateField: "fillSettings" // For dynamic fill color from data (if used)
  });
  // Ensure default fill if fillSettings isn't in data
   areaSeries.fills.template.set("fill", areaSeries.get("fill"));


  areaSeries.bullets.push(function() {
    return am5.Bullet.new(root, {
      sprite: am5.Circle.new(root, {
        templateField: "bulletSettings", // For dynamic bullet settings from data
        radius: 3, // Slightly smaller default
        fill: areaSeries.get("fill"), // Use series fill color for bullets
        stroke: areaSeries.get("stroke") // Use series stroke color
      })
    });
  });

  areaSeries.data.setAll(primaryData); // Set primary data
  areaSeries.appear(1000);

  // --- Column Series (Selected Week Interval) ---
  var columnSeries = chart.series.push(am5xy.ColumnSeries.new(root, {
    name: "Selected Week (Interval)",
    xAxis: xAxis,
    yAxis: yAxis,
    valueYField: "value2",       // Assumes primary data has "value2"
    categoryXField: "time",      // Assumes primary data has "time"
    fill: am5.color("#023020"),  // Default positive color
    stroke: am5.color("#023020"), // Default positive color
    tooltip: am5.Tooltip.new(root, {
      labelText: "Interval: {valueY.formatNumber('#.00')}",
      dy:-10
    })
  }));

  // Adapter for negative value colors
  columnSeries.columns.template.adapters.add("fill", function(fill, target) {
    if (target.dataItem && target.dataItem.get("valueY") < 0) {
      return am5.color("#8B0000"); // Negative color
    }
    return fill;
  });

  columnSeries.columns.template.adapters.add("stroke", function(stroke, target) {
    if (target.dataItem && target.dataItem.get("valueY") < 0) {
      return am5.color("#8B0000"); // Negative color
    }
    return stroke;
  });

  columnSeries.columns.template.setAll({
    // fillOpacity: 1, // Default is 1
    strokeWidth: 1, // Thinner stroke for columns
    cornerRadiusTL: 3,
    cornerRadiusTR: 3,
    maxWidth: 10 // Prevent columns from getting too wide
  });

  columnSeries.data.setAll(primaryData); // Set primary data
  columnSeries.appear(1000);
  columnSeries.hide(0); // Initially hidden

  // --- Overlay Line Series ---
  const overlayColors = { // Define colors for specific overlay names
      "This Week": "#228B22", // ForestGreen
      "Last Week": "#FFA500", // Orange
      "2 Weeks Ago": "#800080", // Purple
      "3 Weeks Ago": "#DC143C"  // Crimson
  };
  let legendData = [areaSeries, columnSeries]; // Start legend with primary series

  if (hasValidOverlayData && parsedOverlayData) { // Only proceed if we found valid data structures
      Object.keys(parsedOverlayData).forEach(function(weekKey) {
          let weekData = parsedOverlayData[weekKey];

          // Final validation before creating series
          if (weekData && Array.isArray(weekData) && weekData.length > 0 && weekData.every(item => item && typeof item === 'object' && item.hasOwnProperty('time') && item.hasOwnProperty('value'))) {
              var lineSeries = chart.series.push(am5xy.LineSeries.new(root, {
                  name: weekKey, // Use the key from JSON as the series name
                  xAxis: xAxis,
                  yAxis: yAxis,
                  valueYField: "value",      // Assumes overlay data items have "value"
                  categoryXField: "time",    // Assumes overlay data items have "time"
                  stroke: am5.color(overlayColors[weekKey] || root.interfaceColors.get("grid")), // Use defined color or a default gray
                  // strokeWidth: 2, // Inherit or set globally if needed
                  tooltip: am5.Tooltip.new(root, {
                      labelText: \`{name}: {valueY.formatNumber('#.00')}\` // Use backticks for easier label construction
                  }),
                  connect: false // Don't connect lines across gaps in data
              }));

              lineSeries.data.setAll(weekData); // Set the specific data for this overlay series
              lineSeries.appear(1000);
              legendData.push(lineSeries); // Add to items that should appear in the legend
          } else {
               console.warn(\`Skipping overlay series "${weekKey}" due to invalid data format or missing 'time'/'value' properties.\`);
          }
      });
  }

  // --- Legend (Create only if overlays were added) ---
  if (legendData.length > 2) { // Check if any overlay series were actually added to legendData
       var legend = chart.set("legend", am5.Legend.new(root, {
           centerX: am5.percent(50),
           x: am5.percent(50),
           layout: root.horizontalLayout, // Horizontal layout
           marginTop: 15,
           marginBottom: 15
       }));
        // Add behavior to toggle series visibility
       legend.itemContainers.template.set("toggleOnClick", true);
       legend.data.setAll(legendData); // Populate legend AFTER all series are pushed
  }


  // --- Axis Labels ---
  xAxis.children.push(
    am5.Label.new(root, {
      text: "Time of Day",
      x: am5.percent(50),
      centerX: am5.percent(50),
      paddingTop: 5 // Add some padding
      // dy isn't usually needed here with proper layout
    })
  );

  yAxis.children.unshift( // Add to the beginning of children for left position
    am5.Label.new(root, {
      rotation: -90,
      text: \`Average \${chartTypeLabel} Points\`, // Use backticks and variable
      y: am5.percent(50),
      centerX: am5.percent(50)
    })
  );

  // --- Scrollbar ---
  chart.set("scrollbarX", am5.Scrollbar.new(root, {
    orientation: "horizontal",
    marginBottom: 10 // Adjusted margin
  }));

  // --- Final Appear Animation ---
  chart.appear(1000, 100);

}); // end am5.ready()
</script>

  </body>
</html>`;

  // --- Encode and Return URI ---
  let enc = encodeURIComponent(ht);
  let uri = `data:text/html;charset=utf-8,${enc}`;
  return uri;
}
