$(function () {
    $("#button-add-homepage").click(homepageFunctions.setupAddModal);
    $("#button-delete-homepage").click(homepageFunctions.deleteHomepage);
    $("#button-edit-homepage").click(homepageFunctions.saveHomepage);
    $('#default-tool-tip').tooltip();

    $(".btn-delete").click(function () {
        homepageFunctions.setupDeleteModal($(this));
    });

    $(".btn-edit").click(function () {
        homepageFunctions.setupUpdateModal($(this));
    });

    $("input[name='isDefault']").click(function () {
        homepageFunctions.setDefaultHomepage($(this));
    });
});

var homepageFunctions = {
    createHomepage: function(homepage) {
        $.post("/Command/Corporate/Users/Homepages/Create",
            { homepage: homepage },
            function(r) {
                if (r.Status === 0) {
                    location.reload();
                } else {
                    showErrorToast("Error", r.Message);
                }
            }
        );
    },

    deleteHomepage: function() {
        $.post("/Command/Corporate/Users/Homepages/Delete",
            { homepageId: $("#delete-homepage-id").val() },
            function(r) {
                if (r.Status === 0) {
                    location.reload();
                } else {
                    showErrorToast("Error", r.Message);
                }
            }
        );
    },

    saveHomepage: function() {
        let homepage = {
            homepageId: parseInt($("#edit-homepage-id").val()),
            description: $("#homepage-description").val(),
            url: $("#homepage-url").val()
        };

        if (!homepageFunctions.validateHomepage(homepage)) {
            return;
        }

        if (homepage.homepageId > 0) {
            homepageFunctions.updateHomepage(homepage);
        } else {
            homepageFunctions.createHomepage(homepage);
        }
    },

    setupAddModal: function () {
        $("#homepage-description").val("");
        $("#homepage-url").val("");
        $("#title-edit-homepage").html("Add");
        $("#edit-homepage-id").val(0);
    },

    setupDeleteModal: function(deleteButton) {
        let grandparent = deleteButton.parent().parent();
        let description = $(grandparent).children().first().text();
        $("#delete-homepage-description").html(description);

        let homepageId = grandparent.data("homepage-id");
        $("#delete-homepage-id").val(homepageId);
    },

    setupUpdateModal: function (editButton) {
        let parentSiblings = editButton.parent().siblings();
        let description = $(parentSiblings[0]).text();
        let url = $(parentSiblings[1]).text();
        $("#homepage-description").val(description);
        $("#homepage-url").val(url);

        $("#title-edit-homepage").html("Edit");

        let homepageId = editButton.parent().parent().data("homepage-id");
        $("#edit-homepage-id").val(homepageId);
    },

    updateHomepage: function (homepage) {
        $.post("/Command/Corporate/Users/Homepages/Update",
            { homepage: homepage },
            function (r) {
                if (r.Status === 0) {
                    location.reload();
                } else {
                    showErrorToast("Error", r.Message);
                }
            }
        );
    },

    setDefaultHomepage: function (radioButton) {
        $.post("/Command/Corporate/Users/Homepages/SetDefaultHomepage",
            { homepageId: radioButton.val() },
            function (r) {
                if (r.Status === 0) {
                    // Reset the delete buttons
                    $(".btn-delete").removeClass("hidden");

                    // Hide the new default's delete button
                    radioButton.parent().siblings().last().children(".btn-delete").addClass("hidden");

                    showSuccessToast("Success", "Default Homepage successfully set.");
                } else {
                    showErrorToast("Error", r.Message);
                }
            }
        );
    },

    validateHomepage: function (homepage) {
        let passedValidation = true;
        let errors = [];

        if (homepage.description == null || homepage.description.trim() === "") {
            errors.push("A valid Description is required");
            passedValidation = false;
        }

        if (homepage.url == null || homepage.url.trim() === "") {
            errors.push("A valid URL is required");
            passedValidation = false;
        }

        if (!passedValidation) {
            let errorText = `<br/>${errors.join("<br/>")}`;
            showErrorToast("Validation Error", errorText);
        }

        return passedValidation;
    }
};