function getApis() {
    var apis = [];
    $.each($('span.path a'), function (i, val) {
        apis.push($(val).text());
    });
    return apis;
};

function selectApiByName(api) {
    // find the API element
    var $api = $('span.path a').filter(function () {
        return $(this).text() === api;
    });

    // display parent elements and scroll to the API
    if ($api != null && $api.length === 1) {
        $api.closest('ul.endpoints').show();
        $api.closest('div.heading').next().show();
        $api[0].scrollIntoView({ behavior: 'auto' });
    }
}

function closeDialog() {
    if ($('#searchDialog').hasClass('ui-dialog-content')) {
        if ($('#searchDialog').dialog('isOpen')) {
            $('#searchDialog').dialog('close');
        }
    }
}

function showDialog() {
    if ($('#searchDialog').hasClass('ui-dialog-content')) {
        if ($('#searchDialog').dialog('isOpen')) {
            $('#searchDialog').dialog('close');
        }
    }
    else {
        $('#searchDialog').dialog({
            resizable: false,
            draggable: false,
            closeOnEscape: true,
            width: 600,
            height: 85,
            modal: true
        });
    }

    $('#customSearch').val('');
    $('#searchDialog').dialog('open');
}

$('<link/>', {
    rel: 'stylesheet',
    type: 'text/css',
    href: '//code.jquery.com/ui/1.13.0/themes/base/jquery-ui.min.css'
}).appendTo('head');

$.ajaxSetup({ cache: true });
$.getScript('//code.jquery.com/ui/1.13.0/jquery-ui.min.js', function () {
    $('body').append('<div id="searchDialog" title="API Search"><input id="customSearch" type="text" style="width: 560px;" /></div>');

    var apis = getApis();
    $('#customSearch').autocomplete({ source: apis });
    $('.ui-autocomplete').css('z-index', '1000');

    $('#customSearch').on('autocompleteselect', function (event, ui) {
        $('#searchDialog').dialog('close');
        selectApiByName(ui.item.value);
    });

    $(window).keydown(function (event) {
        if (event.keyCode === 27) {
            // escape key pressed, close the dialog if it's open
            closeDialog();
        }
        if (event.ctrlKey && event.shiftKey && event.keyCode === 70) {
            // Control-Shift-F pressed, show the search dialog
            event.preventDefault();
            showDialog();
        }
    });

    // handle click-offs
    $('body').on('click', '.ui-widget-overlay', closeDialog);

    // this is to indicate that search is ready
    $('#logo span.logo__title').html('swagger *');
    $('#logo').attr('title', 'Control-Shift-F to search');
});