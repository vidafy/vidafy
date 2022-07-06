var editTransferFunctions = {
    addLineItem: function () {
        // Grab values from modal
        var itemId = $("#ItemList").val();
        var itemSku = $("#ItemList_SKU").val();
        var qty = parseFloat($("#dialogQty").val());
        var price = parseFloat($("#dialogPrice").val());
        var totalPrice = Math.round((price * qty) * 100) / 100;

        // Don't continue if the item fails validation
        if (!editTransferFunctions.validateItemAdd(itemId, itemSku, qty, price)) {
            return;
        }

        // Copy and populate template
        var lineItemTemplate = $("#template-transfer-line-item");
        var lineItem = $(lineItemTemplate.html());

        lineItem.prepend(`<td>$${totalPrice.toFixed(2)}</td>`);
        lineItem.prepend(`<td>$${price.toFixed(2)}</td>`);
        lineItem.prepend(`<td>${qty.toFixed(2)}</td>`);
        lineItem.prepend(`<td>${$("#ItemList_PNAME").val()}</td>`);
        lineItem.prepend(`<td>${itemSku}</td>`);

        $(lineItem).attr("data-item", itemId);
        $(lineItem).attr("data-qty", qty);
        $(lineItem).attr("data-price", price);
        $(lineItem).attr("data-total-price", totalPrice);

        // Append the new line item to the table
        var lineItemPosition = $("#line-item-index").val();
        if (lineItemPosition >= 0) {
            var lineItemToReplace = $("#detail > tbody > tr")[lineItemPosition];
            $(lineItemToReplace).replaceWith(lineItem);
        } else {
            $("#detail > tbody").append(lineItem);
        }

        // Update the Subtotal
        editTransferFunctions.updateSubTotal();
    },

    removeLineItem: function (lineItem) {
        $(lineItem).closest("tr").remove();

        // Update the Subtotal
        editTransferFunctions.updateSubTotal();
    },

    saveTransfer: function () {
        var fromWarehouseId = $("#from-warehouse").val();
        var toWarehouseId = $("#to-warehouse").val();
        var tableLineItems = $("#detail > tbody > tr");

        // Don't continue on if the transfer fails validation
        if (!editTransferFunctions.validateTransfer(fromWarehouseId, toWarehouseId, tableLineItems)) {
            return;
        }

        editTransferFunctions.togglePageButtons();

        var lineItems = [];
        tableLineItems.each(function () {
            lineItems.push({
                itemId: $(this).attr("data-item"),
                qty: $(this).attr("data-qty"),
                price: $(this).attr("data-price")
            });
        });

        var transfer = {
            transferId: $("#transfer-id").val(),
            fromWarehouseId: fromWarehouseId,
            toWarehouseId: toWarehouseId,
            shipMethod: $("#shipMethod").val(),
            notes: $("#notes").val(),
            shippingCost: $("#ShipCost").val(),
            mfNumber: $("#MFNum").val(),
            baNumber: $("#BANum").val(),
            packageCount: $("#PackCount").val(),
            lineItems: lineItems
        };

        $.post("/command/Inventory.Transfers.SaveTransfer",
            { transfer: transfer },
            function (r) {
                if (r.Status === 0) {
                    window.location = "/Corporate/Inventory/Transfers";
                } else {
                    showErrorToast("Error", r.Message);
                    editTransferFunctions.togglePageButtons();
                }
            }
        );
    },

    showErrorModal: function (errorText) {
        $("#modal-error-list").html(errorText);
        $("#modal-error").modal("show");
    },

    showLineItemModal: function (lineItem) {
        if (lineItem) {
            var itemId = $(lineItem).closest("tr").attr("data-item");
            $("#ItemList").val(itemId).trigger("chosen:updated").change();
            $("#dialogQty").val(parseFloat($(lineItem).closest("tr").attr("data-qty")).toFixed(2));
            $("#dialogPrice").val(parseFloat($(lineItem).closest("tr").attr("data-price")).toFixed(2));

            $("#line-item-index").val($(lineItem).closest("tr").index());
        } else {
            $("#ItemList").val("").trigger("chosen:updated").change();
            $("#dialogQty").val("");
            $("#dialogPrice").val("");

            $("#line-item-index").val(-1);
        }

        $("#modal-add-line-item").modal("show");
    },

    togglePageButtons: function () {
        $("#btn-main-save").toggleClass("hidden");
        $("#btn-main-cancel").toggleClass("hidden");
        $("#btn-main-saving").toggleClass("hidden");
    },

    updateSubTotal: function () {
        var subTotal = 0;
        $("#detail > tbody > tr").each(function () {
            subTotal += parseFloat($(this).attr("data-total-price"));
        });

        $("#line-items-sub-total").html(`$${subTotal.toFixed(2)}`);
    },

    validateItemAdd: function (itemId, itemSku, qty, price) {
        var passedValidation = true;
        var errorText = "";

        if (!itemId || isNaN(parseInt(itemId))) {
            errorText += "<li>Please select a valid item.</li>";
            passedValidation = false;
        }

        var qtyPassedValidation = true;
        if (!qty || isNaN(parseFloat(qty))) {
            errorText += "<li>Please enter a valid quantity.</li>";
            passedValidation = false;
            qtyPassedValidation = false;
        }

        if (qtyPassedValidation && parseFloat(qty) <= 0) {
            errorText += "<li>Qty must be greater than 0.</li>";
            passedValidation = false;
        }

        var pricePassedValidation = true;
        if (!price || isNaN(parseFloat(price))) {
            errorText += "<li>Please enter a valid price.</li>";
            passedValidation = false;
            pricePassedValidation = false;
        }

        if (pricePassedValidation && parseFloat(price) < 0) {
            errorText += "<li>Price cannot be a negative number.</li>";
            passedValidation = false;
        }

        $("#detail > tbody > tr").each(function () {
            if (itemId === $(this).attr("data-item") && $("#line-item-index").val() < 0) {
                passedValidation = false;
                errorText += `<li>Item '${itemSku}' already exists as a line item.</li>`;
            }
        });

        if (!passedValidation) {
            editTransferFunctions.showErrorModal(errorText);
        }

        return passedValidation;
    },

    validateTransfer: function (fromWarehouseId, toWarehouseId, tableLineItems) {
        var passedValidation = true;
        var errorText = "";

        if (!fromWarehouseId) {
            errorText += "<li>Please select a valid 'From Warehouse'.</li>";
            passedValidation = false;
        }

        if (!toWarehouseId) {
            errorText += "<li>Please select a valid 'To Warehouse'.</li>";
            passedValidation = false;
        }

        if (fromWarehouseId === toWarehouseId) {
            errorText += "<li>A Warehouse cannot initiate a transfer to itself. Please select a different option.</li>";
            passedValidation = false;
        }

        if (tableLineItems.length < 1) {
            errorText += "<li>No Line Items currently exist for the transfer. Please add a valid Line Item.</li>";
            passedValidation = false;
        }

        if (!passedValidation) {
            editTransferFunctions.showErrorModal(errorText);
        }

        return passedValidation;
    }
};
