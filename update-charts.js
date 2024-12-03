const dashboardState = {
    selectedState: null,
    selectedIncidentId: null,
    selectedYear: null,
    selectedGender: null,
};

// Object to hold update functions for all charts
const chartUpdaters = {};


// Shared color scale for states
const color = d3.scaleOrdinal(d3.schemeObservable10); // Use a categorical color palette

// Function to register a chart's update logic
function registerChart(name, updateFunction) {
    console.log("Current Dashboard State:", dashboardState);
    chartUpdaters[name] = updateFunction;
}

// Add event listener to clear filters button
document.getElementById("clear-filters").addEventListener("click", () => {
    // Reset the dashboard state
    dashboardState.selectedState = null;
    dashboardState.selectedIncidentId = null;
    dashboardState.selectedYear = null;
    dashboardState.selectedGender = null;


    console.log("Filters cleared. Current Dashboard State:", dashboardState);

    // Update all charts with the reset state
    updateCharts({});
});
// Update all charts based on the merged state
function updateCharts({ state = null, incidentId = null, gender = null, year = null }) {
    // Merge new filter values with the existing state
    dashboardState.selectedState = state !== null ? state : dashboardState.selectedState;
    dashboardState.selectedIncidentId = incidentId !== null ? incidentId : dashboardState.selectedIncidentId;
    dashboardState.selectedGender = gender !== null ? gender : dashboardState.selectedGender;
    dashboardState.selectedYear = (year !== null && year !== 0) ? year : (year === 0 ? null : dashboardState.selectedYear);    
    console.log("Updated Dashboard State:", dashboardState);

    // Apply the merged state to all registered charts
    Object.values(chartUpdaters).forEach(updateFn => updateFn(dashboardState));
}


