window.function = function (
    data, overlayDataJson, intervalName, type, // Core data/labels
    showCumulative, show3WeeksAgo, show2WeeksAgo, showLastWeek, showThisWeek, // Boolean flags (unused but kept)
    width, height // Dimensions
) {

  // --- Input Handling & Cleaning ---
  let dataStringValue = data.value ?? '[]';
  let overlayDataJsonStringValue = overlayDataJson.value ?? '{}';
  let intervalNameValue = intervalName.value ?? "Period";
  let chartWidth = width.value ?? 100;
  let chartHeight = height.value ?? 750;
  let chartTypeLabel = type.value ?? "Value";

  // --- JSON Cleaning (same as before) ---
  let cleanedDataString = '[]';
  try {
    let tempString = dataStringValue.trim();
    tempString = tempString.replace(/strokeSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    tempString = tempString.replace(/fillSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    tempString = tempString.replace(/bulletSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    tempString = tempString.replace(/,\s*(\})/g, '$1');
    tempString = tempString.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');
    if (tempString && !tempString.startsWith('[')) { tempString = '[' + tempString; }
    if (tempString && !tempString.endsWith(']')) { tempString = tempString + ']'; }
    if (!tempString || tempString === "[]" || tempString === "") { cleanedDataString = '[]'; }
    else { JSON.parse(tempString); cleanedDataString = tempString; }
  } catch (cleaningError) { console.error("!!! Failed to clean primary data string !!!", cleaningError); cleanedDataString = '[]'; }


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
    html, body { margin: 0; padding: 0; height: 100%; width: 100%; font-family: sans-serif; }
    #chartdiv { width: ${chartWidth}%; height: ${chartHeight}px; }
    #controls {
        width: ${chartWidth}%;
        text-align: center;
        padding: 5px 0 10px 0;
        margin-top: 5px;
        box-sizing: border-box;
    }
    #controls button {
        padding: 5px 15px;
        margin: 0 5px;
        cursor: pointer;
        font-size: 0.9em;
        border: 1px solid #ccc;
        border-radius: 4px;
        background-color: #f0f0f0;
    }
     #controls button:hover {
        background-color: #e0e0e0;
     }
    .am5-tooltip { font-size: 0.85em; pointer-events: none; }
  </style>
</head>
<body>
  <div id="chartdiv"></div>
  <div id="controls">
      <button id="toggleOnBtn">Show All</button>
      <button id="toggleOffBtn">Hide All</button>
  </div>

<script>
am5.ready(function() {

  const primaryDataString = ${JSON.stringify(cleanedDataString)};
  const overlayString = ${JSON.stringify(overlayDataJsonStringValue)};
  const intervalName = ${JSON.stringify(intervalNameValue)};
  const chartTypeLabel = ${JSON.stringify(chartTypeLabel)};

  const overlayColors = {
      "This Week": "#228B22",
      "1 Week Before": "#FFA500",
      "2 Weeks Before": "#800080",
      "3 Weeks Before": "#DC143C",
      "Default": "#888888"
  };
  const primaryOutlineColor = "#09077b";
  const primaryFillColor = "#b6dbee";
  const primaryValue2TooltipBgColor = "#333333";
  const positiveValue2Color = "#052f20";
  const negativeValue2Color = "#78080e";
  const tooltipFontSize = "0.6em";
  const whiteColorHex = "#ffffff";
  const blackColorHex = "#000000";
  const hintLabelColorHex = "#888888";
  const transparentWhiteHex = "#ffffff";

  var root = am5.Root.new("chartdiv");
  root.setThemes([am5themes_Animated.new(root)]);

  // *** MODIFIED: Expanded function formatting for clarity ***
  function parseChartData(primaryStr, overlayStr) {
    let primaryData = [];
    let parsedOverlayData = null;
    let hasValidOverlay = false;

    try {
      let rawPrimary = JSON.parse(primaryStr);
      if (Array.isArray(rawPrimary)) {
        primaryData = rawPrimary.map(item => {
          if (!(item && typeof item === 'object' && item.hasOwnProperty('time') && typeof item.time === 'string' && item.hasOwnProperty('value') && typeof item.value === 'number')) {
            return null;
          }
          if (item.hasOwnProperty('value2') && typeof item.value2 !== 'number') {
            delete item.value2;
          }
          return item;
        }).filter(item => item !== null);
      } else {
        console.warn("Parsed primary data is not an array.");
      }
    } catch (e) {
      console.error("Error parsing primary data JSON:", e);
      primaryData = []; // Ensure primaryData is an array even on error
    }

    try {
      // Only attempt to parse overlay if it's a non-empty, non-empty-object string
      if (overlayStr && overlayStr.trim() !== "" && overlayStr.trim() !== "{}") {
        let rawOverlay = JSON.parse(overlayStr);
        // Check if it's a non-null object (and not an array)
        if (typeof rawOverlay === 'object' && rawOverlay !== null && !Array.isArray(rawOverlay)) {
          parsedOverlayData = {};
          let validKeys = 0;
          for (const key in rawOverlay) {
            // Ensure it's an own property and the value is an array
            if (Object.hasOwnProperty.call(rawOverlay, key) && Array.isArray(rawOverlay[key])) {
              const weekDataRaw = rawOverlay[key];
              // Filter data points within the array
              const processedWeekData = weekDataRaw.filter(item =>
                item && typeof item === 'object' &&
                item.hasOwnProperty('time') && typeof item.time === 'string' &&
                item.hasOwnProperty('value') && typeof item.value === 'number'
              );
              // Only add the key if there's valid data after filtering
              if (processedWeekData.length > 0) {
                parsedOverlayData[key] = processedWeekData;
                validKeys++;
              } else {
                 // console.warn(\`Overlay key '\${key}' has no valid data points after filtering.\`); // Optional
              }
            } else {
               // console.warn(\`Overlay key '\${key}' data is not an array or not an own property.\`); // Optional
            }
          }
          // If we found at least one valid week array, mark overlay as valid
          if (validKeys > 0) {
            hasValidOverlay = true;
          } else {
            parsedOverlayData = null; // Reset if no valid keys found
             // console.warn("Overlay data object parsed, but no valid week arrays found within it."); // Optional
          }
        } else {
           // console.warn("Parsed overlay data is not a non-array object."); // Optional
        }
      } else {
         // console.log("No overlay data provided or overlay data is empty/placeholder."); // Optional
      }
    } catch (e) {
      console.error("Error parsing overlay JSON:", e);
      parsedOverlayData = null; // Ensure overlay data is null on error
    }

    return { primaryData, parsedOverlayData, hasValidOverlay };
  }

  // *** MODIFIED: Expanded function formatting for clarity ***
  function prepareAxisCategories(primaryData) {
    if (!primaryData || primaryData.length === 0) {
        return [];
    }
    try {
        // Extract 'time' strings
        let categoryStrings = primaryData.map(item => item.time);
        // Get unique 'time' strings in order of appearance
        let uniqueCategoryStrings = categoryStrings.filter((value, index, self) => self.indexOf(value) === index);
        // Format for amCharts axis data
        let xAxisData = uniqueCategoryStrings.map(timeStr => ({ time: timeStr }));
        return xAxisData;
    } catch (e) {
        console.error("Error preparing axis categories:", e);
        return [];
    }
  }

  // *** MODIFIED: Expanded function formatting for clarity ***
  function createChartAndAxes(root, xAxisData) {
    var chart = root.container.children.push(am5xy.XYChart.new(root, {
      panX: true,
      panY: true,
      wheelX: "panX",
      wheelY: "zoomX",
      layout: root.verticalLayout,
      pinchZoomX: true
    }));

    var xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 70 });
    xRenderer.labels.template.setAll({
        fontSize: 8,
        rotation: -90,
        centerY: am5.p50,
        centerX: am5.p100,
        paddingRight: 5
    });

    var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
      categoryField: "time",
      renderer: xRenderer,
      tooltip: am5.Tooltip.new(root, {})
    }));

    if (xAxisData && xAxisData.length > 0) {
        xAxis.data.setAll(xAxisData);
    } else {
        console.warn("X-Axis has no data categories to set.");
    }


    var yRenderer = am5xy.AxisRendererY.new(root, {});
    var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
      maxPrecision: 2, // Avoid excessive decimal places
      renderer: yRenderer
    }));

    return { chart, xAxis, yAxis };
  }

  // *** MODIFIED: Expanded function formatting for clarity ***
  function createPrimarySeries(chart, root, primaryData, xAxis, yAxis) {
    let lineSeries, fillSeries, value2Series;

    // Fill Series (Background for Line) - Make non-toggleable from legend
    fillSeries = chart.series.push(am5xy.ColumnSeries.new(root, {
        name: intervalName + " (Fill)", // Name for internal reference, not shown in legend if toggleable: false
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "value",
        categoryXField: "time",
        fill: am5.color(primaryFillColor),
        strokeOpacity: 0, // No border for the fill
        width: am5.percent(100), // Ensure full category width coverage
        toggleable: false // Prevent direct legend toggle
    }));
    fillSeries.data.setAll(primaryData);

    // Value2 Series (Optional Bars)
    value2Series = chart.series.push(am5xy.ColumnSeries.new(root, {
        name: intervalName + " (Bars)", // Name for Legend
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "value2",
        categoryXField: "time",
        tooltip: am5.Tooltip.new(root, {
            getFillFromSprite: false, // Use custom background
            labelTextColor: am5.color(whiteColorHex),
            fontSize: tooltipFontSize,
            labelText: intervalName + " (Bars): {valueY.formatNumber('#.##')}"
        })
    }));
    // Style tooltip background for Value2
    value2Series.get("tooltip").get("background").set("fill", am5.color(primaryValue2TooltipBgColor));

    // Adapt bar colors based on value (positive/negative)
    value2Series.columns.template.adapters.add("fill", function(fill, target) {
        const v2 = target.dataItem?.get("valueY");
        return typeof v2 === 'number' ? (v2 < 0 ? am5.color(negativeValue2Color) : am5.color(positiveValue2Color)) : am5.color(transparentWhiteHex, 0); // Transparent if no value
    });
    value2Series.columns.template.adapters.add("stroke", function(stroke, target) {
        const v2 = target.dataItem?.get("valueY");
        return typeof v2 === 'number' ? (v2 < 0 ? am5.color(negativeValue2Color) : am5.color(positiveValue2Color)) : am5.color(transparentWhiteHex, 0); // Transparent if no value
    });
    value2Series.columns.template.setAll({
        strokeWidth: 2,
        strokeOpacity: 1,
        width: am5.percent(60) // Bar width relative to category width
    });
    value2Series.data.setAll(primaryData);


    // Line Series (Primary Value)
    lineSeries = chart.series.push(am5xy.LineSeries.new(root, {
        name: intervalName, // Name for Legend
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "value",
        categoryXField: "time",
        stroke: am5.color(primaryOutlineColor),
        fillOpacity: 0, // No fill under the line itself
        connect: false, // Don't connect gaps in data
        tooltip: am5.Tooltip.new(root, {
            getFillFromSprite: true, // Use line color for tooltip background
            labelTextColor: am5.color(whiteColorHex),
            fontSize: tooltipFontSize,
            labelText: intervalName + ": {valueY.formatNumber('#.00')}" // Format value in tooltip
        })
    }));
    lineSeries.strokes.template.set("strokeWidth", 2);
    lineSeries.data.setAll(primaryData);

    return { line: lineSeries, fill: fillSeries, bars: value2Series };
  }

  // *** MODIFIED: Expanded function formatting for clarity ***
  function createOverlaySeries(chart, root, overlayData, colors, xAxis, yAxis) {
     let overlaySeriesList = [];
     if (!overlayData) {
         return overlaySeriesList; // Return empty if no overlay data object
     }
     try {
       for (const weekKey in overlayData) {
         if (Object.hasOwnProperty.call(overlayData, weekKey)) {
           const weekData = overlayData[weekKey]; // Already filtered in parseChartData
           const seriesColor = colors[weekKey] || colors["Default"]; // Use specific color or default

           var lineSeries = chart.series.push(am5xy.LineSeries.new(root, {
               name: weekKey, // Use the key as the series name (for legend)
               xAxis: xAxis,
               yAxis: yAxis,
               valueYField: "value",
               categoryXField: "time",
               stroke: am5.color(seriesColor),
               connect: false, // Don't connect gaps
               tooltip: am5.Tooltip.new(root, {
                   getFillFromSprite: false, // Use custom background color
                   labelTextColor: am5.color( (weekKey === "1 Week Before") ? blackColorHex : whiteColorHex ), // Special text color for orange
                   fontSize: tooltipFontSize,
                   labelText: "{name}: {valueY.formatNumber('#.00')}" // Show series name and value
               })
           }));
           // Set tooltip background explicitly
           lineSeries.get("tooltip").get("background").set("fill", am5.color(seriesColor));
           lineSeries.strokes.template.set("strokeWidth", 2); // Line thickness
           lineSeries.data.setAll(weekData); // Set the data for this specific overlay series
           overlaySeriesList.push(lineSeries); // Add to the list
         }
       }
     } catch (e) {
       console.error("Error creating overlay series:", e);
       // Potentially clear the list if an error occurs mid-loop? Or just log it.
       // overlaySeriesList = [];
     }
     return overlaySeriesList;
  }

  // *** MODIFIED: Expanded function formatting for clarity ***
  function createLegend(chart, root, mainLineSeries, fillSeriesToToggle, barsSeries, otherSeries) {
     // Combine all series that should appear in the legend
     const legendSeries = [mainLineSeries];
     // Only add barsSeries if it exists (was successfully created)
     if (barsSeries) {
         legendSeries.push(barsSeries);
     }
     // Add all valid overlay series
     legendSeries.push(...otherSeries);


     if (legendSeries.length <= 1) { // Don't create legend if only main series exists
         return null;
     }

     var legend = chart.children.push(am5.Legend.new(root, {
         centerX: am5.p50,
         x: am5.p50,
         layout: am5.GridLayout.new(root, { maxColumns: 3 }), // Arrange in grid
         marginTop: 15,
         marginBottom: 15
     }));

     // Add hint label below legend (position adjusted dynamically)
     let hintLabel = am5.Label.new(root, {
         text: "(Click legend items to toggle visibility)",
         fontSize: "0.75em",
         fill: am5.color(hintLabelColorHex),
         centerX: am5.p50,
         x: am5.p50,
         paddingTop: 5 // Initial padding, will be adjusted
     });
     chart.children.push(hintLabel);

     // Adjust hint label position when legend size changes
     legend.events.on("boundschanged", function(ev) {
        let legendHeight = ev.target.height();
        let verticalOffset = 2; // Small gap between legend and hint
        hintLabel.set("paddingTop", legendHeight + verticalOffset);
        hintLabel.set("dy", legendHeight + verticalOffset); // Use dy for positioning relative to the legend's bottom edge
     });

     // Set the data for the legend
     legend.data.setAll(legendSeries);

     // Link primary line toggle to its fill series toggle
     legend.itemContainers.template.events.on("click", function(ev) {
        if (!ev.target.dataItem || !ev.target.dataItem.dataContext) return; // Ensure we have context
        const clickedSeries = ev.target.dataItem.dataContext;

        // If the main line series was clicked...
        if (clickedSeries === mainLineSeries && fillSeriesToToggle) {
            // Use setTimeout to allow amCharts internal state update after click
            setTimeout(() => {
                 // Check the visibility state *after* the click event has processed
                 if (mainLineSeries.isHidden() || !mainLineSeries.get("visible")) {
                    fillSeriesToToggle.hide(0); // Hide fill instantly if line is hidden
                 } else {
                    fillSeriesToToggle.show(0); // Show fill instantly if line is shown
                 }
            }, 0); // Execute slightly after the current call stack clears
        }
     });

     return legend;
  }

  // *** MODIFIED: Expanded function formatting for clarity ***
  function configureChart(chart, root, yAxis, xAxis, label) {
    // Add Cursor for tooltips
    var cursor = chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "none" })); // "none" prevents zooming on click/drag
    cursor.lineY.set("visible", false); // Hide vertical cursor line

    // Add Y-axis label
    yAxis.children.unshift(am5.Label.new(root, {
      rotation: -90,
      text: "Average " + label + " Points",
      y: am5.p50,
      centerX: am5.p50,
      paddingRight: 10 // Add some space from the axis line
    }));

     // Add X-axis label
    xAxis.children.push(am5.Label.new(root, {
      text: "Time of Day",
      x: am5.p50,
      centerX: am5.percent(50),
      paddingTop: 10 // Add some space from the axis line/labels
    }));


    // Add scrollbar
    chart.set("scrollbarX", am5.Scrollbar.new(root, {
      orientation: "horizontal",
      marginBottom: 65 // Position below X-axis labels/title
    }));
  }


  // --- Main Execution Flow ---
  const { primaryData, parsedOverlayData, hasValidOverlay } = parseChartData(primaryDataString, overlayString);
  const xAxisData = prepareAxisCategories(primaryData);
  const { chart, xAxis, yAxis } = createChartAndAxes(root, xAxisData);

  const primarySeriesRefs = createPrimarySeries(chart, root, primaryData, xAxis, yAxis);
  const overlaySeries = createOverlaySeries(chart, root, parsedOverlayData, overlayColors, xAxis, yAxis);

  // Define which series the buttons will control (Bars + All Overlays)
  // Important: Check if barsSeries exists before adding it
  const toggleableSeries = [];
  if (primarySeriesRefs.bars) {
      toggleableSeries.push(primarySeriesRefs.bars);
  }
  toggleableSeries.push(...overlaySeries);


  // Set initial visibility: Main line/fill ON, others OFF
  primarySeriesRefs.line.show(0);
  if (primarySeriesRefs.fill) primarySeriesRefs.fill.show(0); // Show fill only if it exists

  toggleableSeries.forEach(series => {
      if (series) { // Ensure series object is valid
          series.hide(0); // Hide initially without animation
      }
  });

  // Create the legend AFTER creating series and setting initial visibility.
  createLegend(chart, root, primarySeriesRefs.line, primarySeriesRefs.fill, primarySeriesRefs.bars, overlaySeries);

  // Configure remaining chart elements (Axis titles, cursor, scrollbar)
  configureChart(chart, root, yAxis, xAxis, chartTypeLabel);

  // --- Button Event Listeners ---
  const toggleOnButton = document.getElementById('toggleOnBtn');
  const toggleOffButton = document.getElementById('toggleOffBtn');

  if (toggleOnButton) {
      toggleOnButton.addEventListener('click', () => {
          toggleableSeries.forEach(series => {
              if (series) {
                  series.show(); // Use default animation
              }
          });
      });
  }

  if (toggleOffButton) {
      toggleOffButton.addEventListener('click', () => {
          toggleableSeries.forEach(series => {
              if (series) {
                  series.hide(); // Use default animation
              }
          });
      });
  }

}); // end am5.ready()
</script>

</body>
</html>`;

  // --- Encode and Return URI ---
  const encodedHtml = encodeURIComponent(ht);
  const dataUri = `data:text/html;charset=utf-8,${encodedHtml}`;
  return dataUri;
}
