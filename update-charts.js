const dashboardState = {
    selectedState: null,
    selectedIncidentId: null,
    selectedYear: null,
    selectedGender: null
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
function updateCharts({ state = null, incidentId = null, gender = null, year = null }) {
    // Merge new filter values with the existing state
    dashboardState.selectedState = state !== null ? state : dashboardState.selectedState;
    dashboardState.selectedIncidentId = incidentId !== null ? incidentId : dashboardState.selectedIncidentId;
    dashboardState.selectedGender = gender !== null ? gender : dashboardState.selectedGender;
    dashboardState.selectedYear = year !== null ? year : dashboardState.selectedYear;

    console.log("Updated Dashboard State:", dashboardState);

    // Apply the merged state to all registered charts
    Object.values(chartUpdaters).forEach(updateFn => updateFn(dashboardState));
}


