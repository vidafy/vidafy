class SqlEditorClient
{
    getTables() {
        return $.get('/command/SqlEditor/Tables');
    }

    runVisualQuery(table, filters, sortFilters)
    {
        const url = "/command/SqlEditor/RunVisualQuery";

        let postRequest = {
            Schema: table.Schema,
            TableName: table.Name,
            Filters: filters,
            SortFilters: sortFilters
        };

        return $.post(url, postRequest);
    }

    runSqlQuery(sql)
    {
        const url = "/command/SqlEditor/RunSqlQuery";

        let postRequest = { Sql: sql };

        return $.post(url, postRequest);
    }

    insertRow(schema, tableName, cells)
    {
        const url = "/command/SqlEditor/InsertRow";

        let postRequest = 
        {
            Schema: schema,
            TableName : tableName,
            Row: {
                Cells: cells
            }
        };

        return $.post(url, postRequest);
    }

    updateRow(schema, tableName, rowRecordNumber, cells)
    {
        const url = "/command/SqlEditor/UpdateRow";

        let postRequest = 
        {
            Schema: schema,
            TableName : tableName,
            RowRecordNumber : rowRecordNumber,
            Row: {
                Cells: cells
            }
        };

        return $.post(url, postRequest);
    }

    massUpdate(request) {
        var url = "/command/SqlEditor/MassUpdate";
        return $.post(url, request);
    }

    deleteRows(request)
    {
        const url = "/command/SqlEditor/DeleteRows";
        return $.post(url, request);
    }

    exportVisualQuery(schema, tableName, filters) {
        debugger;
        const apiUrl = "/command/SqlEditor/ExportVisualQuery";

        return fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Schema: schema,
                TableName: tableName,
                Filters: filters
            })
        });
    }

    exportSqlQuery(sql) {
        const apiUrl = "/command/SqlEditor/ExportSqlQuery";

        return fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Sql: sql
            })
        });
    }
}