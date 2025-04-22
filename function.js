window.function = function (data, overlayDataJson, intervalName, width, height, type) {

  console.log("[window.function] Start");
  console.log("[window.function] Input data.value:", data.value ? data.value.substring(0, 100) + '...' : 'undefined'); // Log truncated input
  console.log("[window.function] Input overlayDataJson.value:", overlayDataJson.value ? overlayDataJson.value.substring(0, 100) + '...' : 'undefined'); // Log truncated input
  console.log("[window.function] Input intervalName.value:", intervalName.value);
  console.log("[window.function] Input width.value:", width.value);
  console.log("[window.function] Input height.value:", height.value);
  console.log("[window.function] Input type.value:", type.value);

  // --- Input Handling & Cleaning ---
  let dataStringValue = data.value ?? '[]';
  let overlayDataJsonStringValue = overlayDataJson.value ?? '[]';
  let intervalNameValue = intervalName.value ?? "Period";
  let chartWidth = width.value ?? 100;
  let chartHeight = height.value ?? 550;
  let chartTypeLabel = type.value ?? "Value";
  let cleanedDataString = '[]';

  console.log("[window.function] Starting primary data cleaning...");
  let tempString = ''; // Define tempString outside try for logging in catch
  try {
    tempString = dataStringValue.trim();
    console.log("[window.function][Clean] Trimmed:", tempString.substring(0, 100) + '...');
    tempString = tempString.replace(/strokeSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    tempString = tempString.replace(/fillSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    tempString = tempString.replace(/bulletSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    console.log("[window.function][Clean] After settings removal:", tempString.substring(0, 100) + '...');
    tempString = tempString.replace(/,\s*(\})/g, '$1'); // Remove trailing commas before }
    console.log("[window.function][Clean] After trailing comma removal:", tempString.substring(0, 100) + '...');
    tempString = tempString.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3'); // Quote unquoted keys
    console.log("[window.function][Clean] After key quoting:", tempString.substring(0, 100) + '...');
    if (tempString && !tempString.startsWith('[')) { tempString = '[' + tempString; console.log("[window.function][Clean] Added opening bracket."); }
    if (tempString && !tempString.endsWith(']')) { tempString = tempString + ']'; console.log("[window.function][Clean] Added closing bracket."); }
     if (!tempString || tempString === "[]" || tempString === "") {
         console.log("[window.function][Clean] Data string is empty or '[]', defaulting to '[]'.");
         cleanedDataString = '[]';
     }
     else {
         console.log("[window.function][Clean] Attempting JSON.parse validation...");
         JSON.parse(tempString); // Validate if it's parsable JSON
         cleanedDataString = tempString;
         console.log("[window.function][Clean] Primary data string cleaned and potentially valid JSON.");
     }
  } catch (cleaningError) {
    console.error("[window.function] !!! Failed to clean or validate primary data string !!!", cleaningError);
    console.error("[window.function] Original primary data string (truncated):", dataStringValue.substring(0, 500) + '...');
    console.error("[window.function] String after cleaning attempt (truncated):", tempString.substring(0, 500) + '...'); // Log the problematic string
    cleanedDataString = '[]'; // Default to empty on error
  }
  console.log("[window.function] Final cleaned primary data string:", cleanedDataString.substring(0, 200) + '...'); // Log truncated final


  // --- HTML Template ---
  // Using backticks for the main HTML template
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

  console.log("[am5.ready] invoked.");

  // --- Configuration & Data ---
  // These variables are correctly interpolated from the outer scope using ${...}
  const primaryDataString = ${JSON.stringify(cleanedDataString)};
  const overlayString = ${JSON.stringify(overlayDataJsonStringValue)};
  const intervalName = ${JSON.stringify(intervalNameValue)};
  const chartTypeLabel = ${JSON.stringify(chartTypeLabel)};
  const overlayColors = { "This Week": "#228B22", "Last Week": "#FFA500", "2 Weeks Ago": "#800080", "3 Weeks Ago": "#DC143C" }; // Add more if needed
  const primaryOutlineColor = "#09077b";
  const primaryFillColor = "#b6dbee";
  const positiveValue2Color = "#052f20";
  const negativeValue2Color = "#78080e";
  const tooltipFontSize = "0.8em";

  console.log("[am5.ready] Configuration set.");
  console.log("[am5.ready] primaryDataString (input to parse):", primaryDataString ? primaryDataString.substring(0, 150) + '...' : 'empty');
  console.log("[am5.ready] overlayString (input to parse):", overlayString ? overlayString.substring(0, 150) + '...' : 'empty');
  console.log("[am5.ready] intervalName:", intervalName);
  console.log("[am5.ready] chartTypeLabel:", chartTypeLabel);

  // --- Root Element and Theme ---
  console.log("[am5.ready] Creating root element...");
  var root = am5.Root.new("chartdiv");
  root.setThemes([am5themes_Animated.new(root)]);
  console.log("[am5.ready] Root element created and theme set.");

  // --- Data Parsing Function ---
  // Defined WITHIN the script tag
  function parseChartData(primaryStr, overlayStr) {
    console.log("[parseChartData] Start");
    console.log("[parseChartData] Input primaryStr:", primaryStr ? primaryStr.substring(0, 150) + '...' : 'empty');
    console.log("[parseChartData] Input overlayStr:", overlayStr ? overlayStr.substring(0, 150) + '...' : 'empty');

    let primaryData = [];
    let parsedOverlayData = null;
    let hasValidOverlay = false;

    // Parse Primary Data
    console.log("[parseChartData] Parsing primary data...");
    try {
      let rawPrimary = JSON.parse(primaryStr);
      console.log("[parseChartData] Primary JSON parsed successfully. Type:", Array.isArray(rawPrimary) ? 'Array' : typeof rawPrimary);
      if (Array.isArray(rawPrimary)) {
        primaryData = rawPrimary.map((item, index) => {
          // console.log('[parseChartData] Processing primary item ' + index + ':', item); // Log each item (can be verbose) - USING CONCATENATION
          if (!(item && typeof item === 'object' && item.hasOwnProperty('time') && typeof item.time === 'string' && item.hasOwnProperty('value') && typeof item.value === 'number')) {
             // *** FIXED LINE: Using standard string concatenation (+) instead of nested backticks ***
             console.warn('[parseChartData] Invalid primary item format at index ' + index + ':', item);
             return null;
          }
          if (item.hasOwnProperty('value2') && typeof item.value2 !== 'number') {
            // Using template literal here is fine as it's NOT nested within the outer ht literal scope
            console.log(\`[parseChartData] Removing non-numeric value2 from item \${index}.\`);
            delete item.value2;
          }
          return item;
        }).filter(item => item !== null);
        console.log("[parseChartData] Primary data filtered. Valid items count:", primaryData.length);
      } else {
        console.warn("[parseChartData] Parsed primary data is not an array.");
        primaryData = [];
      }
    } catch (e) {
      console.error("[parseChartData] Error parsing primary data JSON:", e);
      console.error("[parseChartData] Faulty primaryStr (truncated):", primaryStr ? primaryStr.substring(0, 500)+'...' : 'empty/null');
      primaryData = [];
    }

    // Parse Overlay Data (NEW FORMAT: Array of single-key objects)
    console.log("[parseChartData] Parsing overlay data...");
    try {
        if (overlayStr && overlayStr.trim() !== "" && overlayStr.trim() !== "[]") {
            let rawOverlayArray = JSON.parse(overlayStr);
            console.log("[parseChartData] Overlay JSON parsed successfully. Type:", Array.isArray(rawOverlayArray) ? 'Array' : typeof rawOverlayArray);

            if (Array.isArray(rawOverlayArray)) {
                parsedOverlayData = {};
                let validKeysFound = 0;
                // Using template literal here is fine
                console.log(\`[parseChartData] Processing \${rawOverlayArray.length} potential overlay series objects.\`);

                for (const seriesObject of rawOverlayArray) {
                    // Using concatenation for safety, though template literal might be okay here too
                    console.log("[parseChartData][OverlayLoop] Processing series object:", JSON.stringify(seriesObject).substring(0,100) + '...');
                    if (seriesObject && typeof seriesObject === 'object' && !Array.isArray(seriesObject) && Object.keys(seriesObject).length === 1) {
                        const key = Object.keys(seriesObject)[0];
                        const weekDataRaw = seriesObject[key];
                        // Using template literal here is fine
                        console.log(\`[parseChartData][OverlayLoop] Extracted key: "\${key}". Checking data type:\`, Array.isArray(weekDataRaw) ? 'Array' : typeof weekDataRaw);

                        if(Array.isArray(weekDataRaw)) {
                            // Using template literal here is fine
                            console.log(\`[parseChartData][OverlayLoop] Filtering data for key "\${key}". Raw item count: \${weekDataRaw.length}\`);
                            const processedWeekData = weekDataRaw.filter((item, index) => {
                                const isValid = item && typeof item === 'object' &&
                                      item.hasOwnProperty('time') && typeof item.time === 'string' &&
                                      item.hasOwnProperty('value') && typeof item.value === 'number';
                                // if (!isValid) { console.warn('[parseChartData][OverlayLoop] Invalid item in "' + key + '" at index ' + index + ':', item); } // Verbose log - CONCATENATION
                                return isValid;
                            }).map(item => ({ time: item.time, value: item.value }));

                            if (processedWeekData.length > 0) {
                                parsedOverlayData[key] = processedWeekData;
                                validKeysFound++;
                                // Using template literal here is fine
                                console.log(\`[parseChartData][OverlayLoop] Parsed overlay data for key "\${key}" successfully. Valid items: \${processedWeekData.length}\`);
                            } else {
                                // Using template literal here is fine
                                console.warn(\`[parseChartData][OverlayLoop] Overlay data for key "\${key}" had no valid items after filtering.\`);
                            }
                        } else {
                             // Using template literal here is fine
                             console.warn(\`[parseChartData][OverlayLoop] Overlay data value for key "\${key}" was not an array.\`);
                        }
                    } else {
                        console.warn("[parseChartData][OverlayLoop] Skipping invalid item in overlay data array (not a single-key object):", JSON.stringify(seriesObject));
                    }
                } // End loop

                if (validKeysFound > 0) {
                    hasValidOverlay = true;
                    console.log("[parseChartData] Overlay data parsed from array format. Total valid series:", validKeysFound);
                } else {
                    console.warn("[parseChartData] Overlay data array parsed, but no valid series/data found.");
                    parsedOverlayData = null;
                }

            } else {
                 console.warn("[parseChartData] Parsed overlay data JSON is not an array as expected.");
                 parsedOverlayData = null;
            }
        } else {
            console.log("[parseChartData] No overlay data string provided or it was empty '[]'.");
        }
    } catch (e) {
        console.error("[parseChartData] Error parsing overlay JSON:", e);
        console.error("[parseChartData] Faulty overlayStr (truncated):", overlayStr ? overlayStr.substring(0, 500)+'...' : 'empty/null');
        parsedOverlayData = null;
        hasValidOverlay = false;
    }

    console.log("[parseChartData] Finished parsing.");
    console.log("[parseChartData] Returning primaryData length:", primaryData.length);
    console.log("[parseChartData] Returning parsedOverlayData keys:", parsedOverlayData ? Object.keys(parsedOverlayData) : 'null');
    console.log("[parseChartData] Returning hasValidOverlay:", hasValidOverlay);
    return { primaryData, parsedOverlayData, hasValidOverlay };
  }


  // --- Axis Category Preparation ---
  // (Code remains the same - uses template literals appropriately)
  function prepareAxisCategories(primaryData) {
     console.log("[prepareAxisCategories] Start. Input primaryData length:", primaryData ? primaryData.length : 'null/undefined');
     if (!primaryData || primaryData.length === 0) { console.warn("[prepareAxisCategories] Primary data is empty, axis will be empty."); return []; }
     try {
       console.log("[prepareAxisCategories] Preparing axis categories assuming input primary data is sorted.");
       let categoryStrings = primaryData.map(item => item.time);
       console.log("[prepareAxisCategories] Extracted category strings count:", categoryStrings.length);
       let uniqueCategoryStrings = categoryStrings.filter((value, index, self) => self.indexOf(value) === index);
       console.log("[prepareAxisCategories] Unique category strings count:", uniqueCategoryStrings.length);
       let xAxisData = uniqueCategoryStrings.map(timeStr => ({ time: timeStr }));
       console.log("[prepareAxisCategories] Final xAxisData prepared count:", xAxisData.length);
       return xAxisData;
     } catch (e) {
       console.error("[prepareAxisCategories] Error preparing axis categories:", e);
       return [];
     }
   }

  // --- Chart and Axes Creation ---
  // (Code remains the same)
  function createChartAndAxes(root, xAxisData) {
    console.log("[createChartAndAxes] Start. Input xAxisData length:", xAxisData ? xAxisData.length : 'null/undefined');
    console.log("[createChartAndAxes] Creating XYChart...");
    var chart = root.container.children.push(am5xy.XYChart.new(root, { panX: true, panY: true, wheelX: "panX", wheelY: "zoomX", layout: root.verticalLayout, pinchZoomX: true }));
    console.log("[createChartAndAxes] Creating X Axis Renderer...");
    var xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 70 });
    xRenderer.labels.template.setAll({ fontSize: 8, rotation: -90, centerY: am5.p50, centerX: am5.p100, paddingRight: 5 });
    console.log("[createChartAndAxes] Creating X CategoryAxis...");
    var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, { categoryField: "time", renderer: xRenderer, tooltip: am5.Tooltip.new(root, {}) }));
    if (xAxisData && xAxisData.length > 0) {
      console.log("[createChartAndAxes] Setting data on X-Axis...");
      xAxis.data.setAll(xAxisData);
      // Using template literal here is fine
      console.log(\`[createChartAndAxes] Set \${xAxisData.length} categories on X-Axis.\`);
    } else {
      console.warn("[createChartAndAxes] X-Axis has no data categories to set.");
    }
    console.log("[createChartAndAxes] Creating Y Axis Renderer...");
    var yRenderer = am5xy.AxisRendererY.new(root, {});
    console.log("[createChartAndAxes] Creating Y ValueAxis...");
    var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { maxPrecision: 2, renderer: yRenderer }));
    console.log("[createChartAndAxes] Chart and axes creation complete.");
    return { chart, xAxis, yAxis };
   }


  // --- Primary Series Creation ---
  // (Code remains the same - uses template literals appropriately)
   function createPrimarySeries(chart, root, primaryData, xAxis, yAxis) {
    console.log("[createPrimarySeries] Start. Input primaryData length:", primaryData ? primaryData.length : 'null/undefined');
    let lineSeries, fillSeries, value2Series;

    // 1. Area Fill Series
    console.log("[createPrimarySeries] Creating Fill ColumnSeries (Value)...");
    fillSeries = chart.series.push(am5xy.ColumnSeries.new(root, {
        name: intervalName + " (Fill)", xAxis: xAxis, yAxis: yAxis, valueYField: "value", categoryXField: "time",
        fill: am5.color(primaryFillColor), strokeOpacity: 0, width: am5.percent(100),
        sequencedInterpolation: true, sequencedInterpolationDelay: 10,
        tooltip: am5.Tooltip.new(root, { labelText:"_hidden", populateText: false }),
        toggleable: false,
    }));
    console.log("[createPrimarySeries] Setting data for Fill Series...");
    fillSeries.data.setAll(primaryData);
    console.log("[createPrimarySeries] Fill Series created.");
    // fillSeries.appear(1000); // Controlled by line series toggle now

    // 2. Value2 Bar Series
    console.log("[createPrimarySeries] Creating Value2 ColumnSeries (Cumulative)...");
    value2Series = chart.series.push(am5xy.ColumnSeries.new(root, {
      name: intervalName + " (Cumulative)",
      xAxis: xAxis, yAxis: yAxis, valueYField: "value2", categoryXField: "time",
      sequencedInterpolation: true, sequencedInterpolationDelay: 10,
      tooltip: am5.Tooltip.new(root, {
          getFillFromSprite: false, labelTextColor: am5.color(0xffffff), fontSize: tooltipFontSize,
          background: am5.RoundedRectangle.new(root, { fill: am5.color(0xffffff) }),
          labelText: intervalName + " (Cumulative): {valueY.formatNumber('#.##')}" // amCharts handles {placeholders}
      })
    }));
    // Adapters... (Logs inside adapters can be very noisy, usually omitted unless debugging them specifically)
    value2Series.columns.template.adapters.add("fill", function(fill, target) { const v2 = target.dataItem?.get("valueY"); return typeof v2 === 'number'?(v2<0?am5.color(negativeValue2Color):am5.color(positiveValue2Color)):am5.color(0xffffff, 0); });
    value2Series.columns.template.adapters.add("stroke", function(stroke, target) { const v2 = target.dataItem?.get("valueY"); return typeof v2 === 'number'?(v2<0?am5.color(negativeValue2Color):am5.color(positiveValue2Color)):am5.color(0xffffff, 0); });
    value2Series.get("tooltip").get("background").adapters.add("fill", function(fill, target) { const dataItem = target.dataItem; if (dataItem) { const v2 = dataItem.get("valueY"); return typeof v2 === 'number' ? (v2 < 0 ? am5.color(negativeValue2Color) : am5.color(positiveValue2Color)) : am5.color("#888888"); } return fill; });
    value2Series.columns.template.setAll({ strokeWidth: 1, strokeOpacity: 0.7, width: am5.percent(60), cornerRadiusTL: 3, cornerRadiusTR: 3 });
    console.log("[createPrimarySeries] Setting data for Value2 Series...");
    value2Series.data.setAll(primaryData);
    console.log("[createPrimarySeries] Making Value2 Series appear...");
    value2Series.appear(1000);
    console.log("[createPrimarySeries] Value2 Series created.");

    // 3. Area Line Series
    console.log("[createPrimarySeries] Creating LineSeries (Value)...");
    lineSeries = chart.series.push(am5xy.LineSeries.new(root, {
      name: intervalName, xAxis: xAxis, yAxis: yAxis, valueYField: "value", categoryXField: "time",
      stroke: am5.color(primaryOutlineColor), fillOpacity: 0, connect: false,
      tooltip: am5.Tooltip.new(root, {
          getFillFromSprite: true, labelTextColor: am5.color(0xffffff), fontSize: tooltipFontSize,
          labelText: intervalName + ": {valueY.formatNumber('#.00')}" // amCharts handles {placeholders}
      })
    }));
    lineSeries.strokes.template.set("strokeWidth", 2);
    console.log("[createPrimarySeries] Setting data for Line Series...");
    lineSeries.data.setAll(primaryData);
    console.log("[createPrimarySeries] Making Line Series appear...");
    lineSeries.appear(1000);
    console.log("[createPrimarySeries] Line Series created.");

    // Show fill series initially
    console.log("[createPrimarySeries] Showing Fill Series initially.");
    fillSeries.show(0);

    console.log("[createPrimarySeries] Finished creating primary series.");
    const refs = { line: lineSeries, fill: fillSeries, bars: value2Series };
    console.log("[createPrimarySeries] Returning series references:", Object.keys(refs));
    return refs;
  }


  // --- Overlay Series Creation ---
  // (Code remains the same - uses template literals appropriately)
  function createOverlaySeries(chart, root, overlayData, colors, xAxis, yAxis) {
     console.log("[createOverlaySeries] Start. Input overlayData keys:", overlayData ? Object.keys(overlayData) : 'null');
     let overlaySeriesList = [];
     if (!overlayData) { console.log("[createOverlaySeries] No valid overlay data provided, returning empty list."); return overlaySeriesList; }

     console.log("[createOverlaySeries] Looping through overlay data keys...");
     try {
       for (const weekKey in overlayData) {
         if (Object.hasOwnProperty.call(overlayData, weekKey)) {
           const weekData = overlayData[weekKey];
           const color = colors[weekKey] || root.interfaceColors.get("grid");
           // Using template literal here is fine
           console.log(\`[createOverlaySeries] Creating LineSeries for key: "\${weekKey}" with \${weekData.length} items. Color: \${color.toString()}\`);

           var lineSeries = chart.series.push(am5xy.LineSeries.new(root, {
               name: weekKey,
               xAxis: xAxis, yAxis: yAxis,
               valueYField: "value", categoryXField: "time",
               stroke: color,
               connect: false,
               tooltip: am5.Tooltip.new(root, {
                   getFillFromSprite: true, labelTextColor: am5.color(0xffffff),
                   fontSize: tooltipFontSize, labelText: "{name}: {valueY.formatNumber('#.00')}" // amCharts handles {placeholders}
               })
           }));
           lineSeries.strokes.template.set("strokeWidth", 2);
           // Using template literal here is fine
           console.log(\`[createOverlaySeries] Setting data for "\${weekKey}" series...\`);
           lineSeries.data.setAll(weekData);
           // Using template literal here is fine
           console.log(\`[createOverlaySeries] Making "\${weekKey}" series appear...\`);
           lineSeries.appear(1000);
           overlaySeriesList.push(lineSeries);
           // Using template literal here is fine
           console.log(\`[createOverlaySeries] Series for "\${weekKey}" created and added.\`);
         }
       }
     } catch (e) {
       console.error("[createOverlaySeries] Error creating overlay series:", e);
     }
     console.log("[createOverlaySeries] Overlay series creation finished. Total series created:", overlaySeriesList.length);
     return overlaySeriesList;
   }

  // --- Legend Creation & Linking ---
  // (Code remains the same - uses template literals appropriately)
  function createLegend(chart, root, mainLineSeries, fillSeriesToToggle, barsSeries, otherSeries) {
     console.log("[createLegend] Start.");
     console.log("[createLegend] mainLineSeries name:", mainLineSeries ? mainLineSeries.get('name') : 'N/A');
     console.log("[createLegend] fillSeriesToToggle provided:", !!fillSeriesToToggle);
     console.log("[createLegend] barsSeries name:", barsSeries ? barsSeries.get('name') : 'N/A');
     console.log("[createLegend] otherSeries count:", otherSeries ? otherSeries.length : 'N/A');

     const legendSeries = [mainLineSeries, barsSeries, ...otherSeries].filter(s => !!s); // Filter out any potentially null series
     console.log("[createLegend] Combined series for legend data (names):", legendSeries.map(s => s.get('name')));

     if (legendSeries.length === 0) { console.log("[createLegend] Skipping legend creation (no series)."); return null; }

     console.log("[createLegend] Creating legend container...");
     var legendContainer = chart.children.push(am5.Container.new(root, {
        width: am5.percent(100), layout: root.verticalLayout,
        x: am5.p50, centerX: am5.p50, paddingBottom: 10
     }));

     console.log("[createLegend] Creating legend...");
     var legend = legendContainer.children.push(am5.Legend.new(root, {
         x: am5.percent(50), centerX: am5.percent(50), layout: root.horizontalLayout,
         marginTop: 5, marginBottom: 5
     }));

     console.log("[createLegend] Creating hint label...");
     legendContainer.children.push(am5.Label.new(root, {
         text: "(Click legend items to toggle visibility)", fontSize: "0.75em",
         fill: am5.color(0x888888), x: am5.p50, centerX: am5.p50
     }));

     console.log("[createLegend] Setting data on legend...");
     legend.data.setAll(legendSeries);
     console.log("[createLegend] Legend data set.");

     console.log("[createLegend] Attaching click event listener to legend items...");
     legend.itemContainers.template.events.on("click", function(ev) {
        const clickedSeries = ev.target.dataItem?.dataContext;
        if (!clickedSeries) return;

        const clickedSeriesName = clickedSeries.get("name");
        // Using template literal here is fine
        console.log(\`[createLegend][Click] Clicked legend item: "\${clickedSeriesName}"\`);

        // Check if the clicked item is the main line series for linked toggling
        if (clickedSeries === mainLineSeries) {
            // Using template literal here is fine
            console.log(\`[createLegend][Click] Clicked item is the main line series ("\${mainLineSeries.get('name')}").\`);
            // Use setTimeout to allow the default toggle action to complete first
            setTimeout(() => {
                 const isHidden = mainLineSeries.isHidden(); // Check visibility *after* the default toggle
                 // Using template literal here is fine
                 console.log(\`[createLegend][Click][Timeout] Main line series "\${mainLineSeries.get('name')}" is now \${isHidden ? 'hidden' : 'visible'}.\`);
                 if (isHidden) {
                    console.log('[createLegend][Click][Timeout] Hiding linked fill series.'); // Simple string
                    fillSeriesToToggle.hide();
                 } else {
                    console.log('[createLegend][Click][Timeout] Showing linked fill series.'); // Simple string
                    fillSeriesToToggle.show();
                 }
            }, 0);
        } else {
            // Using template literal here is fine
            console.log(\`[createLegend][Click] Clicked item "\${clickedSeriesName}" is not the main line series, default toggle applies.\`);
        }
     });

     console.log("[createLegend] Legend created and toggle listener attached.");
     return legend;
   }

  // --- Final Chart Configuration ---
  // (Code remains the same)
  function configureChart(chart, root, yAxis, xAxis, label) {
      console.log("[configureChart] Start.");
      console.log("[configureChart] Creating XYCursor...");
      var cursor = chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "none" }));
      cursor.lineY.set("visible", false);
      console.log("[configureChart] Cursor created, Y line hidden.");

      console.log("[configureChart] Adding Y-Axis Label:", "Average " + label + " Points");
      yAxis.children.unshift(am5.Label.new(root, {
          rotation: -90, text: "Average " + label + " Points",
          y: am5.p50, centerX: am5.p50, paddingRight: 10
      }));

      console.log("[configureChart] Adding X-Axis Label:", "Time of Day");
      xAxis.children.push(am5.Label.new(root, {
          text: "Time of Day", x: am5.p50, centerX: am5.percent(50), paddingTop: 10
      }));

      console.log("[configureChart] Setting X Scrollbar...");
      chart.set("scrollbarX", am5.Scrollbar.new(root, {
          orientation: "horizontal", marginBottom: 25
      }));

      console.log("[configureChart] Making chart appear...");
      chart.appear(1000, 100);
      console.log("[configureChart] Configuration complete.");
  }


  // --- Main Execution Flow ---
  console.log("[Main Flow] --- Starting Chart Build Process ---");

  console.log("[Main Flow] Calling parseChartData...");
  const { primaryData, parsedOverlayData, hasValidOverlay } = parseChartData(primaryDataString, overlayString);
  console.log("[Main Flow] parseChartData returned.");
  console.log("[Main Flow] -> primaryData length:", primaryData.length);
  console.log("[Main Flow] -> parsedOverlayData keys:", parsedOverlayData ? Object.keys(parsedOverlayData) : 'null');
  console.log("[Main Flow] -> hasValidOverlay:", hasValidOverlay);

  console.log("[Main Flow] Calling prepareAxisCategories...");
  const xAxisData = prepareAxisCategories(primaryData);
  console.log("[Main Flow] prepareAxisCategories returned xAxisData length:", xAxisData.length);

  console.log("[Main Flow] Calling createChartAndAxes...");
  const { chart, xAxis, yAxis } = createChartAndAxes(root, xAxisData);
  console.log("[Main Flow] createChartAndAxes returned.");

  console.log("[Main Flow] Calling createPrimarySeries...");
  const primarySeriesRefs = createPrimarySeries(chart, root, primaryData, xAxis, yAxis);
  console.log("[Main Flow] createPrimarySeries returned refs:", primarySeriesRefs ? Object.keys(primarySeriesRefs) : 'null');

  console.log("[Main Flow] Calling createOverlaySeries...");
  const overlaySeries = createOverlaySeries(chart, root, parsedOverlayData, overlayColors, xAxis, yAxis);
  console.log("[Main Flow] createOverlaySeries returned series count:", overlaySeries.length);

  console.log("[Main Flow] Calling createLegend...");
  // Ensure all required refs are passed correctly
  const legendInstance = createLegend(chart, root, primarySeriesRefs?.line, primarySeriesRefs?.fill, primarySeriesRefs?.bars, overlaySeries);
  console.log("[Main Flow] createLegend returned:", legendInstance ? 'Legend Instance' : 'null');

  console.log("[Main Flow] Calling configureChart...");
  configureChart(chart, root, yAxis, xAxis, chartTypeLabel);
  console.log("[Main Flow] configureChart finished.");

  console.log("[Main Flow] --- Chart Build Process Complete ---");

}); // end am5.ready()
</script>

</body>
</html>`; // End of the main 'ht' template literal

  // --- Encode and Return URI ---
  console.log("[window.function] Encoding HTML and creating data URI...");
  const encodedHtml = encodeURIComponent(ht);
  const dataUri = `data:text/html;charset=utf-8,${encodedHtml}`;
  console.log("[window.function] Finished. Returning data URI.");
  return dataUri;
}
