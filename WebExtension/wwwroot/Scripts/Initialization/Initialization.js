
$(document).ready(function () {
    GetStaticBinaryTestTree();
    GetStaticUnilevelTestTree();

    $('#btnPreviewEmail').click(function () {
        var url = '/Settings/';
        url += $('#emailType').val();
        url += '?associateId=' + $('#emailAssociateId').val();
        url += '&orderId=' + $('#emailOrderId').val();
        url += '&autoShipId=' + $('#autoShipId').val();
        url += '&message=' + encodeURIComponent($('#autoShipMessage').val());

        window.open(url);
    });
    $('#emailType').change(function () {
        var emailType = $('#emailType').val();
        
        if (emailType === 'welcomeDistributorEmail') {
            $('#emailOrderId').hide();
            $('#autoShipId').hide();
            $('#autoShipMessage').hide();
        }
        else if (emailType === 'welcomeCustomerEmail') {
            $('#emailOrderId').hide();
            $('#autoShipId').hide();
            $('#autoShipMessage').hide();
        }
        else if (emailType === 'orderReceiptEmail') {
            $('#emailOrderId').show();
            $('#autoShipId').hide();
            $('#autoShipMessage').hide();
        }
        else if (emailType === 'autoShipErrorEmail') {
            $('#emailOrderId').hide();
            $('#autoShipId').show();
            $('#autoShipMessage').show();
        }
    });
});

function GetPurgeStatistics() {
    try {
        $.get("/Initialization/GetPurgeStatistics?" + $.param({ "rootNode": 2 }))
            .done(function (purgeStats) {
                $("#associates-purged").text(purgeStats.asociatesToPurge) || $("#associates-purged").text("ERROR");
                $("#auto-ships-purged").text(purgeStats.autoShipsToPurge) || $("#auto-ships-purged").text("ERROR");
                $("#commission-runs-purged").text(purgeStats.commissionRunsToPurge) || $("#commission-runs-purged").text("ERROR");
                $("#orders-purged").text(purgeStats.ordersToPurge) || $("#orders-purged").text("ERROR");
            })
            .fail(function (error) {
                console.log(error);
            });
    }
    catch (ex) {
        console.log(ex);
    }
}

function GetStaticBinaryTestTree() {
    try {
        $.get("/Initialization/GetStaticBinaryTestTree")
            .done(function (testTree) {
                $("#binary-tree-info").text(JSON.stringify(testTree, undefined, 4));
            })
            .fail(function (error) {
                console.log(error);
            });
    }
    catch (ex) {
        console.log(ex);
    }
}

function GetStaticUnilevelTestTree() {
    try {
        $.get("/Initialization/GetStaticUnilevelTestTree")
            .done(function (testTree) {
                $("#unilevel-tree-info").text(JSON.stringify(testTree, undefined, 4));
            })
            .fail(function (error) {
                console.log(error);
            });
    }
    catch (ex) {
        console.log(ex);
    }
}

function CreateBinaryTree() {
    ToggleInitializationButtons();

    try {
        var valid = ValidateJson("binary-tree-info");
        if (valid) {
            $.ajax({ url: "/Initialization/CreateBinaryTestTree", dataType: "json", contentType: "application/json", method: "POST", data: $('#binary-tree-info').val() })
                .done(function () {
                    var successText = "Binary Test Tree created successfully!";
                    UpdateDynamicModal("Success", successText);
                    ToggleInitializationButtons();
                })
                .error(function (error) {
                    var errorText = "Error processing Binary Tree:\n\n" + GetErrorMessage(error);
                    UpdateDynamicModal("Error", errorText);
                    ToggleInitializationButtons();
                });
        }
    }
    catch (ex) {
        var exceptionText = "There was an error with Tree Creation.\n\n" + ex;
        UpdateDynamicModal("Exception", exceptionText);
        ToggleInitializationButtons();
    }
}

function CreateUnilevelTree() {
    ToggleInitializationButtons();

    try {
        var valid = ValidateJson("unilevel-tree-info");
        if (valid) {
            $.ajax({ url: "/Initialization/CreateUnilevelTestTree", dataType: "json", contentType: "application/json", method: "POST", data: $('#unilevel-tree-info').val() })
                .done(function () {
                    var successText = "Unilevel Test Tree created successfully!";
                    UpdateDynamicModal("Success", successText);
                    ToggleInitializationButtons();
                })
                .error(function (error) {
                    var errorText = "Error processing Unilevel Tree:\n\n" + GetErrorMessage(error);
                    UpdateDynamicModal("Error", errorText);
                    ToggleInitializationButtons();
                });
        }
    }
    catch (ex) {
        var exceptionText = "There was an error with Tree Creation.\n\n" + ex;
        UpdateDynamicModal("Exception", exceptionText);
        ToggleInitializationButtons();
    }
}

function PurgeTestData() {
    ToggleInitializationButtons();

    try {
        $.ajax({ method: "DELETE", url: "/Initialization/PurgeTestData?" + $.param({ "rootNode": 2 }) })
            .done(function () {
                var successText = "Data was purged successfully!";
                UpdateDynamicModal("Success", successText);
                ToggleInitializationButtons();
            })
            .fail(function (error) {
                var errorText = "Error purging test data.\n\n" + GetErrorMessage(error);
                UpdateDynamicModal("Error", errorText);
                ToggleInitializationButtons();
            });
    }
    catch (ex) {
        var exceptionText = "There was an error with Purging Test Data.\n\n" + ex;
        UpdateDynamicModal("Exception", exceptionText);
        ToggleInitializationButtons();
    }
}

function GetErrorMessage(error) {
    var exception = error.responseJSON.ExceptionMessage;
    if (!exception) {
        exception = error.responseJSON.Message;
    }
    return exception;
}

// Taken and modified from a post here: https://stackoverflow.com/a/26324037
function ValidateJson(testTree, prettyPrint = false) {
    try {
        var rawJson = $("#" + testTree).val();
        if (rawJson) {
            var obj = JSON.parse(rawJson);
            if (prettyPrint === true) {
                var prettyTestTree = JSON.stringify(obj, undefined, 4);
                $("#" + testTree).val(prettyTestTree);
            }
            return true;
        }
        else {
            var errorText = "Test Tree JSON cannot be empty!";
            UpdateDynamicModal("Error", errorText);
            return false;
        }
    }
    catch (ex) {
        var exceptionText = "Test Tree JSON is not correctly formatted!\n\n" + ex;
        UpdateDynamicModal("Exception", exceptionText);
        return false;
    }
}

function ValidateJsonInUi(testTree) {
    if (ValidateJson(testTree, true)) {
        UpdateDynamicModal("Success", "Your JSON is valid! 🙂");
    }
}

function UpdateDynamicModal(titleText, bodyText) {
    $("#initialization-modal-title").text(titleText);
    $("#initialization-modal-body").text(bodyText);

    $("#initialization-modal").modal("show");
}

function ToggleInitializationButtons() {
    var buttons = $(".initialization-button");
    if (buttons.is(":disabled") === true) {
        $(".processing-button-text").toggle();
        buttons.prop("disabled", false);
    }
    else {
        $(".processing-button-text").toggle();
        buttons.prop("disabled", true);
    }
}

function ToggleButtonById(buttonId, enabledText) {
    var button = $("#" + buttonId);
    if (button.is(":disabled") === true) {
        button.html(enabledText);
        button.prop("disabled", false);
    }
    else {
        button.prop("disabled", true);
        button.html("<span><span class='glyphicon glyphicon-refresh spinning'></span> Processing</span>");
    }
}