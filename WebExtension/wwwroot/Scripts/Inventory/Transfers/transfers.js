var transfersFunctions = {
    deleteTransfer: function () {
        transfersFunctions.toggleDeleteModalButtons();

        $.post("/command/Inventory.Transfers.Delete",
            { transferId: $("#delete-transfer-id").val() },
            function (r) {
                if (r.Status == 0) {
                    location.reload();
                } else {
                    showErrorToast("Error", r.Message);
                    transfersFunctions.toggleDeleteModalButtons();
                }
            }
        );
    },

    shipTransfer: function () {
        transfersFunctions.toggleShipModalButtons();

        $.post("/command/Inventory.Transfers.MarkShipped",
            { transferId: $("#ship-transfer-id").val(), trackingNumber: $("#modal-tracking-number").val() },
            function (r) {
                if (r.Status == 0) {
                    location.reload();
                } else {
                    showErrorToast("Error", r.Message);
                    transfersFunctions.toggleShipModalButtons();
                }
            }
        );
    },

    showDeleteTransferModal: function (deleteTransferId) {
        $("#delete-transfer-id").val(deleteTransferId);
        $("#modal-delete-transfer").modal("show");
    },

    showShipTransferModal: function (shipTransferId) {
        $("#ship-transfer-id").val(shipTransferId);
        $("#modal-ship-transfer").modal("show");
    },

    toggleDeleteModalButtons: function () {
        $("#btn-delete-transfer").toggleClass("hidden");
        $("#btn-delete-transfer-cancel").toggleClass("hidden");
        $("#btn-delete-transfer-deleting").toggleClass("hidden");
    },

    toggleShipModalButtons: function () {
        $("#btn-ship-transfer").toggleClass("hidden");
        $("#btn-ship-transfer-cancel").toggleClass("hidden");
        $("#btn-ship-transfer-shipping").toggleClass("hidden");
    }
};