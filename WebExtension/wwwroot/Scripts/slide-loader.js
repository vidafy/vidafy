var pages = [];

const contentType = {
    URL: "URL",
    ELEMENT: "ELEMENT",
    AJAX_REDIRECT: "AJAX_REDIRECT"
};

var soLeftPosition = "10%";
var soWidth = "90%";
if (screen.width < 800) {
    soLeftPosition = "0px";
    soWidth = "100%";
}

function openPageSlideOut(event, content, pageContentType, title, onClose, onLoad) {
    //remove scrolling on page behind slideout
    window.scrollTo(0, 0);
    // if ctrl button was being held down AND the contentType is URL, then we just want to open the link in a new tab
    if (event && event.ctrlKey === true && pageContentType === contentType.URL) {
        if ($("#slideoutRedirect").length) {
            $("#slideoutRedirect").remove();
        }
        var link = '<a style="display:none" href="' + content + '" id="slideoutRedirect" target="_blank">redirect</a>';
        $("body").append(link);
        $("#slideoutRedirect")[0].click();
        return;
    }

    // if there is already a slideout page, move it to the left and under the mask
    if (pages.length > 0) {
        var lastPage = pages[pages.length - 1];
        $("#" + lastPage.id).animate({ "left": "0px", "width": "100%" });
        $("#" + lastPage.id).css("z-index", "1004");
    }

    // create new page with spinner and load slide it out
    var page = {
        id: 'slideout_' + pages.length
    };
    pages.push(page);
    var html = '<div class="slideout" id="' + page.id + '"><div class="slideout-header"><span class="close">×</span><h4 class="title">' + decodeURIComponent(title) + '</h4></div><div class="slideout-body"><span class="spinner"><i class="fa fa-spin fa-spinner"></i> Loading....</span><div></div></div>';
    $("body").append(html);
    

    // add mask if it isn't already there
    if (!$("#slideout-mask").length) {
        var mask = '<div id="slideout-mask"></div>';
        $("body").append(mask);

        $("#slideout-mask").on("click", function() {
            closeFromMask();
        });
    }

    // Deal with the different content types of the page
    switch (pageContentType) {
        case contentType.URL:
            $("#" + page.id).animate({ "left": soLeftPosition, "width": soWidth }, function() {
                $("#" + page.id + " .slideout-body").load(content, function (response, status, xhr) {
                    if (status === "error") {
                        $("#" + page.id + " .slideout-body").html(response);
                    }
                    finalizeSlideout(page);
                });

            });
            break;
        case contentType.ELEMENT:
            $("#" + page.id).animate({ "left": soLeftPosition, "width": soWidth }, function () {
                $("#" + page.id + " .slideout-body").empty();
                $("#" + page.id + " .slideout-body").append($(content));
                finalizeSlideout(page);
            });
            break;
        case contentType.AJAX_REDIRECT:
            $("#" + page.id).animate({ "left": soLeftPosition, "width": soWidth }, function () {
                $("#" + page.id + " .slideout-body").load(content.url, content.data, function (response, status, xhr) {
                    if (status === "error") {
                        $("#" + page.id + " .slideout-body").html(response);
                    }
                    finalizeSlideout(page);
                });
            });
            break;
    }

    // set up close event
    $("#" + page.id + ' .slideout-header .close').on("click", function() {
        closeSlideOut(page.id);
    });

    function closeSlideOut(id) {
        $("#" + id).animate({ "left": "100%" }).promise().done(function () {
            $("#" + id).remove();
            var index = 0;
            for (var i = 0; i < pages.length; i++) {
                if (pages[i].id === id) {
                    index = i;
                    break;
                }
            }
            pages.splice(index, 1);

            // if there are pages, move the top one over and over the mask
            if (pages.length > 0) {
                var lastPage = pages[pages.length - 1];
                $("#" + lastPage.id).animate({ "left": soLeftPosition, "width": soWidth });
                $("#" + lastPage.id).css("z-index", "1010");
            } else {
                // remove mask
                $("#slideout-mask").remove();
            }
        });
        /*eslint-disable */
        try {
            onClose();
        } catch (e) {
        }
        /*eslint-enable */
    }

    function closeFromMask() {
        var lastPage = pages[pages.length - 1];
        closeSlideOut(lastPage.id);
    }

    // this function will make small content use the whole page and large content scroll
    function finalizeSlideout(page) {
        $("#" + page.id).css("height", "auto");
        var windowHeight = $(window.top).height();
        var slideOutHeight = document.getElementById(page.id).scrollHeight;
        if (slideOutHeight < windowHeight) {
            $("#" + page.id).css("height", "100%");
        }

        try {
            if (onLoad) {
                onLoad();
            }
        } catch (e) {
            console.log(e);
        }
    }
}