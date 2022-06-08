var customReportsFunctions = {

    confirmDelete: function(reportId, reportName) {
        $('#custom-report-delete-span').html(reportName ? decodeURIComponent(reportName) : 'this report');
        $('#custom-report-delete-input').val(reportId);
        $('#custom-report-delete-modal').modal('show');
    },

    deleteReport: function () {
        $('#custom-report-delete-button').toggleClass('hidden');
        $('#custom-report-deleting-button').toggleClass('hidden');

        var reportId = $('#custom-report-delete-input').val();
        window.location = '/Corporate/Reports/ReportViewer/Delete/?r=' + reportId;
    },

    // Taken from an idea here: https://humanwhocodes.com/blog/2009/07/28/the-best-way-to-load-external-javascript/
    loadScript: function(tagId, url) {
        var script = document.createElement("script");
        script.id = tagId;
        script.defer = true;
        script.src = url;
        document.getElementsByTagName("head")[0].appendChild(script);
    },

    // This function dynamically loads the scripts required for the sql viewer to function properly.
    // These have to be loaded dynamically due to limitations with Vue in the context of a slide-out. 
    loadSqlViewerScripts: function () {
        if ($("#script-shared-report-functions").length === 0) {
            customReportsFunctions.loadScript("script-shared-report-functions", "/Scripts/Reports/sharedReportFunctions.js");
        }
        if ($("#script-sql-viewer").length === 0) {
            customReportsFunctions.loadScript("script-sql-viewer", "/Scripts/Reports/SqlViewer/sqlViewer.js");
        }
    },

    removeSqlViewerScripts: function () {
        if ($("#script-sql-viewer").length > 0) {
            $("#script-sql-viewer").remove();
        }
    }
};