let vm = new Vue({
    el: '#sqlQueryVueApp',
    components: {
        'sql-editor-table': new DataGridEditor()
    },
    data: {
        filters: [],
        sortFilters: [],
        filterIndex: 0,
        sortFilterIndex: 0,
        currentTable: '',
        currentTableSchema: null,
        loaderVisible: false,
        filtersVisible: false,
        dataTableVisible: false,
        tableSchemaVisible: false,
        cssLoaderType: 'loader-1',
        sqlTextBox: null,
        canAddRows: false,
        canEditRows: false,
        restClient: new SqlEditorClient(),
        showVisualEditor: true,
        showSqlEditor: false,
        tables: [],
        loadingTables: true
    },
    methods: {
        initializeFilters: initializeFilters,
        addBlankFilter: addBlankFilter,
        addBlankSortFilter: addBlankSortFilter,
        deleteFilter: deleteFilter,
        setRandomLoader: setRandomLoader,
        initSqlTextBox: initSqlTextBox,
        getSqlQueryFromTextArea: getSqlQueryFromTextArea,
        runVisualQueryClicked: runVisualQueryClicked,
        runSqlQueryClicked: runSqlQueryClicked,
        loadTableSchema: loadTableSchema,
        hideAllTables: hideAllTables,
        showTableSchema: showTableSchema,
        showDataEditor: showDataEditor,
        showInfoModal: showInfoModal,
        showConfirmModal: showConfirmModal,
        showFilters: showFilters,
        rowInserted: rowInserted,
        rowUpdated: rowUpdated,
        deleteRows: deleteRows,
        deleteNewRow: deleteNewRow,
        runVisualSqlQuery: runVisualSqlQuery,
        runSqlQuery: runSqlQuery,
        loadTableData: loadTableData,
        clearTableData: clearTableData,
        getEditorName: getEditorName,
        exportResultsClicked: exportResultsClicked,
        downloadQueryResults: downloadQueryResults,
        massUpdate: massUpdate,
        switchTabs: switchTabs,
        getTables: getTables
    },
    mounted: function () {
        this.initSqlTextBox();
        this.getTables();
    }
});

function getTables() {
    this.loadingTables = true;
    this.restClient.getTables().then(response => {
        vm.tables = response.Data;
        this.loadingTables = false;
    });
}

function initSqlTextBox() {
    $(document).ready(function () {
        vm.sqlTextBox = CodeMirror.fromTextArea(document.querySelector("#sqlQueryTextarea"), {
            mode: "text/x-mssql",
            extraKeys: { "Ctrl-Space": "autocomplete" }, // To invoke the auto complete
            hint: CodeMirror.hint.sql,
            tabMode: "classic",
            lineNumbers: true,
            smartHome: true,
            styleActiveLine: false,
            indentUnit: 0,
            matchBrackets: true,
            autoRefresh: true,
            resize: function () {
                vm.sqlTextBox.setSize($(this).width(), $(this).height());
            }
        });

        $(".CodeMirror").resizable();

        $.get("/command/SqlViewer/GetTableColumnMap", function (response) {
            vm.sqlTextBox.options.hintOptions = response.Data;
        });
    });
}

function initializeFilters() {
    vm.filters = [];
    vm.sortFilters = [];
    vm.addBlankFilter();
    vm.addBlankSortFilter();
}

function addBlankFilter() {
    vm.filters.push({
        id: this.filterIndex++,
        columnName: '',
        operator: '=',
        value: ''
    });
}

function addBlankSortFilter() {
    vm.sortFilters.push({
        id: this.sortFilterIndex++,
        columnName: '',
        value: 'ASC'
    });
}

function switchTabs(isVisualTab) {
    if (isVisualTab) {
        vm.showVisualEditor = true;
        vm.showSqlEditor = false;
    } else {
        vm.showVisualEditor = false;
        vm.showSqlEditor = true;
    }
    this.dataTableVisible = false;
}

function showFilters() {
    vm.filtersVisible = true;
}

function deleteFilter(filter) {
    vm.filters = vm.filters.filter(f => f.id !== filter.id);
    if (vm.filters.length === 0) {
        addBlankFilter();
    }
}

function deleteSortFilter(filter) {
    vm.sortFilters = vm.sortFilters.filter(f => f.id !== filter.id);
    if (vm.sortFilters.length === 0) {
        addBlankSortFilter();
    }
}

function showInfoModal(title, bodyText) {
    $('#infoModalTitle').html(title);
    $('#infoModalBody').html(bodyText);
    $('#infoModal').modal('show');
}

function showDataEditor() {
    this.tableSchemaVisible = false;
    this.dataTableVisible = true;
}

function showTableSchema() {
    this.tableSchemaVisible = true;
    this.dataTableVisible = false;
}

function hideAllTables() {
    this.tableSchemaVisible = false;
    this.dataTableVisible = false;
}

function exportResultsClicked(e, promise) {
    promise.resolve(true);
    this.downloadQueryResults();
}

function downloadQueryResults() {
    if (vm.showVisualEditor) {
        this.restClient.exportVisualQuery(vm.currentTable.Schema, vm.currentTable.Name, vm.filters)
            .then(response => {
                if (!response.ok) {
                    throw Error(response.statusText);
                }
                return response.blob();
            })
            .then(blob => {
                downloadBlob(blob);
            })
            .catch(error => vm.showInfoModal('Download Error', "Error Exporting Query Results"));
    } else {
        this.restClient.exportSqlQuery(getSqlQueryFromTextArea())
            .then(response => {
                if (!response.ok) {
                    throw Error(response.statusText);
                }
                return response.blob();
            })
            .then(blob => {
                downloadBlob(blob);
            })
            .catch(error => vm.showInfoModal('Download Error', "Error Exporting Query Results"));
    }
}

function downloadBlob(blob) {
    var url = window.URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = "queryResults.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

function loadTableSchema(table, showResultsTable) {
    this.hideAllTables();
    var schemaTable = table.Schema + "." + table.Name;
     
    $.post('/command/Misc.GetTableOverview', { table: decodeURIComponent(schemaTable) }, (response) => {
        var oldSchemaTable = vm.currentTable.Schema + "." + vm.currentTable.Name;
        vm.currentTable = table;
        vm.currentTableSchema = response.Data;
        if (showResultsTable) {
            if (vm.showSqlEditor) {
                var sqlText = getSqlQueryFromTextArea();
                var oldTableText = 'SELECT * FROM ' + oldSchemaTable;
                if (sqlText === "" || sqlText === oldTableText) {
                    vm.sqlTextBox.setValue('SELECT * FROM ' + schemaTable);
                }
            } 
            vm.initializeFilters();
            vm.runVisualSqlQuery();
        } else {
            this.showTableSchema();
        }
    });
}

function filterSchemaTables(searchTerm) {
    $('#dbTablesList tr').has("td").hide();

    $('#dbTablesList tr:not(:ignoreCaseContains("' + searchTerm + '"))').has("td").hide();
    $('#dbTablesList tr:ignoreCaseContains("' + searchTerm + '")').has("td").show();
}

function getSqlQueryFromTextArea() {

    let sql = vm.sqlTextBox.getSelection();

    if (sql === "") {
        sql = vm.sqlTextBox.getValue();
    }

    return $.trim(sql);
}

function runVisualQueryClicked() {
    this.showDataEditor();
    this.runVisualSqlQuery();
}

function runSqlQueryClicked() {
    var sql = getSqlQueryFromTextArea().toLowerCase();
    if ((sql.includes('update ') || sql.includes('delete ')) && !sql.includes('where')) {
        let dialogPromise = this.showConfirmModal('Confirm', 'This statement does not include a where clause. Are you sure you want to execute this statement?');
        dialogPromise.then((result) => {
            if (result) {
                this.runSqlQuery();
            }
        });

    } else {
        this.runSqlQuery();
    }
}

function filterColumns(columns, removeColumns)
{
    var index = columns.length;

    while (index--) {
        let columnName = columns[index].Column;

        if (removeColumns.includes(columnName)) { 
            columns.splice(index, 1);
        } 
    }
}

function setRandomLoader() {
    min = Math.ceil(1);
    max = Math.floor(8);
    let loaderId = Math.floor(Math.random() * (max - min + 1)) + min;

    this.cssLoaderType = 'loader-' + loaderId;  // returns a random integer from 1 to 10
}

$("#confirmModalOkButton").on("click", function(){
    $("#confirmModalOkButton").attr("data-ok-clicked", "");
});

function showConfirmModal(title, bodyText)
{
    $('#confirmModalTitle').html(title);
    $('#confirmModalBody').html(bodyText);
    $("#confirmModalOkButton").removeAttr("data-ok-clicked");

    let modal = $('#confirmModal');

    return new Promise(function (resolve, reject) {
        modal.one('hidden.bs.modal', function () {
            let okClicked = $("#confirmModalOkButton").attr("data-ok-clicked") !== undefined;
            resolve(okClicked);
        });

        modal.modal('show');
    });
}

function rowInserted(e, promise) {
    filterColumns(e.columns, ['recordnumber', 'last_modified']);

    let apiResponsePromise = this.restClient.insertRow(e.schema, e.tableName, e.columns);

    apiResponsePromise.done(response => {
        if (response.Status !== 0) {
            vm.showInfoModal('Error Inserting Row', response.Message);
            promise.reject(false);
        }
        else {
            promise.resolve({
                recordnumber: response.Data.RecordNumber,
                last_modified: moment(response.Data.LastModified).format("M/D/YYYY h:mm:ss A")
            });
        }
    });

    apiResponsePromise.fail(response => {
        vm.showInfoModal('Error Inserting Row', response.Message);
        promise.reject(false);
    });
}

function rowUpdated(e, promise) {
    let apiResponsePromise = this.restClient.updateRow(e.schema, e.tableName, e.recordnumber, e.updatedColumns);

    apiResponsePromise.done(response => {
        if (response.Status !== 0) {
            vm.showInfoModal('Error Updating Data', response.Message);
            promise.reject(false);
        }
        else {
            promise.resolve({
                last_modified: moment(response.Data).format("M/D/YYYY h:mm:ss A")
            });
        }
    });

    apiResponsePromise.fail(response => {
        vm.showInfoModal('Error Updating Data', response.Message);
        promise.reject(false);
    });
}

function deleteRows(req, dataGridPromise) {
    let dialogPromise = this.showConfirmModal('Confirm', 'Are you sure you want to delete the selected row(s)?');

    dialogPromise.then((result) => {

        if (result) {
            let apiResponsePromise = this.restClient.deleteRows(req);

            apiResponsePromise.done(response => {
                dataGridPromise.resolve(true);
                showSuccessToast('Success', req.RecordIds.length + ' records successfully deleted');
            });

            apiResponsePromise.fail(response => {
                dataGridPromise.reject(false);
                showInfoModal('Error Deleting Row', response.Message);
            });
        }
        else {
            dataGridPromise.reject(false);
        }
    });
}

function deleteNewRow(e, dataGridPromise) {
    let dialogPromise = this.showConfirmModal('Confirm', 'Are you sure you want to delete this row?');

    dialogPromise.then((result) => {

        if (result) {
            dataGridPromise.resolve(true);
        }
        else {
            dataGridPromise.reject(false);
        }
    });
}

function runVisualSqlQuery() {
    vm.setRandomLoader();
    vm.loaderVisible = true;
    let promise = this.restClient.runVisualQuery(vm.currentTable, vm.filters, vm.sortFilters);

    promise.done(response => {
        vm.showDataEditor();
        vm.loaderVisible = false;

        if (response.Status === 0) {
            this.loadTableData(response.Data);
        }
        else {
            vm.clearTableData();
            vm.hideAllTables();
            vm.showInfoModal('Error', response.Message);
        }
    });

    promise.fail(response => {
        vm.loaderVisible = false;
        vm.showDataEditor();

        vm.showInfoModal('Error', 'Could not run sql query');
    });
}

function runSqlQuery() {
    var sql = getSqlQueryFromTextArea();
    vm.setRandomLoader();
    this.dataTableVisible = false;
    vm.loaderVisible = true;
    let promise = this.restClient.runSqlQuery(sql);

    promise.done(response => {
        vm.loaderVisible = false;

        if (response.Status === 0) {
            if (Number.isInteger(response.Data.RowsUpdated)) {
                showSuccessToast('Success', response.Data.RowsUpdated + ' record(s) affected');
            } else {
                this.loadTableData(response.Data);
            }
        }
        else {
            vm.clearTableData();
            vm.hideAllTables();
            vm.showInfoModal('Error', response.Message);
        }
    });

    promise.fail(response => {
        vm.loaderVisible = false;
        vm.showDataEditor();

        vm.showInfoModal('Error', 'Could not run sql query');
    });
}

function loadTableData(data) {
    this.dataTableVisible = true;
    let columns = [];
    let rows = [];
    data.Columns.forEach(x => columns.push({
        title: x.ColumnName,
        field: x.ColumnName,
        editor: data.CanEdit && x.CanEdit ? this.getEditorName(x.DataType) : null,
        hozAlign: "left",
        width: 150,
        dataType: x.DataType
    }));

    this.canAddRows = data.CanInsert;
    this.canEditRows = data.CanEdit;

    data.Rows.forEach(x => {
        let row = {};

        for (let field in x) {
            row[columns[field].title] = x[field];
        }

        rows.push(row);
    });
    vm.$refs.table.loadData(rows, columns, data.Schema, data.TableName, !this.showSqlEditor, data.CanEdit);
}

function clearTableData() {
    vm.$refs.table.loadData([], [], '');
}

function getEditorName(columnType) {
    switch (columnType) {
        case "String":
            return "input";
        case "Integer":
            return "number";
        case "Float":
            return "number";
        case "Boolean":
            return "tickCross";
        case "DateTime":
            return "input";
        default:
            return null;
    }
}

function massUpdate(req, promise) {
    let apiResponsePromise = this.restClient.massUpdate(req);

    apiResponsePromise.done(response => {
        if (response.Status !== 0) {
            vm.showInfoModal('Error Updating Data. Your changes were not saved', response.Message);
            promise.reject(false);
        }
        else {
            promise.resolve({
                last_modified: moment(response.Data).format("M/D/YYYY h:mm:ss A")
            });
            showSuccessToast('Success', req.RecordIds.length + ' records successfully updated');
        }
    });

    apiResponsePromise.fail(response => {
        vm.showInfoModal('Error Updating Data. Your changes were not saved', response.Message);
        promise.reject(false);
    });
}