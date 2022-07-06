$(document).ready(function () {
    $('#totalSales').DataTable({
        "processing": true,
        "serverSide": true,
        "ajax": {
            "url": "/Command/Reports/TotalSales/TableData",
            "data": totalSalesReportFunctions.gatherReportMetadata,
            "dataSrc": totalSalesReportFunctions.getDataSource,
            "type": "POST"
        },
        "columns": [
            {
                "data": "orderNumber",
                "render": totalSalesReportFunctions.renderOrderNumberColumn
            },
            { "data": "localInvoiceNumber" },
            { "data": "invoiceDate" },
            { "data": "backOfficeId" },
            {
                "data": "orderName",
                "render": totalSalesReportFunctions.renderOrderNameColumn
            },
            { "data": "orderDate" },
            { "data": "formattedSubTotal" },
            { "data": "formattedTotal" },
            { "data": "orderNotes" }
        ],
        "footerCallback": totalSalesReportFunctions.footerCallback,
        dom: "<'pull-right'B><'pull-right'f><t><lp>",
        buttons: [{
            text: "<i class='bi bi-cloud-arrow-down'></i> Export",
            attr: { id: "button-export" },
            action: totalSalesReportFunctions.exportTableResults
        }],
        language: {
            paginate: {
                'previous': '<i class="bi bi-chevron-left"></i>',
                'next': '<i class="bi bi-chevron-right"></i>'
            },
            search: "_INPUT_",
            searchPlaceholder: "Search"
        }
    });
});

var totalSalesReportFunctions = {
    exportTableResults: function (e, dt, node, config) {
        $("#button-export").prop('disabled', true);
        $("#button-export").html("<i class='fa fa-spin fa-spinner'></i>&nbsp;&nbsp;Processing...");

        var downloadRequest = dt.ajax.params();
        totalSalesReportFunctions.gatherReportMetadata(downloadRequest);

        $.post("/Command/Reports/TotalSales/Export", downloadRequest, function (response, status, xhr) {
            // Check for a filename. Taken from a snippet here: https://stackoverflow.com/a/23797348
            var filename = "total_sales.csv";
            var disposition = xhr.getResponseHeader('Content-Disposition');
            if (disposition && disposition.indexOf('attachment') !== -1) {
                var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                var matches = filenameRegex.exec(disposition);

                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            // Initiate the download
            var url = window.URL.createObjectURL(new Blob([response]));
            var link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);;
        })
        .fail(function (response) {
            alert(response.statusText);
        })
        .always(function () {
            $("#button-export").prop('disabled', false);
            $("#button-export").html("<i class='fa fa-download'></i> Export");
        });
    },

    footerCallback: function (row, data, start, end, display) {
        var api = this.api(), data;
        var ajaxResponse = api.ajax.json();

        // Decide whether to display that the totals are filtered
        if (ajaxResponse.recordsFiltered === ajaxResponse.recordsTotal) {
            $("#span-filtered").hide();
        }
        else {
            $("#span-filtered").show();
        }

        // Update footer
        $(api.column(6).footer()).html(`${ajaxResponse.Data.formattedPageSubTotal}<br>${ajaxResponse.Data.formattedOverallSubTotal}`);
        $(api.column(7).footer()).html(`${ajaxResponse.Data.formattedPageTotal}<br>${ajaxResponse.Data.formattedOverallTotal}`);
    },

    gatherReportMetadata: function (data) {
        data.countryCode = $('#qCountryLookup').val();
        data.startDate = $('#drp__BEG').val();
        data.endDate = $('#drp__END').val();
    },

    getDataSource: function (json) {
        json.draw = json.Data.draw;
        json.recordsTotal = json.Data.recordsTotal;
        json.recordsFiltered = json.Data.recordsFiltered;
        return json.Data.data;
    },

    renderOrderNameColumn: function (data, type, row, meta) {
        return `<a href="/Corporate/CRM/Detail?id=${row.associateId}" target="_blank">${data}</a>`;
    },

    renderOrderNumberColumn: function (data, type, row, meta) {
        return `<a href="/Corporate/CRM/OrderDetail?order=${data}&id=${row.associateId}" target="_blank">${data}</a>`;
    }
}
