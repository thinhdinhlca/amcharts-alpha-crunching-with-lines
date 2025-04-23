window.function = function (data, overlayDataJson, intervalName, width, height, type) { // Added intervalName parameter

  // --- Input Handling & Cleaning ---
  let dataStringValue = data.value ?? '[]';
  let overlayDataJsonStringValue = overlayDataJson.value ?? '{}';
  let intervalNameValue = intervalName.value ?? "Period"; // Default to "Period"
  let chartWidth = width.value ?? 100;
  let chartHeight = height.value ?? 550;
  let chartTypeLabel = type.value ?? "Value";
  let cleanedDataString = '[]';
  try {
    let tempString = dataStringValue.trim();
    // Remove settings blocks that often cause JSON parsing issues if malformed
    tempString = tempString.replace(/strokeSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    tempString = tempString.replace(/fillSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    tempString = tempString.replace(/bulletSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    // Remove trailing commas before closing braces
    tempString = tempString.replace(/,\s*(\})/g, '$1');
    // Ensure keys are quoted
    tempString = tempString.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');
    // Attempt to wrap in brackets if missing (basic check)
    if (tempString && !tempString.startsWith('[')) { tempString = '[' + tempString; }
    if (tempString && !tempString.endsWith(']')) { tempString = tempString + ']'; }
     // Final check for empty or invalid state
     if (!tempString || tempString === "[]" || tempString === "") { cleanedDataString = '[]'; }
     else { JSON.parse(tempString); cleanedDataString = tempString; console.log("DEBUG: Cleaned primary data string potentially valid JSON."); } // Console log
  } catch (cleaningError) { console.error("!!! Failed to clean primary data string !!!", cleaningError); cleanedDataString = '[]'; }
  console.log("DEBUG: Final string for primary data:", cleanedDataString); // Console log


  // --- HTML Template ---
  // Using double quotes for the outer string and concatenation
  let ht = "<!DOCTYPE html>"
  + "<html>"
  + "<head>"
  + "  <meta charset=\"utf-8\">"
  + "  <title>Glide Yes-Code Chart</title>"
  + "  <script src=\"https://cdn.amcharts.com/lib/5/index.js\"></script>"
  + "  <script src=\"https://cdn.amcharts.com/lib/5/xy.js\"></script>"
  + "  <script src=\"https://cdn.amcharts.com/lib/5/themes/Animated.js\"></script>"
  + "  <style>"
  + "    html, body { margin: 0; padding: 0; height: 100%; width: 100%; }"
  + "    #chartdiv { width: " + chartWidth + "%; height: " + chartHeight + "px; }" // Concatenation
  + "    .am5-tooltip {"
  + "      font-size: 0.85em;"
  + "      pointer-events: none;"
  + "    }"
  + "  </style>"
  + "</head>"
  + "<body>"
  + "  <div id=\"chartdiv\"></div>"
  + "<script>" // Start of inline script

  // --- am5.ready function ---
  + "am5.ready(function() {"
  + "  console.log(\"am5.ready() invoked.\");" // Console log

  // --- Configuration & Data ---
  // Using JSON.stringify for safety with dynamic data
  + "  const primaryDataString = " + JSON.stringify(cleanedDataString) + ";"
  + "  const overlayString = " + JSON.stringify(overlayDataJsonStringValue) + ";"
  + "  const intervalName = " + JSON.stringify(intervalNameValue) + ";"
  + "  const chartTypeLabel = " + JSON.stringify(chartTypeLabel) + ";"
  + "  const localStorageKey = \"glideChartVisibility_SPX_Weekly\";" // Standard string

  + "  const overlayColors = { \"This Week\": \"#228B22\", \"Last Week\": \"#FFA500\", \"2 Weeks Ago\": \"#800080\", \"3 Weeks Ago\": \"#DC143C\", \"Default\": \"#888888\" };" // Using escaped double quotes
  + "  const primaryOutlineColor = \"#09077b\";"
  + "  const primaryFillColor = \"#b6dbee\";"
  + "  const primaryValue2TooltipBgColor = \"#333333\";"
  + "  const positiveValue2Color = \"#052f20\";"
  + "  const negativeValue2Color = \"#78080e\";"
  + "  const tooltipFontSize = \"0.6em\";"
  + "  const whiteColorHex = \"#ffffff\";"
  + "  const blackColorHex = \"#000000\";"
  + "  const hintLabelColorHex = \"#888888\";"
  + "  const transparentWhiteHex = \"#ffffff\";"

  // --- Persistence Helper Functions ---
  + "  function readVisibilityState() {"
  + "    try {"
  + "      const storedState = localStorage.getItem(localStorageKey);"
  + "      if (storedState) {"
  + "        console.log(\"Read state from localStorage: \" + storedState);" // Console log + concatenation
  + "        return JSON.parse(storedState);"
  + "      }"
  + "    } catch (e) {"
  + "      console.error(\"Error reading or parsing localStorage state:\", e);" // Console log
  + "    }"
  + "    console.log(\"No valid state found in localStorage.\");" // Console log
  + "    return {};"
  + "  }"

  + "  function saveVisibilityState(seriesList) {"
  + "    try {"
  + "      const state = {};"
  + "      seriesList.forEach(series => {"
  + "        const seriesName = series.get(\"name\");"
  + "        if (seriesName && series.get(\"toggleable\") !== false) {"
  + "             state[seriesName] = series.get(\"visible\");"
  + "        }"
  + "      });"
  + "      localStorage.setItem(localStorageKey, JSON.stringify(state));"
  + "      console.log(\"Saved state to localStorage: \" + JSON.stringify(state));" // Console log + concatenation
  + "    } catch (e) {"
  + "      console.error(\"Error saving state to localStorage:\", e);" // Console log
  + "    }"
  + "  }"

  // --- Load Initial Visibility State ---
  + "  const initialVisibilityState = readVisibilityState();"
  + "  const hasInitialState = Object.keys(initialVisibilityState).length > 0;"
  + "  console.log(\"Initial visibility state loaded. Has stored state: \" + hasInitialState);" // Console log + concatenation


  // --- Root Element and Theme ---
  + "  var root = am5.Root.new(\"chartdiv\");"
  + "  root.setThemes([am5themes_Animated.new(root)]);"
  + "  console.log(\"Root created.\");" // Console log

  // --- Data Parsing Function ---
  + "  function parseChartData(primaryStr, overlayStr) {"
  + "     console.log(\"Parsing chart data...\");" // Console log
  + "     let primaryData = []; let parsedOverlayData = null; let hasValidOverlay = false;"
  + "     try {"
  + "       let rawPrimary = JSON.parse(primaryStr);"
  + "       if (Array.isArray(rawPrimary)) {"
  + "           primaryData = rawPrimary.map(item => {"
  + "               if (!(item && typeof item === 'object' && item.hasOwnProperty('time') && typeof item.time === 'string' && item.hasOwnProperty('value') && typeof item.value === 'number')) {"
  + "                   return null;"
  + "               }"
  + "               if (item.hasOwnProperty('value2') && typeof item.value2 !== 'number') {"
  + "                   delete item.value2;"
  + "               }"
  + "               return item;"
  + "           }).filter(item => item !== null);"
  + "           console.log(\"Primary data parsed. Valid items: \" + primaryData.length);" // Console log + concatenation
  + "       } else {"
  + "           console.warn(\"Parsed primary data is not an array.\");" // Console log
  + "           primaryData = [];"
  + "       }"
  + "     } catch (e) {"
  + "         console.error(\"Error parsing primary data JSON:\", e);" // Console log
  + "         primaryData = [];"
  + "     }"

  + "     try {"
  + "         if (overlayStr && overlayStr.trim() !== \"\" && overlayStr.trim() !== \"{}\") {" // Escaped double quotes
  + "             let rawOverlay = JSON.parse(overlayStr);"
  + "             if (typeof rawOverlay === 'object' && rawOverlay !== null && !Array.isArray(rawOverlay)) {"
  + "                 parsedOverlayData = {};"
  + "                 let validKeys = 0;"
  + "                 for (const key in rawOverlay) {"
  + "                     if (Object.hasOwnProperty.call(rawOverlay, key)) {"
  + "                         const weekDataRaw = rawOverlay[key];"
  + "                         if (Array.isArray(weekDataRaw)) {"
  + "                             const processedWeekData = weekDataRaw.filter(item =>"
  + "                                 item && typeof item === 'object' &&"
  + "                                 item.hasOwnProperty('time') && typeof item.time === 'string' &&"
  + "                                 item.hasOwnProperty('value') && typeof item.value === 'number'"
  + "                             );"
  + "                             if (processedWeekData.length > 0) {"
  + "                                 parsedOverlayData[key] = processedWeekData;"
  + "                                 validKeys++;"
  + "                             } else { console.warn(\"Overlay key '\" + key + \"' had no valid items.\"); }" // Console log + concatenation
  + "                         } else { console.warn(\"Overlay key '\" + key + \"' data is not an array.\");}" // Console log + concatenation
  + "                     }"
  + "                 }"
  + "                 if (validKeys > 0) {"
  + "                     hasValidOverlay = true;"
  + "                     console.log(\"Overlay data parsed. Valid keys: \" + validKeys);" // Console log + concatenation
  + "                 } else {"
  + "                     console.warn(\"Overlay data parsed, but no valid keys with data found.\");" // Console log
  + "                     parsedOverlayData = null;"
  + "                 }"
  + "             } else {"
  + "                 console.warn(\"Parsed overlay data is not a valid object.\");" // Console log
  + "                 parsedOverlayData = null;"
  + "             }"
  + "         } else { console.log(\"No overlay data string provided or it was empty.\"); }" // Console log
  + "     } catch (e) {"
  + "         console.error(\"Error parsing overlay JSON:\", e);" // Console log
  + "         parsedOverlayData = null;"
  + "         hasValidOverlay = false;"
  + "     }"
  + "     return { primaryData, parsedOverlayData, hasValidOverlay };"
  + "   }"

  // --- Axis Category Preparation ---
  + "  function prepareAxisCategories(primaryData) {"
  + "     console.log(\"Preparing axis categories...\");" // Console log
  + "     if (!primaryData || primaryData.length === 0) { console.warn(\"Primary data is empty, axis will be empty.\"); return []; }" // Console log
  + "     try {"
  + "       let categoryStrings = primaryData.map(item => item.time);"
  + "       let uniqueCategoryStrings = categoryStrings.filter((value, index, self) => self.indexOf(value) === index);"
  + "       let xAxisData = uniqueCategoryStrings.map(timeStr => ({ time: timeStr }));"
  + "       console.log(\"Axis categories prepared: \" + xAxisData.length);" // Console log + concatenation
  + "       return xAxisData;"
  + "     } catch (e) {"
  + "         console.error(\"Error preparing axis categories:\", e);" // Console log
  + "         return [];"
  + "     }"
  + "   }"

  // --- Chart and Axes Creation ---
  + "  function createChartAndAxes(root, xAxisData) {"
  + "    console.log(\"Creating chart and axes...\");" // Console log
  + "    var chart = root.container.children.push(am5xy.XYChart.new(root, { panX: true, panY: true, wheelX: \"panX\", wheelY: \"zoomX\", layout: root.verticalLayout, pinchZoomX: true }));" // Escaped double quotes
  + "    var xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 70 });"
  + "    xRenderer.labels.template.setAll({ fontSize: 8, rotation: -90, centerY: am5.p50, centerX: am5.p100, paddingRight: 5 });"
  + "    var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, { categoryField: \"time\", renderer: xRenderer, tooltip: am5.Tooltip.new(root, {}) }));" // Escaped double quotes
  + "    if (xAxisData.length > 0) { xAxis.data.setAll(xAxisData); console.log(\"Set \" + xAxisData.length + \" categories on X-Axis.\"); }" // Console log + concatenation
  + "    var yRenderer = am5xy.AxisRendererY.new(root, {});"
  + "    var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { maxPrecision: 2, renderer: yRenderer }));"
  + "    console.log(\"Chart and axes created.\");" // Console log
  + "    return { chart, xAxis, yAxis };"
  + "   }"


  // --- Primary Series Creation (Applies stored visibility) ---
  + "  function createPrimarySeries(chart, root, primaryData, xAxis, yAxis) {"
  + "    console.log(\"Creating primary series...\");" // Console log
  + "    let lineSeries, fillSeries, value2Series;"
  + "    const lineSeriesName = intervalName;"
  + "    const value2SeriesName = intervalName + \" (Cumulative)\";" // Concatenation

  + "    const initialLineVisible = initialVisibilityState.hasOwnProperty(lineSeriesName) ? initialVisibilityState[lineSeriesName] : true;"
  + "    const initialValue2Visible = initialVisibilityState.hasOwnProperty(value2SeriesName) ? initialVisibilityState[value2SeriesName] : true;"
  + "    console.log(\"Primary Series ('\" + lineSeriesName + \"'): Initial Visible = \" + initialLineVisible);" // Console log + concatenation
  + "    console.log(\"Primary Series ('\" + value2SeriesName + \"'): Initial Visible = \" + initialValue2Visible);" // Console log + concatenation


  + "    fillSeries = chart.series.push(am5xy.ColumnSeries.new(root, {"
  + "        name: intervalName + \" (Fill)\"," // Concatenation
  + "        xAxis: xAxis, yAxis: yAxis, valueYField: \"value\", categoryXField: \"time\"," // Escaped double quotes
  + "        fill: am5.color(primaryFillColor), strokeOpacity: 0, width: am5.percent(100),"
  + "        toggleable: false,"
  + "        visible: initialLineVisible"
  + "    }));"
  + "    fillSeries.data.setAll(primaryData);"

  + "    value2Series = chart.series.push(am5xy.ColumnSeries.new(root, {"
  + "      name: value2SeriesName,"
  + "      xAxis: xAxis, yAxis: yAxis, valueYField: \"value2\", categoryXField: \"time\"," // Escaped double quotes
  + "      visible: initialValue2Visible,"
  + "      tooltip: am5.Tooltip.new(root, {"
  + "          getFillFromSprite: false, labelTextColor: am5.color(whiteColorHex),"
  + "          fontSize: tooltipFontSize, labelText: value2SeriesName + \": {valueY.formatNumber('#.##')}\"" // Concatenation
  + "      })"
  + "    }));"
  + "    value2Series.get(\"tooltip\").get(\"background\").set(\"fill\", am5.color(primaryValue2TooltipBgColor));" // Escaped double quotes
  + "    value2Series.columns.template.adapters.add(\"fill\", function(fill, target) { const v2 = target.dataItem?.get(\"valueY\"); return typeof v2 === 'number'?(v2<0?am5.color(negativeValue2Color):am5.color(positiveValue2Color)):am5.color(transparentWhiteHex, 0); });" // Escaped double quotes
  + "    value2Series.columns.template.adapters.add(\"stroke\", function(stroke, target) { const v2 = target.dataItem?.get(\"valueY\"); return typeof v2 === 'number'?(v2<0?am5.color(negativeValue2Color):am5.color(positiveValue2Color)):am5.color(transparentWhiteHex, 0); });" // Escaped double quotes
  + "    value2Series.columns.template.setAll({ strokeWidth: 2, strokeOpacity: 1, width: am5.percent(60) });"
  + "    value2Series.data.setAll(primaryData);"
  + "    if (initialValue2Visible) value2Series.appear(1000);"

  + "    lineSeries = chart.series.push(am5xy.LineSeries.new(root, {"
  + "      name: lineSeriesName,"
  + "      xAxis: xAxis, yAxis: yAxis, valueYField: \"value\", categoryXField: \"time\"," // Escaped double quotes
  + "      stroke: am5.color(primaryOutlineColor), fillOpacity: 0,"
  + "      visible: initialLineVisible,"
  + "      connect: false,"
  + "      tooltip: am5.Tooltip.new(root, {"
  + "          getFillFromSprite: true, labelTextColor: am5.color(whiteColorHex),"
  + "          fontSize: tooltipFontSize, labelText: lineSeriesName + \": {valueY.formatNumber('#.00')}\"" // Concatenation
  + "      })"
  + "    }));"
  + "    lineSeries.get(\"tooltip\").get(\"background\").set(\"fill\", am5.color(primaryOutlineColor));" // Escaped double quotes
  + "    lineSeries.strokes.template.set(\"strokeWidth\", 2);" // Escaped double quotes
  + "    lineSeries.data.setAll(primaryData);"
  + "    if (initialLineVisible) lineSeries.appear(1000);"

  + "    return { line: lineSeries, fill: fillSeries, bars: value2Series };"
  + "  }"


  // --- Overlay Series Creation (Applies stored visibility or defaults to hidden) ---
  + "  function createOverlaySeries(chart, root, overlayData, colors, xAxis, yAxis) {"
  + "     console.log(\"Creating overlay series...\");" // Console log
  + "     let overlaySeriesList = [];"
  + "     if (!overlayData) { console.log(\"No valid overlay data to create series.\"); return overlaySeriesList; }" // Console log
  + "     const seriesToHideByDefault = [\"3 Weeks Ago\", \"2 Weeks Ago\", \"Last Week\", \"This Week\"];" // Escaped double quotes

  + "     try {"
  + "       for (const weekKey in overlayData) {"
  + "         if (Object.hasOwnProperty.call(overlayData, weekKey)) {"
  + "           const weekData = overlayData[weekKey];"
  + "           const seriesColor = colors[weekKey] || colors[\"Default\"];" // Escaped double quotes

  + "           let initialVisible = true;"
  + "           if (hasInitialState) {"
  + "                initialVisible = initialVisibilityState.hasOwnProperty(weekKey) ? initialVisibilityState[weekKey] : true;"
  + "           } else {"
  + "               if (seriesToHideByDefault.includes(weekKey)) {"
  + "                   initialVisible = false;"
  + "               }"
  + "           }"
  + "           console.log(\"Overlay Series: '\" + weekKey + \"', Initial Visible = \" + initialVisible + \", Has Stored State = \" + hasInitialState);" // Console log + concatenation


  + "           var lineSeries = chart.series.push(am5xy.LineSeries.new(root, {"
  + "             name: weekKey,"
  + "             xAxis: xAxis, yAxis: yAxis, valueYField: \"value\", categoryXField: \"time\"," // Escaped double quotes
  + "             stroke: am5.color(seriesColor),"
  + "             visible: initialVisible,"
  + "             connect: false,"
  + "             tooltip: am5.Tooltip.new(root, {"
  + "               getFillFromSprite: false,"
  + "               labelTextColor: am5.color( (weekKey === \"Last Week\") ? blackColorHex : whiteColorHex )," // Escaped double quotes and ternary
  + "               fontSize: tooltipFontSize, labelText: \"{name}: {valueY.formatNumber('#.00')}\"" // Escaped double quotes
  + "             })"
  + "           }));"

  + "           lineSeries.get(\"tooltip\").get(\"background\").set(\"fill\", am5.color(seriesColor));" // Escaped double quotes
  + "           lineSeries.strokes.template.set(\"strokeWidth\", 2);" // Escaped double quotes
  + "           lineSeries.data.setAll(weekData);"
  + "           if (initialVisible) lineSeries.appear(1000);"

  + "           overlaySeriesList.push(lineSeries);"
  + "         }"
  + "       }"
  + "     } catch (e) { console.error(\"Error creating overlay series:\", e); }" // Console log
  + "     console.log(\"Overlay series creation finished. Total overlay series: \" + overlaySeriesList.length);" // Console log + concatenation
  + "     return overlaySeriesList;"
  + "   }"

  // --- Legend Creation & Linking (Saves state on click) ---
  + "  function createLegend(chart, root, mainLineSeries, fillSeriesToToggle, barsSeries, otherSeries) {"
  + "     const legendSeries = [mainLineSeries, barsSeries, ...otherSeries];"
  + "     if (legendSeries.length === 0) { console.log(\"Skipping legend (no series).\"); return null; }" // Console log

  + "     console.log(\"Creating legend for \" + legendSeries.length + \" toggleable series.\");" // Console log + concatenation

  + "     var legend = chart.children.push(am5.Legend.new(root, {"
  + "         centerX: am5.p50, x: am5.p50,"
  + "         layout: am5.GridLayout.new(root, {"
  + "             maxColumns: 3"
  + "         }),"
  + "         marginTop: 15, marginBottom: 15"
  + "     }));"

  + "     let hintLabel = am5.Label.new(root, {"
  + "         text: '(Click legend items to toggle visibility - saved in browser)'," // Use single quotes
  + "         fontSize: \"0.75em\", fill: am5.color(hintLabelColorHex)," // Escaped double quotes
  + "         centerX: am5.p50, x: am5.p50, paddingTop: 5"
  + "     });"
  + "     chart.children.push(hintLabel);"

  + "     legend.events.on(\"boundschanged\", function(ev) {" // Escaped double quotes
  + "        let legendHeight = ev.target.height();"
  + "        // console.log(\"Legend bounds changed, new height: \" + legendHeight);" // Keep commented or use concatenation
  + "        hintLabel.set(\"paddingTop\", legendHeight + 5);" // Escaped double quotes
  + "        hintLabel.set(\"dy\", legendHeight + 5);" // Escaped double quotes
  + "     });"

  + "     legend.data.setAll(legendSeries);"

  + "     legend.itemContainers.template.events.on(\"click\", function(ev) {" // Escaped double quotes
  + "        const clickedSeries = ev.target.dataItem?.dataContext;"
  + "        if (!clickedSeries) return;"
  + "        console.log(\"Legend item clicked for series: \" + clickedSeries.get(\"name\"));" // Console log + concatenation

  + "        setTimeout(() => {"
  + "            if (clickedSeries === mainLineSeries) {"
  + "                if (mainLineSeries.isHidden() || !mainLineSeries.get(\"visible\")) {" // Escaped double quotes
  + "                    fillSeriesToToggle.hide();"
  + "                } else {"
  + "                    fillSeriesToToggle.show();"
  + "                }"
  + "            }"
  + "            saveVisibilityState(legendSeries);"
  + "        }, 50);"
  + "     });"

  + "     console.log(\"Legend created.\");" // Console log
  + "     return legend;"
  + "   }"

  // --- Final Chart Configuration ---
  + "  function configureChart(chart, root, yAxis, xAxis, label) {"
  + "     console.log(\"Configuring final chart elements...\");" // Console log
  + "     var cursor = chart.set(\"cursor\", am5xy.XYCursor.new(root, { behavior: \"none\" }));" // Escaped double quotes
  + "     cursor.lineY.set(\"visible\", false);" // Escaped double quotes
  + "     yAxis.children.unshift(am5.Label.new(root, {"
  + "         rotation: -90, text: \"Average \" + label + \" Points\"," // Concatenation
  + "         y: am5.p50, centerX: am5.p50, paddingRight: 10"
  + "     }));"
  + "     xAxis.children.push(am5.Label.new(root, {"
  + "         text: \"Time of Day\", x: am5.p50," // Escaped double quotes
  + "         centerX: am5.percent(50), paddingTop: 10"
  + "     }));"
  + "     chart.set(\"scrollbarX\", am5.Scrollbar.new(root, { orientation: \"horizontal\", marginBottom: 75 }));" // Escaped double quotes
  + "     chart.appear(1000, 100);"
  + "     console.log(\"Chart configured.\");" // Console log
  + "  }"


  // --- Main Execution Flow ---
  + "  console.log(\"--- Starting Chart Build Process ---\");" // Console log
  + "  const { primaryData, parsedOverlayData, hasValidOverlay } = parseChartData(primaryDataString, overlayString);"
  + "  const xAxisData = prepareAxisCategories(primaryData);"
  + "  const { chart, xAxis, yAxis } = createChartAndAxes(root, xAxisData);"

  + "  const primarySeriesRefs = createPrimarySeries(chart, root, primaryData, xAxis, yAxis);"
  + "  const overlaySeries = createOverlaySeries(chart, root, parsedOverlayData, overlayColors, xAxis, yAxis);"

  + "  createLegend(chart, root, primarySeriesRefs.line, primarySeriesRefs.fill, primarySeriesRefs.bars, overlaySeries);"

  + "  configureChart(chart, root, yAxis, xAxis, chartTypeLabel);"
  + "  console.log(\"--- Chart Build Process Complete ---\");" // Console log


  + "});" // end am5.ready()
  + "</script>" // End of inline script

  + "</body></html>"; // End of the main concatenated string

  // --- Encode and Return URI ---
  const encodedHtml = encodeURIComponent(ht);
  const dataUri = `data:text/html;charset=utf-8,${encodedHtml}`; // This outside string still uses backticks, which is fine as it's not part of the inner HTML/JS
  return dataUri;
}
