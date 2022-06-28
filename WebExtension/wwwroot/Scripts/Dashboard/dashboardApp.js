

$(document).ready(function () {
    dashboardApp.$mount("#dashboardApp");
    dashboardApp.periodType = 'Month';
    dashboardApp.loadPeriodData();
    dashboardApp.getModelData();
    $('.tt').tooltip();
});

function getAssociateTypes() {
    $.get('/Dashboard/AssociateTypes')
        .then(function (response) {
            dashboardApp.associateTypes = response;
            dashboardApp.selectedAssociateType = response[0];
            getTopEnrollers(dashboardApp.selectedAssociateType);
        });
}

function getAverageOrders() {
    var req = {
        PeriodType: dashboardApp.periodType
    };

    dashboardApp.averageOrdersLoading = true;

    $.post('/Dashboard/AverageOrders', req)
        .then(function (response) {
            dashboardApp.averageOrders = response.AverageOrders;
            dashboardApp.averageOrdersLoading = false;
        });
}

function getCountrySales() {
    dashboardApp.countrySalesLoading = true;
    var req = {
        PeriodType: dashboardApp.periodType
    };

    $.post('/Dashboard/CountrySales', req)
        .then(function (response) {
            dashboardApp.countrySales = response;
            dashboardApp.countrySalesLoading = false;
        });
}

function getModelData() {
    $.get('/Dashboard/ModelData')
        .then(function (response) {
            dashboardApp.modelData = response;
            dashboardApp.getRankCounts('Current');
        });
}

function getNewAssociates() {
    dashboardApp.newAssociatesLoading = true;
    var req = {
        PeriodType: dashboardApp.periodType
    };

    $.post('/Dashboard/NewAssociates', req)
        .then(function (response) {
            dashboardApp.newAssociates = response;
            dashboardApp.newAssociatesLoading = false;
        });
}

function getProductImage(product, height) {
    return '/CMS/Images/Inventory' + product.ImagePath + '?height=' + height;
}

function getRankCounts(rankType) {
    var req = {
        RankType: rankType
    };

    switch (rankType) {
        case 'Current':
            dashboardApp.selectedRankTypeDisplay = dashboardApp.modelData.CurrentRankName;
            break;
        case 'Paid':
            dashboardApp.selectedRankTypeDisplay = dashboardApp.modelData.LastRankName;
            break;
        case 'Highest':
            dashboardApp.selectedRankTypeDisplay = dashboardApp. modelData.HighRankName;
            break;
    }

    dashboardApp.selectedRankType = rankType;
    dashboardApp.rankCountsLoading = true;

    $.post('/Dashboard/RankCounts', req)
        .then(function(response) {
            dashboardApp.rankCounts = response;
            dashboardApp.rankCountsLoading = false;
        });
}

function getSalesTotals() {
    dashboardApp.salesTotalsLoading = true;
    var req = {
        PeriodType: dashboardApp.periodType
    };

    $.post('/Dashboard/SalesComparisons', req)
        .then(function(response) {
            dashboardApp.salesTotals = response;
            dashboardApp.salesTotalsLoading = false;
        });
}

function getSalesHistoryByTypeChart() {
    if (dashboardApp.salesHistoryByTypeChart != null) {
        dashboardApp.salesHistoryByTypeChart.destroy();
    }

    var req = {
        PeriodType: dashboardApp.periodType
    };
    if (req.PeriodType === 'Month' || req.PeriodType === 'Week') {
        dashboardApp.showCharts = true;
        dashboardApp.salesHistoryByTypeLoading = true;
        $.post('/Dashboard/SalesHistoryByTypeChart', req)
            .then(function (response) {
                dashboardApp.salesHistoryByTypeLoading = false;
                var byTypeConfig = {
                    type: 'bar',
                    data: response.data,
                    options: {
                        responsive: true,
                        transitions: {
                            show: {
                                animations: {
                                    y: {
                                        from: 0
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                stacked: true
                            },
                            y: {
                                stacked: true
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        var value = context.dataset.data[context.dataIndex];
                                        return new Intl.NumberFormat('en-US',
                                            { style: 'currency', currency: 'USD' }).format(value);
                                    }
                                }
                            }
                        }
                    },
                    
                };
                var ctx = $("#salesByType");
                dashboardApp.salesHistoryByTypeChart = new Chart(ctx, byTypeConfig);
            });
    } else {
        dashboardApp.showCharts = false;
    }
}

function getSalesHistoryChart() {
    if (dashboardApp.salesHistoryChart != null) {
        dashboardApp.salesHistoryChart.destroy();
    }

    var req = {
        PeriodType: dashboardApp.periodType
    };
    if (req.PeriodType === 'Month' || req.PeriodType === 'Week') {
        dashboardApp.showCharts = true;
        dashboardApp.salesHistoryLoading = true;
        $.post('/Dashboard/SalesHistoryChart', req)
            .then(function (response) {
                dashboardApp.salesHistoryLoading = false;
                var histConfig = {
                    type: 'line',
                    data: response.data,
                    options: {
                        responsive: true,
                        interaction: {
                            mode: 'index',
                            intersect: false
                        },
                        stacked: false,
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        if (context.dataset.subLabels != null) {
                                            var label = context.dataset.subLabels[context.dataIndex] || '';
                                            if (label) {
                                                label += ': ';
                                            }
                                            if (context.parsed.y !== null) {
                                                label += new Intl.NumberFormat('en-US',
                                                    { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                                            }
                                            return label;
                                        } else {
                                            return 'Sales: ' + new Intl.NumberFormat('en-US',
                                                { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                                        }
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                type: 'linear',
                                display: true,
                                position: 'left'
                            }
                        }
                    }
                };
                var histChart = $("#salesHistory");
                dashboardApp.salesHistoryChart = new Chart(histChart, histConfig);
            });
    } else {
        dashboardApp.showCharts = false;
    }
}

function getTopEnrollers(associateType) {
    var req = {
        PeriodType: dashboardApp.periodType,
        AssociateTypeId: associateType.AssociateType
    };

    dashboardApp.selectedAssociateType = associateType;
    dashboardApp.topEnrollersLoading = true;

    $.post('/Dashboard/TopEnrollers', req)
        .then(function (response) {
            dashboardApp.topEnrollers = response.TopEnrollers;
            dashboardApp.topEnrollersLoading = false;
        });
}

function getTopProducts() {
    var req = {
        PeriodType: dashboardApp.periodType
    };

    dashboardApp.topProductsLoading = true;

    $.post('/Dashboard/TopProducts', req)
        .then(function (response) {
            dashboardApp.topProducts = response.TopProducts;
            dashboardApp.topProductsLoading = false;
        });
}

function showSalesReport(orderTypeId, reportName) {
    openPageSlideOut(event, '/Corporate/Reports/Dashboard/Sales?periodType=' + dashboardApp.periodType + '&orderTypeId=' + orderTypeId, 'URL', reportName);
}

function showCountrySalesReport() {
    openPageSlideOut(event, '/Corporate/Reports/Dashboard/CountrySales?periodType=' + dashboardApp.periodType, 'URL', 'Country Sales');
}

function showProductSalesReport() {
    openPageSlideOut(event, '/Corporate/Reports/Dashboard/ProductSales?periodType=' + dashboardApp.periodType, 'URL', 'Product Sales');
}

function showTopEnrollersReport() {
    openPageSlideOut(event, '/Corporate/Reports/Dashboard/TopEnrollers?periodType=' + dashboardApp.periodType + '&associateTypeId=' + dashboardApp.selectedAssociateType.AssociateType, 'URL', 'Top Enrollers');
}

function showNewAssociatesReport() {
    openPageSlideOut(event, '/Corporate/Reports/Dashboard/NewAssociates?periodType=' + dashboardApp.periodType, 'URL', 'New Associates');
}


var dashboardApp = new Vue({
    data: {
        associateTypes: null,
        averageOrders: null,
        averageOrdersLoading: false,
        countrySales: null,
        countrySalesLoading: false,
        modelData: null,
        newAssociates: null,
        newAssociatesLoading: false,
        periodType: 'Month',
        rankCounts: null,
        rankCountsLoading: false,
        salesHistoryLoading: false,
        salesHistoryChart: null,
        salesHistoryByTypeLoading: false,
        salesHistoryByTypeChart: null,
        salesTotalsLoading: false,
        salesTotals: null,
        selectedAssociateType: null,
        selectedRankType: null,
        selectedRankTypeDisplay: null,
        topEnrollers: null,
        topEnrollersLoading: false,
        topProducts: null,
        topProductsLoading: false
    },
    methods: {
        loadPeriodData: function() {
            getSalesTotals();
            getSalesHistoryChart();
            getSalesHistoryByTypeChart();
            getCountrySales();
            getAssociateTypes();
            getAverageOrders();
            getTopProducts();
            getNewAssociates();
        },
        getRankCounts: function(rankType) {
            getRankCounts(rankType);
        },
        getModelData: function () {
            getModelData();
        }
    }
});