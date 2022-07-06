
$(document).ready(function () {
    $("table").each(function () {
        var tableId = $(this)[0].id;
        var table = $(`#${tableId}`).DataTable({
            searching: false,
            "columnDefs": [
                { "orderable": false, "targets": 0 }
            ],
            dom: 'rtlp',
            "order": [[1, "asc"]],
            "initComplete": function (settings, json) {
                $(`#${tableId}`).show();
                $(`#${tableId}`).css("width", "100%");
            }
        });

        $(`#${tableId} tbody`).on("click", "td div.tree_expand", table, mainTableFunctions.expandGroup);
        $(`#${tableId} tbody`).on("click", "td div.tree_collapse", table, mainTableFunctions.collapseGroup);
    });
});

var salesBySkuReportFunctions = {
    salesBySkuExport: function () {
        $("#button-export").prop("disabled", true);
        $("#button-export").html("<i class='fa fa-spin fa-spinner'></i>&nbsp;&nbsp;Processing...");

        var exportRequest = {
            countryCode: $("#qCountryLookup").val(),
            startDate: $("#drp__BEG").val(),
            endDate: $("#drp__END").val(),
            sku: $("#sku").val()
        };

        $.post("/Command/Reports/SalesBySku/Export", exportRequest, function (response, status, xhr) {
            // Check for a filename. Taken from a snippet here: https://stackoverflow.com/a/23797348
            var filename = "sales_by_sku.csv";
            var disposition = xhr.getResponseHeader("Content-Disposition");
            if (disposition && disposition.indexOf("attachment") !== -1) {
                var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                var matches = filenameRegex.exec(disposition);

                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, "");
                }
            }

            // Initiate the download
            var url = window.URL.createObjectURL(new Blob([response]));
            var link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        })
            .fail(function (response) {
                alert(response.statusText);
            })
            .always(function () {
                $("#button-export").prop("disabled", false);
                $("#button-export").html("<i class='fa fa-download'></i> Export");
            });
    }
};

// Table functions modified from examples found here:
//   - https://datatables.net/forums/discussion/42045/nested-tables
//   - https://datatables.net/examples/api/row_details.html
//   - http://live.datatables.net/gohefoki/1/edit
var mainTableFunctions = {
    collapseGroup: function (event) {
        var groupId = $(this).attr("data-group-id");
        var tr = $(this).closest("tr");
        var row = event.data.row(tr);

        // Toggle the expand / collapse icons for the selected row
        $('div.group.tree_collapse[data-group-id="' + groupId + '"]').hide();
        $('div.group.tree_expand[data-group-id="' + groupId + '"]').show();

        // Hide the row details table
        row.child.hide();
        tr.removeClass("shown");
    },

    expandGroup: function (event) {
        var groupId = $(this).attr("data-group-id");
        var tr = $(this).closest("tr");
        var row = event.data.row(tr);

        // Toggle the expand / collapse icons for the selected row
        $('div.group.tree_expand[data-group-id="' + groupId + '"]').hide();
        $('div.group.tree_collapse[data-group-id="' + groupId + '"]').show();

        // Show the row details table
        var tableId = `row-details-${groupId}`;
        if (!row.child.isShown()) {
            // Create the table if it doesn't exist
            if (!row.child()) {
                var rowTable = rowTableFunctions.createRowTable(tableId, row);
                row.child(rowTable).show();

                rowTableFunctions.renderDataTable(tableId);
            } else {
                row.child.show();
                $(`#${tableId}`).DataTable().ajax.reload(null, false);
            }

            tr.addClass("shown");
        }
    }
};

var rowTableFunctions = {
    createRowTable: function (tableId, row) {
        var rowData = row.data();
        var tableTemplate = $("#template-sales-by-sku");
        var table = $(tableTemplate.html());
        table.attr("id", tableId);
        table.attr("data-item-id", rowData[2]);
        table.attr("data-currency-code", rowData[6]);
        return table;
    },

    getDataSource: function (json) {
        json.draw = json.Data.draw;
        json.recordsTotal = json.Data.recordsTotal;
        json.recordsFiltered = json.Data.recordsFiltered;
        return json.Data.data;
    },

    renderDataTable: function (tableId) {
        $(`#${tableId}`).DataTable({
            bLengthChange: false,
            bInfo: false,
            dom: 'Brtlp',
            "columns": [
                {
                    "data": "orderNumber",
                    "render": rowTableFunctions.renderOrderNumberColumn
                },
                { "data": "commissionDate" },
                { "data": "backOfficeId" },
                {
                    "data": "orderName",
                    "render": rowTableFunctions.renderOrderNameColumn
                },
                { "data": "orderDate" },
                { "data": "formattedQuantityOrdered" },
                { "data": "formattedTotal" }
            ],
            "processing": true,
            "serverSide": true,
            "ajax": {
                "url": "/Command/Reports/SalesBySku/RowDetailTableData",
                "data": function (data) {
                    data.countryCode = $("#qCountryLookup").val();
                    data.startDate = $("#drp__BEG").val();
                    data.endDate = $("#drp__END").val();

                    // This function couldn't be split out into a separate method because it needs 'tableId'
                    data.currencyCode = $(`#${tableId}`).attr("data-currency-code");
                    data.itemId = $(`#${tableId}`).attr("data-item-id");
                },
                "dataSrc": rowTableFunctions.getDataSource,
                "type": "POST"
            },
            searching: false
        });
    },

    renderOrderNameColumn: function (data, type, row, meta) {
        return `<a href="/Corporate/CRM/Detail?id=${row.associateId}" target="_blank">${data}</a>`;
    },

    renderOrderNumberColumn: function (data, type, row, meta) {
        return `<a href="/Corporate/CRM/OrderDetail?order=${data}&id=${row.associateId}" target="_blank">${data}</a>`;
    }
};
