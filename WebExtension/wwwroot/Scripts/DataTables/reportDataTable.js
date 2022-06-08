
function setupTable(sortColIndex, tableId, exportName, exportOption = 'csvHtml5', columnFiltering = false) {
    if (columnFiltering) {
        $('#' + tableId + ' thead tr').clone(true).appendTo('#' + tableId + ' thead');
        $('#' + tableId + ' thead tr:eq(1) th').each(function(i) {
            var title = $(this).text();
            $(this).html('<input type="text" placeholder="Search ' + title + '" />');

            $('input', this).on('keyup change', function() {
                if (table.column(i).search() !== this.value) {
                    table
                        .column(i)
                        .search(this.value)
                        .draw();
                }
            });
        });
    }

    var table = $('#' + tableId).DataTable({
        "order": [[sortColIndex, "desc"]],
        bInfo: false,
        searching: true,
        "drawCallback": function () {
            // this callback hiding the paging controls if there is only one page
            var pagination = $(this).closest('.dataTables_wrapper').find('.dataTables_paginate');
            pagination.toggle(this.api().page.info().pages > 1);
        },
        "initComplete": function (settings, json) {
            $("#" + tableId).show();
            $("#" + tableId).css("width", "100%");
        },
        dom: "<<<r><'pull-right ml-4'B>f><t><l><ip>>",
        buttons: [{
            extend: exportOption,
            orientation: 'landscape',
            //Name the CSV
            filename: exportName,
            text: '<i class="bi bi-cloud-arrow-down text-2xl relative top-0.5"></i><span class="ml-2">Export</span>'
        }],
        orderCellsTop: true,
        fixedHeader: true,
        pageLength: 10,
        lengthMenu: [10, 25, 50, 100],
        responsive: true,
        language: {
            paginate: {
                'previous': '<i class="bi bi-chevron-left"></i>',
                'next': '<i class="bi bi-chevron-right"></i>'
            },
            search: "_INPUT_",
            searchPlaceholder: "Search"
        }
    });

    return table;
}

function setupAjaxTable(tableId, data, showExport = true, removePaging = false, removeSorting = false, columnFiltering = false, pageSize = 10, ) {
    if (columnFiltering) {
        $('#' + tableId + ' thead tr').clone(true).appendTo('#' + tableId + ' thead');
        $('#' + tableId + ' thead tr:eq(1) th').each(function (i) {
            if (!$(this).hasClass('nosearch')) {
                $(this).html('<input type="text" />');

                $('input', this).on('keyup change',
                    function () {
                        if (table.column(i).search() !== this.value) {
                            table
                                .column(i)
                                .search(this.value)
                                .draw();
                        }
                    });
            } else {
                $(this).html("");
            }
        });
    }
    var buttons = [{
        extend: 'csvHtml5',
        orientation: 'landscape',
        //Name the CSV
        filename: tableId,
        text: '<i class="bi bi-cloud-arrow-down text-2xl relative top-0.5"></i><span class="ml-2">Export</span>'
    }];

    if (!showExport) {
        buttons = [];
    }

    var params = {
        "bDestroy": true,
        "data": data,
        bInfo: false,
        searching: true,
        paging: !removePaging,
        ordering: !removeSorting,
        orderCellsTop: true,
        dom: "<<<r><'pull-right ml-4'B>f><t><l><ip>>",
        lengthMenu: [10, 25, 50, 100],
        pageLength: pageSize,
        buttons: buttons,
        responsive: true,
        language: {
            paginate: {
                'previous': '<i class="bi bi-chevron-left"></i>',
                'next': '<i class="bi bi-chevron-right"></i>'
            },
            search: "_INPUT_",
            searchPlaceholder: "Search"
        }
    }

    var table = $('#' + tableId).DataTable(params);
    $('.pull-right button').css('margin-right', '10px');
    return table;
}

function loadDataTable(url, requestObj, tableObj, tableId, columnSort) {
    showLoadingModal('Loading Report');

    $.post(url, requestObj, function (response) {
        if (tableObj != null) {
            tableObj.clear();
            tableObj.rows.add(response.data);
            tableObj.draw();
        }
        else {
            tableObj = setupAjaxTable(tableId, response.rows);
            tableObj.order([columnSort, 'desc']).draw();
        }
        hideLoadingModal();
    });

}

