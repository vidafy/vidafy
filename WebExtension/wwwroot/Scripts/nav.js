$(document).ready(function () {
    var req = {};
    if (window.location.href.indexOf('Login') < 0) {
        $.post('/UI/Navigation/', req)
            .done(function (response) {
                $("#navLoading").hide();
                $.each(response.NavItems, function (index, navItem) {
                    var navItemTemplate = '';
                    if (navItem.SubNavItems.length > 0) {
                        navItemTemplate = $("#menuCategoryTemplate").html();
                        var subNavItems = '<div class="categoryItems my-4" style="display: none">';
                        $.each(navItem.SubNavItems, function (sIndex, subNavItem) {
                            var subNavItemTemplate = $("#subNavItemTemplate").html();
                            subNavItemTemplate = subNavItemTemplate.replace(/\__subNavLink__/g, subNavItem.Link);
                            subNavItemTemplate = subNavItemTemplate.replace(/\__subNavText__/g, subNavItem.Text);
                            navItemTemplate = navItemTemplate.replace(/\__subNavItemsToggle__/g, $("#subNavItemsToggleTemplate").html());
                            subNavItems += subNavItemTemplate;
                        });
                        subNavItems += '</div>';
                        navItemTemplate = navItemTemplate.replace(/\__subNavItems__/g, subNavItems);
                    } else {
                        navItemTemplate = $("#menuCategorySingleItemTemplate").html();
                        navItemTemplate = navItemTemplate.replace(/\__navLink__/g, navItem.Link);
                    }

                    navItemTemplate = navItemTemplate.replace(/\__iconClass__/g, navItem.Icon);
                    navItemTemplate = navItemTemplate.replace(/\__navItemText__/g, navItem.Text);
                    $("#navItemsContainer").append(navItemTemplate);
                });

                $(".categoryHdr > .categoryHdrItem").on("click", function () {
                    if ($(this).hasClass("active")) {
                        $(this).removeClass("active");
                        $(this).siblings(".categoryItems").slideUp(200);
                        $(".categoryHdr > .categoryHdrItem .toggle").removeClass("bi-chevron-up").addClass("bi-chevron-down");
                    } else {
                        $(".categoryHdr > .categoryHdrItem .toggle").removeClass("bi-chevron-up").addClass("bi-chevron-down");
                        $(this).find('.toggle').removeClass("bi-chevron-down").addClass("bi-chevron-up");
                        $(".categoryHdr > .categoryHdrItem").removeClass("active");
                        $(this).addClass("active");
                        $(".categoryItems").slideUp(200);
                        $(this).siblings(".categoryItems").slideDown(200);
                    }
                });
            });

        setCurrentTime();
        setPageTabOverflow();
    }
});

function setCurrentTime() {
    var time = new Date();
    $("#currentTime").html(time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }));
    setTimeout(function () {
        setCurrentTime();
    }, 10000);
}

function setPageTabOverflow() {
    var overflowCandidates = $('.overflow-candidate');
    $.each(overflowCandidates,
        function (index, item) {
            // add responsive class to hide on smaller screens
            $(item).closest('.page-tab-container').addClass('hideMedium');

            // add link to the overflow menu and add responsive class to show on > medium screens
            var overflowLink = $(item).parent().html().replace('page-tab', '');
            var overflowElement = $('<li></li>').append(overflowLink);
            overflowElement.first().addClass('showMedium');
            $("#pageTabOverflow").append(overflowElement);
        });
}

function showNav() {
    $("#navMenu").fadeIn(300);
    $("#navOpener").fadeOut(300);
}

function closeNav() {
    $("#navMenu").fadeOut(300);
    $("#navOpener").fadeIn(300);
}

function toggleProfile() {
    if ($("#profileDropdown").is(":visible")) {
        $("#profileDropdown").fadeOut(200);
    } else {
        $("#profileDropdown").fadeIn(200);
    }
}

function toggleAdminTools() {
    if ($("#CMSNav").is(":visible")) {
        $("#CMSNav").fadeOut(200);
    } else {
        $("#CMSNav").fadeIn(200);
    }
}
