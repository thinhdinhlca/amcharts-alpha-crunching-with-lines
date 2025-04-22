  // --- Legend Creation & Linking ---
  // *** MODIFIED: Added console logs for debugging ***
  function createLegend(chart, root, mainLineSeries, fillSeriesToToggle, barsSeries, otherSeries) {
     // Combine series for the legend DATA
     const legendSeries = [mainLineSeries, barsSeries, ...otherSeries]; // Line, Bars, Overlays

     if (legendSeries.length === 0) { console.log("Skipping legend (no series)."); return null; }

     console.log("Creating legend. Series included:", legendSeries.map(s => s.get("name"))); // LOG: Check series names

     // Create container for legend and hint (unchanged)
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

     // Set data for the legend
     legend.data.setAll(legendSeries);

     // Add event listener AFTER data is set for synchronized toggle
     legend.itemContainers.template.events.on("click", function(ev) {
        const clickedSeries = ev.target.dataItem?.dataContext;
        console.log("--- Legend Click Detected ---"); // LOG: Start
        console.log("Clicked Series Name:", clickedSeries?.get("name")); // LOG: Which series was clicked?
        console.log("Main Line Series Name:", mainLineSeries?.get("name")); // LOG: What is the target series?

        // Check if the clicked item is the main line series
        if (clickedSeries === mainLineSeries) {
            console.log("MATCH: Clicked the MAIN interval legend item."); // LOG: Confirmation
            // Use setTimeout to allow default toggle action to complete
            setTimeout(() => {
                 // Check the NEW visibility state of the main line series AFTER the default toggle
                 const isHidden = mainLineSeries.isHidden() || !mainLineSeries.get("visible");
                 console.log("Main line series is now hidden:", isHidden); // LOG: New state of line
                 console.log("Fill series visibility BEFORE trying to toggle:", fillSeriesToToggle.get("visible")); // LOG: State before

                 if (isHidden) {
                    console.log("Action: Hiding fill series..."); // LOG: Action
                    fillSeriesToToggle.hide();
                 } else {
                    console.log("Action: Showing fill series..."); // LOG: Action
                    fillSeriesToToggle.show();
                 }
                 // Check state shortly after trying to change it
                 setTimeout(() => {
                    console.log("Fill series visibility AFTER trying to toggle:", fillSeriesToToggle.get("visible")); // LOG: State after
                 }, 50);

            }, 0); // Timeout ensures default toggle action has completed
        } else {
             console.log("NO MATCH: Clicked a different legend item (default toggle applies)."); // LOG: Clicked something else
        }
        console.log("--- End Legend Click Logic ---"); // LOG: End
     });

     console.log("Legend created and listener attached.");
     return legend;
   }
