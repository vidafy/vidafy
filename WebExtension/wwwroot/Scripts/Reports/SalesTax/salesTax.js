$(document).ready(function () {
    $("#salesTax").DataTable({
        "paging": false,
        "ordering": false,
        "info": false,
        "initComplete": function (settings, json) {
            $("#salesTax").show();
        },
        dom: "<'pull-right ml-4'B><'pull-right'f><t><lp>",
        buttons: [{
            extend: "csvHtml5",
            orientation: "landscape",
            filename: "SalesTaxReport",
            text: "<i class='bi bi-cloud-arrow-down'></i> Export",
            exportOptions: {
                columns: [0, 1, 2, 3, 4, 5, 6, 7]
            }
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

var salesTaxReportFunctions = {
    displayOrderTaxDetails: function (orderNumber) {
        $(".btn-details").prop("disabled", true);
        salesTaxReportClient.getTaxDetails(orderNumber)
            .then(response => {
                if (response.Status === 0) {
                    salesTaxReportFunctions.setTaxDetailTableBody(response.Data);
                    $("#modal-tax-detail").modal("show");
                } else {
                    showErrorToast('Error', 'There was a problem displaying tax details. Please try again.');
                }
            })
            .always(() => {
                $(".btn-details").prop("disabled", false);
            });
    },

    setTaxDetailTableBody: function (taxDetails) {
        let tableBody = $("#order-tax-details-table-body");
        tableBody.html("");

        for (let i = 0; i < taxDetails.salesTaxReportLineItems.length; i++) {
            let tr = $("<tr></tr>");
            tr.append("<td>" + taxDetails.salesTaxReportLineItems[i].productName + "</td>");
            tr.append("<td>" + taxDetails.salesTaxReportLineItems[i].quantity + "</td>");
            tr.append("<td>" + taxDetails.salesTaxReportLineItems[i].lineItemPrice + "</td>");
            tr.append("<td>" + taxDetails.salesTaxReportLineItems[i].taxRate + "</td>");
            tr.append("<td>" + taxDetails.salesTaxReportLineItems[i].lineItemTax + "</td>");

            tableBody.append(tr);
        }

        let tableFooter = $("#order-tax-details-grand-total");
        tableFooter.html(taxDetails.taxGrandTotal);

        let overrideWarning = $("#override-warning");
        overrideWarning.hide();

        if (taxDetails.hasOverride) {
            overrideWarning.show();
        }
    },
};

var salesTaxReportClient = {
    getTaxDetails: function (orderNumber) {
        const url = "/command/SalesTax/GetTaxDetails";

        let postRequest = {
            orderNumber: orderNumber
        };

        return $.post(url, postRequest);
    }
};
