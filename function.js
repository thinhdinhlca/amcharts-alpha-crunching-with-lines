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
    let tempString = dataStringValue.trim();
    // Remove specific settings blocks if they cause issues
    tempString = tempString.replace(/strokeSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    tempString = tempString.replace(/fillSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    tempString = tempString.replace(/bulletSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    // Remove trailing commas before closing braces
    tempString = tempString.replace(/,\s*(\})/g, '$1');
    // Add quotes around keys
    tempString = tempString.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');
    // Ensure it starts and ends with brackets if not empty
    if (tempString && !tempString.startsWith('[')) { tempString = '[' + tempString; }
    if (tempString && !tempString.endsWith(']')) { tempString = tempString + ']'; }
    // Handle empty or invalid initial states
     if (!tempString || tempString === "[]" || tempString === "") {
       cleanedDataString = '[]';
     } else {
       // Try parsing to validate JSON structure before assignment
       JSON.parse(tempString);
       cleanedDataString = tempString;
       // console.log("DEBUG: Cleaned primary data string potentially valid JSON.");
     }
  } catch (cleaningError) {
    console.error("!!! Failed to clean primary data string !!!", cleaningError);
    // Fallback to empty array on any cleaning error
    cleanedDataString = '[]';
  }
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
    .am5-tooltip {
      font-size: 0.85em; /* Smaller font globally */
      pointer-events: none; /* Prevent tooltips from blocking cursor */
    }
  </style>
</head>
<body>
  <div id="chartdiv"></div>

<script>
am5.ready(function() {

  // console.log("am5.ready() invoked.");

  // --- Configuration & Data ---
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

  // --- Root Element and Theme ---
  var root = am5.Root.new("chartdiv");
  root.setThemes([am5themes_Animated.new(root)]);
  // console.log("Root created.");

  // --- Data Parsing Function ---
  function parseChartData(primaryStr, overlayStr) {
     let primaryData = []; let parsedOverlayData = null; let hasValidOverlay = false;
     try {
         let rawPrimary = JSON.parse(primaryStr);
         if (Array.isArray(rawPrimary)) {
             primaryData = rawPrimary.map(item => {
                 // Basic validation for primary data items
                 if (!(item && typeof item === 'object' && item.hasOwnProperty('time') && typeof item.time === 'string' && item.hasOwnProperty('value') && typeof item.value === 'number')) {
                     // console.warn("Invalid primary data item structure:", item);
                     return null; // Filter out invalid items
                 }
                 // Ensure value2 is a number if present, otherwise remove it
                 if (item.hasOwnProperty('value2') && typeof item.value2 !== 'number') {
                     // console.warn("Invalid value2 type, removing:", item.value2);
                     delete item.value2;
                 }
                 return item;
             }).filter(item => item !== null); // Remove nulls introduced by filtering
             // console.log("Primary data parsed & filtered:", primaryData.length, "valid items");
         } else {
             console.warn("Parsed primary data is not an array.");
         }
     } catch (e) {
         console.error("Error parsing primary data JSON:", e, "Input string:", primaryStr);
         primaryData = []; // Ensure primaryData is an array even on error
     }

     try {
         if (overlayStr && overlayStr.trim() !== "" && overlayStr.trim() !== "{}") {
             let rawOverlay = JSON.parse(overlayStr);
             if (typeof rawOverlay === 'object' && rawOverlay !== null && !Array.isArray(rawOverlay)) {
                 parsedOverlayData = {};
                 let validKeys = 0;
                 for (const key in rawOverlay) {
                     if (Object.hasOwnProperty.call(rawOverlay, key)) {
                         const weekDataRaw = rawOverlay[key];
                         if(Array.isArray(weekDataRaw)) {
                             // Filter items within each overlay array
                             const processedWeekData = weekDataRaw.filter(item =>
                                 item && typeof item === 'object' &&
                                 item.hasOwnProperty('time') && typeof item.time === 'string' &&
                                 item.hasOwnProperty('value') && typeof item.value === 'number'
                             );
                             if (processedWeekData.length > 0) {
                                 parsedOverlayData[key] = processedWeekData;
                                 validKeys++;
                             } else {
                                 console.warn("Overlay data for key \"" + key + "\" had no valid items after filtering.");
                             }
                         } else {
                             console.warn("Overlay data for key \"" + key + "\" was not an array.");
                         }
                     }
                 }
                 if (validKeys > 0) {
                     hasValidOverlay = true;
                     // console.log("Overlay data parsed. Valid keys with data:", validKeys);
                 } else {
                     console.warn("Overlay data parsed, but no valid keys/data found.");
                     parsedOverlayData = null; // Reset if no valid data
                 }
             } else {
                 console.warn("Parsed overlay data is not a valid object:", overlayStr);
             }
         } else {
             // console.log("No overlay data string provided or it's empty.");
         }
     } catch (e) {
         console.error("Error parsing overlay JSON:", e, "Input string:", overlayStr);
         parsedOverlayData = null; // Reset on error
     }
     return { primaryData, parsedOverlayData, hasValidOverlay };
   }

  // --- Axis Category Preparation (Using primary data IN ORDER) ---
  function prepareAxisCategories(primaryData) {
     if (!primaryData || primaryData.length === 0) {
         console.warn("Primary data is empty, axis will be empty.");
         return [];
     }
     try {
         // console.log("Preparing axis categories assuming input primary data is sorted.");
         // Extract the 'time' field from each item in the primary data
         let categoryStrings = primaryData.map(item => item.time);
         // Although the data is assumed sorted, ensure uniqueness for the axis categories
         let uniqueCategoryStrings = categoryStrings.filter((value, index, self) => self.indexOf(value) === index);
         // Map unique strings back to the object structure amCharts expects for category data
         let xAxisData = uniqueCategoryStrings.map(timeStr => ({ time: timeStr }));
         // console.log("Axis categories prepared from primary data:", xAxisData.length);
         return xAxisData;
     } catch (e) {
         console.error("Error preparing axis categories:", e);
         return []; // Return empty array on error
     }
   }

  // --- Chart and Axes Creation (Using CategoryAxis) ---
  function createChartAndAxes(root, xAxisData) {
    // console.log("Creating chart and axes (using CategoryAxis)...");
    var chart = root.container.children.push(am5xy.XYChart.new(root, {
        panX: true, panY: true, wheelX: "panX", wheelY: "zoomX",
        layout: root.verticalLayout, pinchZoomX: true
    }));

    var xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 70 });
    xRenderer.labels.template.setAll({
        fontSize: 8, rotation: -90, centerY: am5.p50, centerX: am5.p100, paddingRight: 5
    });

    var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
        categoryField: "time",
        renderer: xRenderer,
        tooltip: am5.Tooltip.new(root, {}) // Basic tooltip for axis labels if needed
    }));

    // Set the category data on the axis
    if (xAxisData.length > 0) {
        xAxis.data.setAll(xAxisData);
        // console.log("Set", xAxisData.length, "categories on X-Axis.");
    } else {
        console.warn("X-Axis has no data categories to set.");
    }

    var yRenderer = am5xy.AxisRendererY.new(root, {});
    var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
        maxPrecision: 2, // Control number formatting precision
        renderer: yRenderer
    }));

    // console.log("Chart and axes created.");
    return { chart, xAxis, yAxis };
   }


  // --- Primary Series Creation ---
  function createPrimarySeries(chart, root, primaryData, xAxis, yAxis) {
    // console.log("Creating primary series (Line, AreaFill, Value2Bars)...");

    let lineSeries, fillSeries, value2Series;

    // 1. Area Fill Series (Light Blue Columns, No Tooltip, No Toggle)
    fillSeries = chart.series.push(am5xy.ColumnSeries.new(root, {
        name: intervalName + " (Fill)", // Internal name only
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "value",
        categoryXField: "time",
        fill: am5.color(primaryFillColor),
        strokeOpacity: 0, // No outline for fill columns
        width: am5.percent(100), // Fill the category width
        toggleable: false, // Cannot be turned off directly via legend
    }));
    fillSeries.data.setAll(primaryData);
    fillSeries.appear(1000); // Animation


    // 2. Value2 Bar Series (Red/Green, Tooltip, IS Toggleable in Legend)
    value2Series = chart.series.push(am5xy.ColumnSeries.new(root, {
      name: intervalName + " (Cumulative)", // Name that WILL appear in legend
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "value2",
      categoryXField: "time",
      toggleable: true, // *** IS toggleable via legend ***
      tooltip: am5.Tooltip.new(root, {
          getFillFromSprite: false, // Use specific colors, not derived from column fill
          labelTextColor: am5.color(0xffffff),
          fontSize: tooltipFontSize,
          labelText: intervalName + " (Cumulative): {valueY.formatNumber('#.##')}"
      })
    }));
    // Adapters to dynamically set fill/stroke color based on value2
    value2Series.columns.template.adapters.add("fill", function(fill, target) {
        const v2 = target.dataItem?.get("valueY");
        // Handle cases where value2 might be missing or non-numeric in the filtered data
        return typeof v2 === 'number' ? (v2 < 0 ? am5.color(negativeValue2Color) : am5.color(positiveValue2Color)) : am5.color(0xffffff, 0); // Transparent if invalid
    });
    value2Series.columns.template.adapters.add("stroke", function(stroke, target) {
        const v2 = target.dataItem?.get("valueY");
        return typeof v2 === 'number' ? (v2 < 0 ? am5.color(negativeValue2Color) : am5.color(positiveValue2Color)) : am5.color(0xffffff, 0); // Transparent if invalid
    });
    value2Series.columns.template.setAll({
        strokeWidth: 2,
        strokeOpacity: 1,
        width: am5.percent(60) // Bars are narrower than the fill
    });
    value2Series.data.setAll(primaryData);
    value2Series.appear(1000); // Animation


    // 3. Area Line Series (Dark Blue Outline, Tooltip, IS Toggleable)
    // *** This one controls the legend AND toggles the fill series ***
    lineSeries = chart.series.push(am5xy.LineSeries.new(root, {
      name: intervalName, // Main name for the legend
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "value",
      categoryXField: "time",
      stroke: am5.color(primaryOutlineColor),
      fillOpacity: 0, // Line only, no fill under the line itself
      connect: false, // Don't connect across missing data points
      toggleable: true, // IS toggleable via legend
      tooltip: am5.Tooltip.new(root, {
          getFillFromSprite: true, // Tooltip background matches line color
          labelTextColor: am5.color(0xffffff),
          fontSize: tooltipFontSize,
          labelText: intervalName + ": {valueY.formatNumber('#.00')}" // Format value in tooltip
      })
    }));
    lineSeries.strokes.template.set("strokeWidth", 2); // Line thickness
    lineSeries.data.setAll(primaryData);
    lineSeries.appear(1000); // Animation


    // console.log("Primary series created.");
    // Return object containing references needed for linking and legend
    return { line: lineSeries, fill: fillSeries, bars: value2Series };
  }


  // --- Overlay Series Creation (Default tooltip background) ---
  function createOverlaySeries(chart, root, overlayData, colors, xAxis, yAxis) {
     let overlaySeriesList = [];
     if (!overlayData) {
         // console.log("No valid overlay data provided.");
         return overlaySeriesList; // Return empty list if no data
     }
     // console.log("Creating overlay series...");
     try {
         for (const weekKey in overlayData) {
             if (Object.hasOwnProperty.call(overlayData, weekKey)) {
                 const weekData = overlayData[weekKey];
                 // console.log("Creating LineSeries for: " + weekKey);
                 var lineSeries = chart.series.push(am5xy.LineSeries.new(root, {
                     name: weekKey, // Name from the JSON key (e.g., "Last Week")
                     xAxis: xAxis,
                     yAxis: yAxis,
                     valueYField: "value",
                     categoryXField: "time",
                     stroke: am5.color(colors[weekKey] || root.interfaceColors.get("grid")), // Use predefined color or default
                     connect: false, // Don't connect gaps
                     tooltip: am5.Tooltip.new(root, {
                         getFillFromSprite: true, // Tooltip background matches line
                         labelTextColor: am5.color(0xffffff),
                         fontSize: tooltipFontSize,
                         labelText: "{name}: {valueY.formatNumber('#.00')}" // Show series name and formatted value
                     })
                 }));
                 lineSeries.strokes.template.set("strokeWidth", 2);
                 lineSeries.data.setAll(weekData); // Set data for this specific overlay series
                 lineSeries.appear(1000); // Animation
                 overlaySeriesList.push(lineSeries); // Add to the list
             }
         }
     } catch (e) {
         console.error("Error creating overlay series:", e);
     }
     // console.log("Overlay series creation finished:", overlaySeriesList.length);
     return overlaySeriesList;
   }

  // --- Legend Creation & Linking ---
  // *** ADDED DEBUG LOGS ***
  function createLegend(chart, root, mainLineSeries, fillSeriesToToggle, barsSeries, otherSeries) {
     // Combine series for the legend DATA
     const legendSeries = [mainLineSeries, barsSeries, ...otherSeries]; // Line, Bars, Overlays

     if (legendSeries.length === 0) { console.log("Skipping legend (no series)."); return null; }

     console.log("DEBUG: Creating legend. Series included:", legendSeries.map(s => s.get("name"))); // LOG: Check series names

     // Create container for legend and hint (unchanged)
     var legendContainer = chart.children.push(am5.Container.new(root, {
        width: am5.percent(100),
        layout: root.verticalLayout, // Arrange legend and hint vertically
        x: am5.p50, centerX: am5.p50, // Center the container
        paddingBottom: 10 // Add some space below
     }));
     var legend = legendContainer.children.push(am5.Legend.new(root, {
         x: am5.percent(50), centerX: am5.percent(50), // Center legend within container
         layout: root.horizontalLayout, // Horizontal layout for items
         marginTop: 5,
         marginBottom: 5 // Space between legend and hint
     }));
     // Add hint label below legend
     legendContainer.children.push(am5.Label.new(root, {
         text: "(Click legend items to toggle visibility)",
         fontSize: "0.75em",
         fill: am5.color(0x888888), // Grey color for hint
         x: am5.p50, centerX: am5.p50 // Center hint text
     }));

     // Set data for the legend
     legend.data.setAll(legendSeries);

     // Add event listener AFTER data is set for synchronized toggle
     legend.itemContainers.template.events.on("click", function(ev) {
        const clickedSeries = ev.target.dataItem?.dataContext;
        console.log("--- DEBUG: Legend Click Detected ---"); // LOG: Start
        console.log("DEBUG: Clicked Series Name:", clickedSeries?.get("name")); // LOG: Which series was clicked?
        console.log("DEBUG: Main Line Series Name:", mainLineSeries?.get("name")); // LOG: What is the target series?

        // Check if the clicked item is the main line series
        if (clickedSeries === mainLineSeries) {
            console.log("DEBUG: MATCH: Clicked the MAIN interval legend item."); // LOG: Confirmation
            // Use setTimeout to allow default toggle action to complete
            setTimeout(() => {
                 // Check the NEW visibility state of the main line series AFTER the default toggle
                 const isHidden = mainLineSeries.isHidden() || !mainLineSeries.get("visible");
                 console.log("DEBUG: Main line series is now hidden:", isHidden); // LOG: New state of line
                 console.log("DEBUG: Fill series visibility BEFORE trying to toggle:", fillSeriesToToggle.get("visible")); // LOG: State before

                 if (isHidden) {
                    console.log("DEBUG: Action: Hiding fill series..."); // LOG: Action
                    fillSeriesToToggle.hide();
                 } else {
                    console.log("DEBUG: Action: Showing fill series..."); // LOG: Action
                    fillSeriesToToggle.show();
                 }
                 // Check state shortly after trying to change it (optional, for deeper debug)
                 setTimeout(() => {
                    console.log("DEBUG: Fill series visibility AFTER trying to toggle:", fillSeriesToToggle.get("visible")); // LOG: State after
                 }, 50);

            }, 0); // Timeout ensures default toggle action has completed
        } else {
             console.log("DEBUG: NO MATCH: Clicked a different legend item (default toggle applies)."); // LOG: Clicked something else
        }
        console.log("--- DEBUG: End Legend Click Logic ---"); // LOG: End
     });

     console.log("DEBUG: Legend created and listener attached.");
     return legend;
   }


  // --- Final Chart Configuration ---
  function configureChart(chart, root, yAxis, xAxis, label) {
    // console.log("Configuring final chart elements...");
    // Add cursor
    var cursor = chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "none" }));
    cursor.lineY.set("visible", false); // Hide Y cursor line

    // Add Y-axis label
    yAxis.children.unshift(am5.Label.new(root, {
        rotation: -90,
        text: "Average " + label + " Points",
        y: am5.p50,
        centerX: am5.p50,
        paddingRight: 10 // Space between label and axis
    }));

    // Add X-axis label
    xAxis.children.push(am5.Label.new(root, {
        text: "Time of Day",
        x: am5.p50,
        centerX: am5.percent(50),
        paddingTop: 10 // Space between axis and label
    }));

    // Add horizontal scrollbar
    chart.set("scrollbarX", am5.Scrollbar.new(root, {
        orientation: "horizontal",
        marginBottom: 25 // Space below scrollbar
    }));

    // Make the chart appear animation
    chart.appear(1000, 100);
    // console.log("Chart configured.");
   }


  // --- Main Execution Flow ---
  // console.log("--- Starting Chart Build Process ---");
  const { primaryData, parsedOverlayData, hasValidOverlay } = parseChartData(primaryDataString, overlayString);
  const xAxisData = prepareAxisCategories(primaryData);
  const { chart, xAxis, yAxis } = createChartAndAxes(root, xAxisData);

  // Create primary series and get references
  const primarySeriesRefs = createPrimarySeries(chart, root, primaryData, xAxis, yAxis);

  // Create overlay series
  const overlaySeries = createOverlaySeries(chart, root, parsedOverlayData, overlayColors, xAxis, yAxis);

  // Create legend, passing all necessary references for linking and data
  createLegend(chart, root, primarySeriesRefs.line, primarySeriesRefs.fill, primarySeriesRefs.bars, overlaySeries);

  // Final chart configurations (labels, cursor, scrollbar)
  configureChart(chart, root, yAxis, xAxis, chartTypeLabel);
  // console.log("--- Chart Build Process Complete ---");

}); // end am5.ready()
</script>

</body>
</html>`;

  // --- Encode and Return URI ---
  const encodedHtml = encodeURIComponent(ht);
  const dataUri = `data:text/html;charset=utf-8,${encodedHtml}`;
  return dataUri;
}
