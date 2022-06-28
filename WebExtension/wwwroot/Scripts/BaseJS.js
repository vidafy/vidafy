$(function () {

    $('#side-menu').metisMenu();

});

//Loads the correct sidebar on window load,
//collapses the sidebar on window resize.
$(function() {
    $(window).bind("load resize",
        function() {
            if ($(this).width() < 768) {
                $('div.sidebar-collapse').addClass('collapse');
            } else {
                $('div.sidebar-collapse').removeClass('collapse');
            }
        });
});

function showSuccessToast(title, message) {
    $.toaster({ priority: 'success', title: title, message: message });
}

function showErrorToast(title, message) {
    $.toaster({ priority: 'danger', title: title, message: message });
}

function showInfoToast(title, message) {
    $.toaster({ priority: 'info', title: title, message: message });
}

function showLoadingModal(loadingText) {
    var text = " Loading....";
    if (loadingText) {
        text = loadingText;
    }

    var loadingModal =
        `<div id="loadingModal" class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-lg">
            <div class="bg-white border border-medium-light-grey p-8">
                <svg class="animate-spin mr-4 h-8 w-8 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="text-3xl">` + text + `</span>
            </div>
        </div>`;
    $("body").append(loadingModal);
}

function hideLoadingModal() {
    $("#loadingModal").remove();
}
