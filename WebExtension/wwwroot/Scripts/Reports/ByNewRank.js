
$(function () {
    UpdatePage();
});

function UpdatePage() {
    $('#reportResultsHTML').html('<div style="border: 1px dotted #ddd;"><div style="display: table; margin: 0 auto; padding-top: 14px; padding-bottom: 14px;"><img src="/Images/ajaxload.gif" /></div></div>');

    var periodId = $('#period').val();
    var rank = $('#rank').val();
    $("#reportResultsHTML").load("/Corporate/Reports/Associates/ByNewRankResults", { PeriodID: periodId, Rank: rank });
}

function exportReport() {
    var periodId = $('#period').val();
    var rank = $('#rank').val();
    window.location.href = "ByNewRankResults/Export/?periodId=" + periodId + "&rank=" + rank;
}