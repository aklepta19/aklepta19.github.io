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
// Update all charts based on the merged state
// Update all charts based on the merged state
function updateCharts({ state = undefined, incidentId = undefined, gender = undefined, year = undefined }) {
    // Toggle filters: If the value matches the current state, set it to null
    dashboardState.selectedState = state === dashboardState.selectedState ? null : (state !== undefined ? state : dashboardState.selectedState);
    dashboardState.selectedIncidentId = incidentId === dashboardState.selectedIncidentId ? null : (incidentId !== undefined ? incidentId : dashboardState.selectedIncidentId);
    dashboardState.selectedGender = gender === dashboardState.selectedGender ? null : (gender !== undefined ? gender : dashboardState.selectedGender);
    dashboardState.selectedYear = year === dashboardState.selectedYear  ? null : (year !== undefined ? year : dashboardState.selectedYear);

    console.log("Updated Dashboard State:", dashboardState);

    // Apply the updated state to all registered charts
    Object.values(chartUpdaters).forEach(updateFn => updateFn(dashboardState));
}




