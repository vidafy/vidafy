class DataGridEditor
{
    constructor()
    {
        this.template = this.getTemplateHTML();
        this.watch = this.getWatchObject();
        this.methods = this.getMethodsObject();
        this.props = {
            canAddRows: { type: Boolean, default: null }, 
            canEditRows: { type: Boolean, default: null },
            placeHolderText: { type: String, default: '(No Data Returned)' },
            editToolTip: { type: String, default: '' },
            showEditRows: { type: Boolean, default: false },
            showMassEdit: { type: Boolean, default: false },
            selectedRowCount: { type: Number, default: 0 },
            massEditColumns: { type: Object, default: null },
            columnData: { type: Object, default: null },
            filtersVisible: { type: Boolean, default: false },
            showFiltersButton: { type: Boolean, default: false },
            showAddNewRowButton: { type: Boolean, default: true },
            tableExpanded: { type: Boolean, default: false }
        };

        // vue requires data and mounted functions to be properties on the DataGridEditor object
        // and not via the prototype reference
        // So we map the references here        
        this.data = this.data;
        this.mounted = this.mounted;
        this.showEditRows = false;
        this.showMassEdit = false;
        this.selectedRowCount = 0;
        this.filtersVisible = false;
        this.tableExpanded = false;
        this.editToolTip = '';
    }

    getTemplateHTML() {
        return "" +
            "<div>" +
            "<div class='row pb-4 m-0 pr-6' id='tableButtonRow'>" +
            "<div class='col-xs pull-right btn-toolbar'>" +
                    "<span v-bind:title='editToolTip'><button class='btn btn-default' v-if='showEditRows' id='editRows' @click='editRowsButton_click' :disabled='!canEditRows'><i class='bi bi-pencil-square'></i> <span>Edit {{selectedRowCount}} Row(s)</span></button></span>" +
                    "<span v-bind:title='editToolTip'><button class='btn btn-default' v-if='showEditRows' id='deleteRowButton' v-bind:class='{disabled:!canEditRows}' :disabled='!canEditRows' @click='deleteRowsButton_click'><i class='bi bi-trash'></i> Delete {{selectedRowCount}} Row(s)</button></span>" +
                    "<button class='btn btn-default' @click='showFilters()' v-if='showFiltersButton'> Filters</button>" +
                    "<button class='btn btn-default' v-if='canAddRows && showAddNewRowButton' id='newRowButton' v-bind:class='{disabled:!showAddNewRowButton}' :disabled='!showAddNewRowButton' @click='newRowButton_click'><i class='bi bi-plus-circle'></i> New Row</button>" +
                    "<button class='btn btn-default' id='exportButton' v-bind:class='{disabled:this.tableRows.length <= 0}' :disabled='this.tableRows.length <= 0' @click='exportResultsButton_click'><i class='bi bi-cloud-arrow-down'></i> Export</button>" +
                "</div>" +
            "</div>" +
            "<div class='resultsTableContainer' v-bind:class=\"{ 'collapsed': !tableExpanded, 'expanded': tableExpanded }\">" +
            "<div id='resultsTable' class='table-striped' ref='table'></div>" +  // you must use ref here so we can access the table variable by name under $refs
                "<a v-if='!tableExpanded' @click='tableExpanded=true' title='Click to Expand' class='expanderBtn'><i class='bi bi-plus-square-fill'><i></a>" +
                "<a v-if='tableExpanded' @click='tableExpanded=false' title='Click to Collapse' class='expanderBtn'><i class='bi bi-dash-square-fill'><i></a>" +
            "</div>" +
            "<div id='massEditModalMask' v-if='showMassEdit' @click='closeMassEdit()'></div>'" +
            "<div id='massEditModal' v-if='showMassEdit'>" +
                "<div class='mt-0 -mr-4 mb-2 ml-8'>" +
                    "<div class='text-3xl -mx-8 inline-block'><span>Edit Multiple Rows</span></div>" +
                    "<div class='inline-block pull-right'>" +
                        "<a class='btn btn-xs btn-primary mr-4' @click='massUpdateBtn_clicked()'>Save {{selectedRowCount}} Row(s)</a>" +
                        "<a class='pull-right text-3xl' title='Cancel' @click='closeMassEdit()'><i class='bi bi-x text-dark-grey text-4xl'></i></a>" +
                    "</div>" +
                "</div>" +
                "<div class='border-b border-t border-medium-light-grey bg-super-light-grey -mx-8 px-8 py-2'>Click on an item below to edit the value for all selected rows</div>" +
                "<div class='row font-bold mt-6'>" +
                    "<div class='col-lg-4'>Column</div>" +
                    "<div class='col-lg-3'>Data Type</div>" +
                    "<div class='col-lg-5'>Value</div>" +
                "</div>" +
                "<div v-for='col in massEditColumns' v-if='col.show'>" +
                    "<div class='p-4 row hover:bg-super-light-grey' v-bind:class='{ \"cursor-pointer\": !col.editing }'>" +
                        "<div class='col-lg-4 column-name' @click='col.editing=true; col.hovering=false'>{{col.title}}</div>" +
                        "<div class='col-lg-3' @click='col.editing=true; col.hovering=false'>{{col.dataType}}</div>" +
                        "<div class='col-lg-4' v-if='!col.editing' @click='col.editing=true; col.hovering=false'>{{col.displayValue}}</div>" +
                        "<div class='col-lg-1' v-if='!col.editing' @click='col.editing=true; col.hovering=false'><a title='Edit'><i class='bi bi-pencil-square text-3xl pr-8'></i></a></div>" +
                        "<div class='col-lg-4' v-if='col.editing'><input type='text' class='col-value' v-model='col.editValue'/></div>" +
                        "<div class='col-lg-1' v-if='col.editing'><a title='Cancel' @click='col.editing=false;'><i class='bi bi-x text-4xl pr-8 cursor-pointer'></i></a></div>" +
                    "</div>" +
                "</div>" +
            "</div>" +
        "</div>";
    }

    getWatchObject()
    {
        return {
            canAddRows: {
                handler: function (addRowsEnabled) {
                    this.showAddNewRowButton = addRowsEnabled;
                },
                deep: false
            },
            canDeleteRows: {
                handler: function (deleteRowsEnabled) {
                    this.showDeleteRowButton = deleteRowsEnabled;
                },
                deep: false
            },  
            tableRows: {
                handler: function (rows) {
                    this.table.replaceData(rows);
                },
                deep: false
            },
            tableColumns: {
                handler: function (columns) {
                    this.table.setColumns(columns);
                },
                deep: false
            }
        };
    }

    getMethodsObject() {
        return {
            editRowsButton_click: this.editRowsButton_click,
            newRowButton_click: this.newRowButton_click,
            deleteRowsButton_click: this.deleteRowsButton_click,
            exportResultsButton_click: this.exportResultsButton_click,
            toggleAddRowsEnabled: this.toggleAddRowsEnabled,
            toggleDeleteRowsEnabled: this.toggleDeleteRowsEnabled,
            customCellSaveCancelButtons: this.customCellSaveCancelButtons,
            okCancelClicked: this.okCancelClicked,
            selectionChanged: this.selectionChanged,
            deselectAllRows: this.deselectAllRows,
            showSaveCancelButtons: this.showSaveCancelButtons,
            hideSaveCancelButtons: this.hideSaveCancelButtons,
            updateRow: this.updateRow,
            cancelRowEdit: this.cancelRowEdit,
            cellEdited: this.cellEdited,
            getOkCancelButtonId: this.getOkCancelButtonId,
            getSuccessIconId: this.getSuccessIconId,
            showSuccessIcon: this.showSuccessIcon,
            insertNewRow: this.insertNewRow,
            deleteNewRow: this.deleteNewRow,
            updateRowData: this.updateRowData,
            isNewRow: this.isNewRow,
            addButtonColumn: this.addButtonColumn,
            loadData: this.loadData,
            saveCellOldValue: this.saveCellOldValue,
            getCellOldValueKey: this.getCellOldValueKey,
            getCellOldValue: this.getCellOldValue,
            deleteCellOldValue: this.deleteCellOldValue,
            closeMassEdit: this.closeMassEdit,
            getMassEditColDisplayValue: this.getMassEditColDisplayValue,
            getRecordNumberColumnIndex: this.getRecordNumberColumnIndex,
            getRowPosition: this.getRowPosition,
            massUpdateBtn_clicked: this.massUpdateBtn_clicked,
            showFilters: this.showFilters,
            showDataGridForSqlEditor: this.showDataGridForSqlEditor,
            selectedItemInPage: this.selectedItemInPage,
            getPagedSelectedData: this.getPagedSelectedData
        };
    }

    loadData(rows, columns, schema, tableName, visualEditorMode, canEdit) {
        if (visualEditorMode) {
            this.addButtonColumn(columns);
        }

        this.rowButtons = [];
        this.tableName = tableName;
        this.schema = schema;
        this.tableColumns = columns;
        this.tableRows = rows;
        this.showEditRowsBtn = false;
        this.showMassEdit = false;
        this.showFiltersButton = true;
        this.showAddNewRowButton = true;
        this.canEditRows = canEdit;
        this.editToolTip = canEdit === false ? 'This table is read only' : '';

        if (!visualEditorMode) {
            this.showFiltersButton = false;
            this.showAddNewRowButton = false;
        }
    }

    data()
    {
        return {
            table: null,
            showAddNewRowButton: true,
            showDeleteRowButton: true,
            schema: null,
            tableName: null,
            tableRows: [],
            tableColumns: [],
            rowButtons: []
        };
    }

    mounted() {
        this.table = new Tabulator(this.$refs.table, { 
            height: "100%",    // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically
            layout: "fitDataFill", // fit columns to width of table 
            responsiveLayout: false,
            placeholder: this.placeHolderText, // display message to user on empty table
            pagination: "local",
            paginationSize: 50,
            paginationSizeSelector: [50, 100],
            cellEdited: this.cellEdited,
            rowSelectionChanged: this.selectionChanged, 
            invalidOptionWarnings: false,
            pageLoaded: this.deselectAllRows
        });
        this.showEditRows = false;
    }

    addButtonColumn(columns)
    {
        // add custom column for save and cancel buttons
        columns.push({
            title: "",
            width: 75,
            hozAlign: "center",
            resizable: false,
            headerSort: false,
            formatter: this.customCellSaveCancelButtons,
            cellClick: this.okCancelClicked
        });

        columns.unshift({
            field: "selectRow",
            title: "Select All Visible Rows",
            headerTooltip: true,
            formatter: "rowSelection",
            titleFormatter: "rowSelection",
            hozAlign: "center",
            headerSort: false,
            cellClick: function(e, cell) {
                cell.getRow().toggleSelect();
            }
        });
    }

    customCellSaveCancelButtons(cell, formatterParams, onRendered) {
        // cell - the cell component
        // formatterParams - parameters set for the column
        // onRendered - function to call when the formatter has been rendered

        cell.getElement().setAttribute("class", 'tabulator-cell okCancelCell');

        let rowIndex = cell.getRow().getPosition();

        let okBtn = document.createElement("a");
        okBtn.setAttribute("class", 'btn btn-xs');
        okBtn.setAttribute("data-recordnumber", cell.getData().recordnumber);

        let cancelBtn = document.createElement("a");
        cancelBtn.setAttribute("class", 'btn btn-xs');
        cancelBtn.setAttribute("data-recordnumber", cell.getData().recordnumber);
        cancelBtn.style.marginLeft = "15px";

        let okIcon = document.createElement("i");
        okIcon.setAttribute("class", "glyphicon glyphicon-ok");

        let cancelIcon = document.createElement("i");
        cancelIcon.setAttribute("class", "glyphicon glyphicon-remove text-red");

        let successIcon = document.createElement("i");
        successIcon.setAttribute("class", "glyphicon glyphicon-ok text-green text-3xl");
        successIcon.style.display = "none";
        successIcon.setAttribute('id', this.getSuccessIconId(rowIndex));

        okBtn.append(okIcon);
        cancelBtn.append(cancelIcon);

        if(this.rowButtons[rowIndex] === undefined) {
            this.rowButtons[rowIndex] = {
                visible: false,
                okClicked: false,
                cancelClicked: false
            };
        }

        let btnDiv = document.createElement("div");
        btnDiv.setAttribute('id', this.getOkCancelButtonId(rowIndex));
        btnDiv.setAttribute("class", 'okCancelBtn');

        if(this.rowButtons[rowIndex].visible) {
            btnDiv.style.display = "inline";
        }
        else {
            btnDiv.style.display = "none";
        }

        btnDiv.appendChild(okBtn);
        btnDiv.appendChild(cancelBtn);

        let mainDiv = document.createElement("div");
        mainDiv.appendChild(successIcon);
        mainDiv.appendChild(btnDiv);

        let savedRowButtons = this.rowButtons[rowIndex];

        okBtn.addEventListener("click", function()
        {
            savedRowButtons.saveClicked = true;
        });

        cancelBtn.addEventListener("click", function()
        {
            savedRowButtons.cancelClicked = true;
        });

        onRendered(function() {
            mainDiv.focus();
        });

        return mainDiv; //return the contents of the cell;
    }

    showSaveCancelButtons(rowNumber)
    {
        $('#' + this.getOkCancelButtonId(rowNumber)).show();

        this.rowButtons[rowNumber].visible = true;
    }

    hideSaveCancelButtons(rowNumber)
    {
        $('#' + this.getOkCancelButtonId(rowNumber)).hide();

        this.rowButtons[rowNumber].visible = false;
    }

    getOkCancelButtonId(rowNumber)
    {
        return `okCancelButtons-${rowNumber}`;
    }

    getSuccessIconId(rowNumber)
    {
        return `successIcon-${rowNumber}`;
    }

    showSuccessIcon(rowNumber) {
        $(`#${this.getSuccessIconId(rowNumber)}`).show(200, () => {
            setTimeout(() => {
                $(`#${this.getSuccessIconId(rowNumber)}`).fadeOut({
                    duration: 600,
                    complete: () => {
                        $(`#${this.getSuccessIconId(rowNumber)}`).hide();
                    }
                });
            }, 1500);
        });
    }

    selectionChanged() {
        if (this.table) {
            var selectedItems = this.getPagedSelectedData();

            if (selectedItems.length > 0) {
                this.showEditRows = true;
                this.selectedRowCount = selectedItems.length;
            } else {
                this.showEditRows = false;
            }
        }
    }

    selectedItemInPage (pageRows, item) {
        for (var i = 0; i < pageRows.length; i++) {
            var pageRow = pageRows[i];
            if (item.recordnumber === pageRow.data.recordnumber) {
                return true;
            }
        }
        return false;
    }

    getPagedSelectedData() {
        var pageRows = this.table.rowManager.getDisplayRows();
        var tableSelectedItems = this.table.getSelectedData();
        var selectedItems = [];

        for (var i = 0; i < tableSelectedItems.length; i++) {
            if (this.selectedItemInPage(pageRows, tableSelectedItems[i])) {
                selectedItems.push(tableSelectedItems[i]);
            }
        }
        return selectedItems;
    }

    deselectAllRows() {
        this.table.deselectRow();
    }

    closeMassEdit() {
        this.showMassEdit = false;
    }

    cellEdited(cell) {

        if (this.getCellOldValue(cell) === undefined) {
            this.saveCellOldValue(cell); // only save the old value if there's isn't already an orginal value saved
        }
        if (!this.showMassEdit) {
            this.showSaveCancelButtons(cell.getRow().getPosition());
        }
    }

    getRecordNumberColumnIndex() {
        for (var i = 0; i < this.table.columnManager.columns.length; i++) {
            var col = this.table.columnManager.columns[i];
            if (col.field === "recordnumber") {
                return i;
            }
        }
        return -1;
    }

    getRowPosition(recordNumber) {
        var data = this.table.getData();
        for (var i = 0; i < data.length; i++) {
            if (data[i]["recordnumber"] == recordNumber) {
                return i;
            }
        }
        return -1;
    }

    okCancelClicked(e, cell) {
        var recordNumberIndex = this.getRecordNumberColumnIndex();
        var recordNumberCell = cell.getRow().getCells()[recordNumberIndex];
        var pos = this.getRowPosition(recordNumberCell.getValue());
        let buttonState = this.rowButtons[pos];

        if(this.isNewRow(cell))
        {
            if(buttonState.saveClicked)
            {
                this.insertNewRow(cell.getRow());
                buttonState.saveClicked = false;
            }
            else if(buttonState.cancelClicked)
            {
                this.deleteNewRow(cell.getRow());
                buttonState.saveClicked = false;
            }
        }
        else
        {
            if(buttonState.saveClicked) {
                this.updateRow(cell.getRow());
                buttonState.saveClicked = false;
            }

            if(buttonState.cancelClicked)
            {
                this.cancelRowEdit(cell.getRow());
                buttonState.cancelClicked = false;
            }
        }
    }

    insertNewRow(row) {
        let columns = [];

        row.getCells().forEach(cell => {
            let columnName = cell.getColumn().getField();

            if (columnName === undefined || columnName === 'selectRow')
                return;  // skip the buttons column, checkbox column and the recordnumber column

            let value = cell.getValue();

            columns.push({
                    Column: columnName, 
                    Value: value
                });
        });

        let promise = this.$emitWithPromise("row-inserted", {
            tableName: this.tableName,
            schema: this.schema,
            columns: columns
        });

        promise.then(response =>
            {
                delete row.getData().isNewRow;
                this.updateRowData(row, response);
                
                this.hideSaveCancelButtons(row.getPosition());
                this.showSuccessIcon(row.getPosition());
            });

        // Note: For this, we don't handle errors (e.g. promise.catch) at the dataGrid level.
        // It's up to the client to show the error
        // We just keep the buttons visible until they fix the data
    }

    updateRowData(row, newData) {
        let data = row.getData();

        for (let fieldName in newData) {
            data[fieldName] = newData[fieldName];
        }

        var updatePromise = row.update(data);

        updatePromise.then(() => {
            row.getCells().forEach(cell => this.deleteCellOldValue(cell));
        });
    }

    deleteNewRow(row)
    {
        let promise = this.$emitWithPromise("delete-new-row", null);

        promise.then(response =>
            {
                row.delete();
            });
    }

    updateRow(row)
    {
        let updatedColumns = [];
        let recordnumber = row.getData().recordnumber;

        // find cells that have changed
        row.getCells().forEach(cell => {
            let oldValue = this.getCellOldValue(cell);

            if (oldValue !== undefined && oldValue !== cell.getValue())
            {
                let columnName = cell.getColumn().getField();
                let value = cell.getValue();

                updatedColumns.push({
                        Column: columnName, 
                        Value: value
                    });
            }
        });

        let promise = this.$emitWithPromise("row-updated", {
            schema: this.schema,
            tableName: this.tableName,
            recordnumber: recordnumber,
            updatedColumns: updatedColumns
        });

        promise.then(response => {
                this.updateRowData(row, response);
                this.hideSaveCancelButtons(row.getPosition());
                this.showSuccessIcon(row.getPosition());
            });
    }

    cancelRowEdit(row)
    {
        row.getCells().forEach(cell => {
            let oldValue = this.getCellOldValue(cell);
            if (oldValue !== undefined)
            {
                cell.setValue(oldValue);
                this.deleteCellOldValue(cell);
            }
        });

        this.hideSaveCancelButtons(row.getPosition());
    }

    // UI event handlers
    newRowButton_click()
    {
        let promise = this.table.addRow({isNewRow: true}, false);

        promise.then((row) => {
           this.showSaveCancelButtons(this.table.getDataCount() - 1);
        });

        promise.catch((error) => {
            alert(error); // unable to add new row??
        });
    }

    editRowsButton_click() {
        this.showMassEdit = true;
        this.massEditColumns = [];
        for (var i = 0; i < this.tableColumns.length; i++) {
            var col = this.tableColumns[i];
            if (col.field && col.field !== 'selectRow' ) {
                var displayVal = this.getMassEditColDisplayValue(col);
                var editCol = {
                    title: col.title,
                    hovering: false,
                    displayValue: displayVal,
                    editValue: displayVal != "Multiple Values" ? displayVal : "",
                    editing: false,
                    edited: false,
                    dataType: col.dataType,
                    show: col.editor !== null
                };

                this.massEditColumns.push(editCol);
            }
        }
    }

    getMassEditColDisplayValue(col) {
        var selectedItems = this.getPagedSelectedData();
        var displayValue = "Multiple Values";
        if (selectedItems.length > 0 && selectedItems[0][col.field]) {
            var firstValue = selectedItems[0][col.field];
            for (var i = 0; i < selectedItems.length; i++) {
                var rowValue = selectedItems[i][col.field].toLowerCase();
                if (rowValue != firstValue.toLowerCase()) {
                    return displayValue;
                }
            }
            return firstValue;
        }
    }

    deleteRowsButton_click() {
        let selectedData = this.getPagedSelectedData();

        var recordNumbers = [];
        for (var i = 0; i < selectedData.length; i++) {
            var row = selectedData[i];
            recordNumbers.push(row['recordnumber']);
        }

        let promise = this.$emitWithPromise('delete-rows', {
            Schema: this.schema,
            TableName: this.tableName,
            RecordIds: recordNumbers
        });

        promise.then(response => {
            for (var r = 0; r < recordNumbers.length; r++) {
                var recordNumber = recordNumbers[r];
                var rowPosition = this.getRowPosition(recordNumber);
                var row = this.table.getRowFromPosition(rowPosition);
                row.delete();
            }
            this.showEditRows = false;
        });
    }

    massUpdateBtn_clicked() {
        let selectedData = this.getPagedSelectedData();
        var recordNumbers = [];
        for (var i = 0; i < selectedData.length; i++) {
            var row = selectedData[i];
            recordNumbers.push(row['recordnumber']);
        }

        var columns = [];
        for (var c = 0; c < this.massEditColumns.length; c++) {
            var column = this.massEditColumns[c];
            if (column.editing) {
                var editColumn = {
                    Column: column.title,
                    Value: column.editValue
                };
                columns.push(editColumn);
            }
        }

        if (columns.length > 0) {

            var request = {
                Schema: this.schema,
                TableName: this.tableName,
                RecordIds: recordNumbers,
                Items: columns
            };

            let promise = this.$emitWithPromise('mass-update', request);

            promise.then(response => {
                // update the data in the view model
                for (var r = 0; r < recordNumbers.length; r++) {
                    var rowPosition = this.getRowPosition(recordNumbers[r]);
                    var row = this.table.getRowFromPosition(rowPosition);
                    if (row) {
                        for (var v = 0; v < columns.length; v++) {
                            var column = columns[v];
                            var cell = row.getCell(column.Column);
                            if (cell) {
                                cell.setValue(column.Value, true);
                                var columnName = column.Column;
                                var colValue = column.Value;
                                row.update({ columnName: colValue });
                            }
                        }
                    }
                }

                this.showMassEdit = false;
            });
        } else {
            showErrorToast('Error', 'No records updated because no data was updated');
        }
    }

    showFilters() {
        this.filtersVisible = true;
        this.$emitWithPromise('show-filters');
    }

    exportResultsButton_click() {
        this.$emitWithPromise('export-results', {
            schema: this.schema,
            tableName: this.tableName
        });
    }

    isNewRow(rowOrCell)
    {
        return rowOrCell.getData().isNewRow !== undefined;
    }

    saveCellOldValue(cell) {
        let key = this.getCellOldValueKey(cell);
        cell.getData()[key] = cell.getOldValue();
    }

    getCellOldValueKey(cell) {
        return cell.getColumn().getField() + "_OldValue";
    }

    getCellOldValue(cell) {
        let key = this.getCellOldValueKey(cell);
        return cell.getData()[key];
    }

    deleteCellOldValue(cell) {
        let key = this.getCellOldValueKey(cell);
        delete cell.getData()[key];
    }
}