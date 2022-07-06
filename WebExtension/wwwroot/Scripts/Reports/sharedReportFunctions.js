var sharedReportFunctions = {
    refreshReportList: function (id, reportType) {
        var request = {
            ReportId: id
        };
        $.post("/command/Reports.UI.GetReport",
            request,
            function (response) {
                $("#report_" + id).remove();
                var template = $("#templateReportItem").html();
                template = template.replace(/\__name__/g, response.Data.Name);
                if (reportType === 'SQL Query') {
                    template = template.replace(/\__reportType__/g, 'SqlViewer?id=');
                    template = template.replace(/\__id__/g, + id);
                } else {
                    template = template.replace(/\__reportType__/g, 'ReportBuilder?r=');
                    template = template.replace(/\__id__/g, + id);
                }
                var tr = "<tr id='report_" + id + "'></tr>";
                $("#customReportList").prepend(tr);
                $("#report_" + id).append(template);
                $("#report_" + id + ' .date')
                    .text(moment(response.Data.LastModified).format('MMM DD, YYYY'));
                $("#report_" + id + ' .user').text(response.Data.User);
                $("#report_" + id + ' .reportType').text(reportType);
                showSuccessToast("Success", "Report saved successfully");
            });
    }
};