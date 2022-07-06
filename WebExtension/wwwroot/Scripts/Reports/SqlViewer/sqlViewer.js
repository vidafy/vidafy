// variables
var savedQueries = [];
var sqlTextBox = null;
var loadedQuery = null;
var blankName = false;
var selectedSaveTypeName = "";
var selectedSaveType = null;
var savedQueryToDelete = 0;
var querySaveType = {
    CUSTOM_REPORT: "CUSTOM_REPORT",
    QUERY: "QUERY"
};
var savedQueriesTable = null;

// onload
$(document).ready(function () {
    initLoadedQuery();
    initSqlTextBox();
    getSavedQueries();
    getTableColumnMap();
    if (savedReport !== null) {
        loadSavedReport();
    }
});

// methods

function initSqlTextBox() {
    $(document).ready(function () {
        $(".CodeMirror").resizable();
    });

    // This needs to stay outside of the document.ready function in order for sql type-ahead to work
    sqlTextBox = CodeMirror.fromTextArea(document.getElementById("sqlQueryTextarea"), {
        mode: "text/x-mssql",
        extraKeys: { "Ctrl-Space": "autocomplete" }, // To invoke the auto complete
        hint: CodeMirror.hint.sql,
        tabMode: "classic",
        lineNumbers: true,
        smartHome: true,
        styleActiveLine: false,
        indentUnit: 0,
        matchBrackets: true
    });
}

function initLoadedQuery() {
    loadedQuery = {
        Query: "",
        SavedBy: "",
        Name: "",
        NewName: "",
        SavedQueryId: 0
    };
}

function getSavedQueries() {
    $.get("/command/SqlViewer/SavedQueries", function (data) {
        if (savedQueriesTable != null) {
            savedQueriesTable.clear();
            savedQueriesTable.rows.add(data.rows);
            savedQueriesTable.draw();
        }
        else {
            savedQueriesTable = setupAjaxTable('savedQueriesTable', data.rows, false);
        }
    });
}

function getTableColumnMap() {
    $.get("/command/SqlViewer/GetTableColumnMap", function (response) {
        sqlTextBox.options.hintOptions = response.Data;
    });
}

function changeTab(tabName) {
    $(".tabContent .tab-pane").hide();
    $("#" + tabName).show();
    $('.nav-tabs li').removeClass('active');
    $('#' + tabName + 'Tab').addClass('active');
    if (tabName == 'sqlViewer') {
        initLoadedQuery();
        sqlTextBox.setValue('');
    }
}

function checkName() {
    $(".error").hide();
    $("#button-save-query").show();
    var name = $("#modal-save-query-input-name").val();
    if (name === "") {
        $('#blankNameLbl').show();
        return false;
    } else if (selectedSaveType === 'QUERY') {
        for (var i = 0; i < savedQueries.length; i++) {
            if (savedQueries[i].Name.trim().toLowerCase() === name.trim().toLowerCase()) {
                $("#invalidNameLbl").show();
                $("#button-save-query").hide();
                return false;
            }
        }
    }
    return true;
}

function clearNameInput() {
    loadedQuery.NewName = "";
}

function deleteSavedQuery() {
    var postRequest = {
        SavedQueryId: savedQueryToDelete
    };

    return $.post("/command/SqlViewer/DeleteSavedQuery", postRequest, function(response) {
        if (response.Status !== 0) {
            showErrorAlert("There was a problem deleting the saved query. Please try again");
            return;
        } else {
            getSavedQueries();
            showSuccessAlert("Your query was deleted successfully");
        }
    }).fail(function() {
        showErrorAlert("There was a problem deleting the saved query. Please try again");
    });
}

function loadSavedReport() {
    changeTab('sqlViewer');
    sqlTextBox.setValue(savedReport.Query.Items[0].QueryString);
    loadedQuery.OriginalName = savedReport.Name;
    loadedQuery.Name = savedReport.Name;
    loadedQuery.SavedQueryId = savedReport.Id;
}

function loadSavedQuery(id) {
    showLoadingModal();
    $.get("/command/SqlViewer/SavedQuery?id=" + id, function (query) {

        changeTab('sqlViewer');
        loadedQuery = {
            OriginalName: query.Name,
            NewName: "",
            Saved: true,
            SavedQueryId: query.SavedQueryId
        };

        sqlTextBox.setValue(query.Query);
    })
    .always(hideLoadingModal);
}

function setLoadedQuery() {
    loadedQuery.Query = sqlTextBox.getValue();
}

function setSelectedSaveType(saveType) {
    selectedSaveType = saveType;
    setSelectedSaveTypeName();
}

function setSelectedSaveTypeName() {
    if (selectedSaveType === querySaveType.CUSTOM_REPORT) {
        $(".selectedSaveTypeName").html('Report');
        return;
    }
    $(".selectedSaveTypeName").html('Query');
}

function getLoadedQueryRequest(query) {
    var request = {
        Query: query.Query,
        Name: query.Name,
        IsPrivate: query.IsPrivate,
        SavedQueryId: query.SavedQueryId
    };
    return request;
}

function saveQuery() {
    loadedQuery.Query = sqlTextBox.getValue();
    loadedQuery.Name = $("#modal-save-query-input-name").val();
    if (loadedQuery.Name != loadedQuery.OriginalName) {
        //saving new Query
        loadedQuery.SavedQueryId = 0;
    }
    
    if (loadedQuery.Name.trim() !== '') {
        return $.post("/command/SqlViewer/SaveQuery",
                getLoadedQueryRequest(loadedQuery),
                function(response) {
                    if (response.Status !== 0) {
                        showErrorAlert();
                        return;
                    }

                    loadedQuery.Saved = true;
                    getSavedQueries();
                    showSuccessAlert('Great Job! Your query was saved successfully.');
                    $("#saveQueryModal").modal("hide");
                })
            .fail(function() {
                showErrorAlert();
            });
    } else {
        $('#blankNameLbl').show();
    }
}

function saveQueryAsReport() {
    loadedQuery.Query = sqlTextBox.getValue();
    loadedQuery.Name = $("#modal-save-query-input-name").val();
    if (savedReport !== null) {
        if (loadedQuery.OriginalName == loadedQuery.Name) {
            loadedQuery.SavedQueryId = savedReport.Id;
        }
        else {
            loadedQuery.SavedQueryId = 0;
        }
    }
    $('#blankNameLbl').hide();
    if (loadedQuery.Name.trim() === "") {
        $('#blankNameLbl').show();
    } else {
        $.post("/command/SqlViewer/SaveQueryAsReport", getLoadedQueryRequest(loadedQuery), function (response) {
            if (response.Status !== 0) {
                showErrorAlert();
                return;
            }
            if (loadedQuery.SavedQueryId > 0) {
                showSuccessAlert("The changes to your report have been saved.");
            } else {
                showSuccessAlert('<span>Success! Your query is now a <a href="/Corporate/Reports/ReportViewer?r=' + response.Data + '" target="_blank">custom report</a>.</span>');
            }
            sharedReportFunctions.refreshReportList(response.Data, 'SQL Query');

            $("#saveQueryModal").modal("hide");
        })
        .fail(function() {
            showErrorAlert();
        });
    }
}

function showDeleteModal(queryId) {
    savedQueryToDelete = queryId;
    $("#modal-delete-query").modal("show");
}

function showInfoModal(title, bodyText) {
    $("#infoModalTitle").html(title);
    $("#infoModalBody").html(bodyText);
    $("#infoModal").modal("show");
}

function showErrorAlert(message) {
    showErrorToast('Error', message);
}

function showSuccessAlert(message) {
    showSuccessToast('Success', message);
}

function loadTableSchema(schema, table) {
    var schemaTable = schema + "." + table;
    $("#sqlQueryResults").hide();
    showLoadingModal();
    $("#tableSchemaBody").empty();
    $.post('/command/Misc.GetTableOverview', { table: decodeURIComponent(schemaTable) }, (response) => {
        $("#tableSchema").show();
        $("#currentTableSchema").html(schemaTable);
        for (var i = 0; i < response.Data.length; i++) {
            var row = response.Data[i];
            var template = $("#tableSchemaRowTemplate").html();
            template = template.replace(/\__columnName__/g, row.ColumnName);
            template = template.replace(/\__dataType__/g, row.DataType);
            template = template.replace(/\__isNullable__/g, row.IsNullable);
            $("#tableSchemaBody").append(template);
        }
    })
    .always(hideLoadingModal);
}

function filterQueries(searchTerm) {
    $("#dbTablesList tr").has("td").hide();

    $(`#savedQueriesList tr:not(:ignoreCaseContains("${searchTerm}"))`).has("td").hide();
    $(`#savedQueriesList tr:ignoreCaseContains("${searchTerm}")`).has("td").show();
}

function filterSchemaTables(searchTerm) {
    $("#dbTablesList tr").has("td").hide();

    $(`#dbTablesList tr:not(:ignoreCaseContains("${searchTerm}"))`).has("td").hide();
    $(`#dbTablesList tr:ignoreCaseContains("${searchTerm}")`).has("td").show();
}

function getSqlQueryFromTextArea() {
    var sql = sqlTextBox.getSelection();
    if (sql === "") {
        sql = sqlTextBox.getValue();
    }

    return $.trim(sql);
}

function runQuery(saveType) {
    var sqlQuery = getSqlQueryFromTextArea();
    $("#tableSchema").hide();

    if (sqlQuery.length <= 0) {
        showInfoModal("No Sql Query", "Please enter a Valid Sql Query");
        return;
    }
    var request = {
        Sql: sqlQuery
    };

    $.post("/command/SqlViewer/ValidateQuery", request, function (response) {
        if (response.Data) {
            showInfoModal('Invalid Sql Query', response.Data);
        } else {
            var ajaxInfo = {
                url: '/Corporate/Reports/SqlReportPreview',
                data: request
            };

            if (saveType) {
                if (savedReport !== null) {
                    $("#modal-save-query-input-name").val(savedReport.Name);
                }
                if (loadedQuery != null) {
                    $("#modal-save-query-input-name").val(loadedQuery.OriginalName);
                }

                setSelectedSaveType(saveType);
                setLoadedQuery();
                $("#saveQueryModal").modal("show");
            } else {
                if (reportType === querySaveType.CUSTOM_REPORT) {
                    openPageSlideOut(null, ajaxInfo, 'AJAX_REDIRECT', 'Preview Report');
                } else {
                    $("#sqlQueryResults").empty().show();
                    showLoadingModal();
                    request.IsSqlManager = true;
                    $("#sqlQueryResults").load('/Corporate/Reports/SqlReportPreview', request, function (response, status, xhr) {
                        if (status === "error") {
                            $("#").html(response);
                        }
                        hideLoadingModal();
                    });
                }
            }
        }
    });
}

function saveAsBtnClicked(saveType) {
    runQuery(saveType);
}

function filterColumns(columns, removeColumns) {
    var index = columns.length;

    while (index--) {
        var columnName = columns[index].Column;

        if (removeColumns.includes(columnName)) {
            columns.splice(index, 1);
        }
    }
}

function loadQueryResults(data) {
    let columns = [];
    let rows = [];

    data.Columns.forEach(x => columns.push({
        title: x.ColumnName,
        field: x.ColumnName,
        editor: data.CanEdit && x.CanEdit ? this.getEditorName(x.DataType) : null,
        align: "left",
        width: 150
    }));

    this.canAddRows = data.CanInsert;
    this.canDeleteRows = data.CanDelete;

    data.Rows.forEach(x => {
        let row = {};

        for (let field in x) {
            row[columns[field].title] = x[field];
        }

        rows.push(row);
    });

    this.hasRows = data.Rows.length > 0;

    vm.$refs.table.loadData(rows, columns, data.TableName, data.Schema);
}
