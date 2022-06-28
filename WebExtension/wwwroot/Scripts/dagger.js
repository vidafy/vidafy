function doSearch() {
    $("#results").empty();

    if (isOnlyUppercase($("#searchTextbox").val()) && $("#searchTextbox").val().length > 1) {
        doCamelSearch();
    } else {
        doNormalSearch();
    }
    
    bindAPIClicks();
}

function doCamelSearch() {
    var search = $("#searchTextbox").val();
    for (var i = 0; i < _apis.length; i++) {
        if (camelCount(_apis[i].Name, search) >= search.length) {
            appendResult(_apis[i], getCamelSearchResult(search, _apis[i].Name), _apis[i].Tags);
        }
    }
}

function filterByTag() {
    _selectedTag = $("#tagFilter").val();
    doSearch();
}

function getCamelSearchResult(search, apiName) {
    var res = "";
    var currIndex = 0;

    for (var i = 0; i < apiName.length; i++) {
        if (apiName[i] == search[currIndex]) {
            res += "<span>" + apiName[i] + "</span>";
            currIndex++;
        } else {
            res += apiName[i];
        }
    }

    return res;
}

function camelCount(apiName, search) {
    var currIndex = 0;
    var cnt = 0;
    for (var i = 0; i < search.length; i++) {
        var idx = apiName.indexOf(search[i], currIndex);

        if (idx > 0 && idx >= currIndex) {
            cnt++;
            currIndex = idx;
        }
    }

    return cnt;
}

function doNormalSearch() {
    var search = $("#searchTextbox").val().toLowerCase();

    for (var i = 0; i < _apis.length; i++) {
        if (search == "" || _apis[i].Name.toLowerCase().includes(search)) {
            appendResult(_apis[i], getNormalSearchResult(search, _apis[i].Name), _apis[i].Tags);
        }
    }
}

function getNormalSearchResult(search, apiName) {
    var startPos = apiName.toLowerCase().indexOf(search);
    var part1 = apiName.substring(0, startPos);
    var part2 = apiName.substring(startPos, startPos + search.length);
    var part3 = apiName.substring(startPos + search.length);
    return part1 + "<span>" + part2 + "</span>" + part3;
}

function isOnlyUppercase(str) {
    for (var x = 0; x < str.length; x++) {
        if (str.charAt(x) >= 'a' && str.charAt(x) <= 'z') {
            return false;
        }
    }
    return true;
}

function appendResult(apiObj, apiText, apiTags) {
    var tags = apiTags != null ? apiTags.join() : "";

    if (_selectedTag != "") {
        for (var i = 0; i < apiTags.length; i++) {
            if (apiTags[i] == _selectedTag) {
                $("#results").append("<li data-path=\"" + apiObj.Path + "\" data-tags=\"" + tags + "\">" + apiText + "</li>");
                break;
            }
        }
    } else {
        $("#results").append("<li data-path=\"" + apiObj.Path + "\" data-tags=\"" + tags + "\">" + apiText + "</li>");
    }
}

function bindAPIClicks() {
    $('#results li').click(function (e) {
        e.preventDefault();

        $that = $(this);

        $that.parent().find('li').removeClass('active-api');
        $that.addClass('active-api');

        var path = $(this).attr("data-path");
        setSelectedAPI(path, null);
    });
}

function setSelectedAPI(selectedPath, defaultJSON) {

    for (var i = 0; i < _apis.length; i++) {
        if (_apis[i].Path == selectedPath) {

            _selectedAPI = _apis[i];

            if (defaultJSON != null) {
                $("#txtJSON").val(defaultJSON);
            } else {
                buildInputJSONUI();    
            }
            
            $("#selectedAPIName").text(selectedPath);
            $("#selectedAPIPanel").show();
            $("#selectedAPIResultsPanel").show();

            //Show the new JSON template and hide previous results (if any)
            $("#tbJSON").click();
            $("#jsonResults").hide();
            $("#btnPlus").hide();
            $("#btnMinus").hide();
            
            break;
        }
    }
}

function buildInputJSONUI() {
    //For the input parameters...If no parameters, don't build the JSON request object. It can be called with no parameters.
    if (_selectedAPI.InputParameters != null) {
        var str = "{\n";
        for (var i = 0; i < _selectedAPI.InputParameters.Properties.length; i++) {
            var prop = _selectedAPI.InputParameters.Properties[i];
            str += "     \"" + prop.Name + "\": " + getPlaceholderValue(prop, true) + ",\n";
        }
        str = removeLastComma(str);
        str += "}\n";
        $("#txtJSON").val(str);
    } else {
        $("#txtJSON").val("(No input parameters)");
    }

    //For the return template...
    if (_selectedAPI.ReturnObject != null) {
        var str = "{\n";
        for (var i = 0; i < _selectedAPI.ReturnObject.Properties.length; i++) {
            var prop = _selectedAPI.ReturnObject.Properties[i];
            str += "     \"" + prop.Name + "\": " + getPlaceholderValue(prop, false) + ",\n";
        }
        str = removeLastComma(str);
        str += "}\n";

        var templateJSON = JSON.parse(str);
        $("#resultJSONTemplate").jsonViewer(templateJSON, { collapsed: false });
    } else {
        var obj = { "Message": "The return object isn't available for a preview. For the time being, you'll have to run the API call to see the return field structure." };
        $("#resultJSONTemplate").jsonViewer(obj, { collapsed: false });
    }
}

function getPlaceholderValue(prop, useDefaultValue) {
    //Unknown
    if (prop.FieldType == 0) {
        return "null";
    }
    else if (prop.FieldType == 1) {
        return useDefaultValue ? "\"datetime\"" : "\"datetime\"";
    }
    else if (prop.FieldType == 2) {
        return useDefaultValue ? "\"string\"" : "\"string\"";
    }
    else if (prop.FieldType == 3) {
        return useDefaultValue ? "false" : "\"boolean\"";
    }
    else if (prop.FieldType == 4) {
        return useDefaultValue ? "0" : "\"integer\"";
    }
    else if (prop.FieldType == 5) {
        return useDefaultValue ? "0.0" : "\"double\"";
    }
    else if (prop.FieldType == 6) {
        //Array
        if (isNativeType(prop.PropertyReference)) {
            return "[ \"" + prop.PropertyReference + "\" ]";
        } else {
            return "[ " + getObjectJSONString(prop, useDefaultValue) + "]";
        }
        //return "[]";
    }
    else if (prop.FieldType == 7) {
        //Enum
        var str = "";
        if (prop.ValidEnumValues != null && prop.ValidEnumValues.length > 0) {
            for (var i = 0; i < prop.ValidEnumValues.length; i++) {
                var enumVal = prop.ValidEnumValues[i];
                if (i == 0) {
                    str += "//Possible values: \"" + enumVal + "\"";
                } else {
                    str += ", \"" + enumVal + "\"";
                }
            }
        }
        return str;
    }
    else if (prop.FieldType == 8) {
        return getObjectJSONString(prop, useDefaultValue);
    }

    return "";
}

function isNativeType(type) {
    return type == "datetime" || type == "string" || type == "integer" || type == "boolean" || type == "number";
}

function getObjectJSONString(prop, useDefaultValue) {

    if (prop.L2Properties != null) {
        var str = "\n     {\n";
        for (var i = 0; i < prop.L2Properties.length; i++) {
            var l2Prop = prop.L2Properties[i];
            str += "          \"" + l2Prop.Name + "\": " + getPlaceholderValue(l2Prop, useDefaultValue) + ",\n";
        }
        str = removeLastComma(str);
        str += "     }";
        return str;
    }
    else if (prop.L3Properties != null) {
        var str = "\n          {\n";
        for (var i = 0; i < prop.L3Properties.length; i++) {
            var l3Prop = prop.L3Properties[i];
            str += "               \"" + l3Prop.Name + "\": " + getPlaceholderValue(l3Prop, useDefaultValue) + ",\n";
        }
        str = removeLastComma(str);
        str += "          }";
        return str;
    }
    else if (prop.L4Properties != null) {
        var str = "\n               {\n";
        for (var i = 0; i < prop.L4Properties.length; i++) {
            var l4Prop = prop.L4Properties[i];
            str += "                    \"" + l4Prop.Name + "\": " + getPlaceholderValue(l4Prop, useDefaultValue) + ",\n";
        }
        str = removeLastComma(str);
        str += "               }";
        return str;
    }
    else if (prop.L5Properties != null) {
        var str = "\n                    {\n";
        for (var i = 0; i < prop.L5Properties.length; i++) {
            var l5Prop = prop.L5Properties[i];
            str += "                         \"" + l5Prop.Name + "\": " + getPlaceholderValue(l5Prop, useDefaultValue) + ",\n";
        }
        str = removeLastComma(str);
        str += "                    }";
        return str;
    }
    else if (prop.L6Properties != null) {
        var str = "\n                         {\n";
        for (var i = 0; i < prop.L6Properties.length; i++) {
            var l6Prop = prop.L6Properties[i];
            str += "                              \"" + l6Prop.Name + "\": " + getPlaceholderValue(l6Prop, useDefaultValue) + ",\n";
        }
        str = removeLastComma(str);
        str += "                         }";
        return str;
    }

    return "";
}

function removeLastComma(str) {
    if (str != null && str.length > 1) {
        return str.substring(0, str.length - 2) + "\n";
    }
    return str;
}

function populateAPIs() {
    for (var i = 0; i < _apis.length; i++) {
        appendResult(_apis[i], _apis[i].Name, _apis[i].Tags);
    }
}

//function populateTags() {
//    for (var i = 0; i < _apis.length; i++) {
//        addTags(_apis[i].Tags);
//    }
//
//    for (var i = 0; i < _tags.length; i++) {
//        $('#tagFilter').append($('<option>', {
//            value: _tags[i],
//            text: _tags[i]
//        }));
//    }
//}

function addTags(currTags) {
    if (currTags != null) {
        for (var i = 0; i < currTags.length; i++) {
            var contains = false;
            for (var j = 0; j < _tags.length; j++) {
                if (currTags[i] == _tags[j]) {
                    contains = true;
                    break;
                }
            }

            if (!contains) {
                _tags.push(currTags[i]);
            }
        }    
    }
}

function getStorageItem(itemKey) {
    if (typeof (Storage) !== "undefined") {
        if (localStorage.getItem(itemKey) != null) {
            return JSON.parse(localStorage.getItem(itemKey));    
        }
    } else {
        alert("This browser doesn't support local storage. Use another browser like Google Chrome.");
        return { items: [] };
    }

    return { items: [] };
}

function resetStorage() {
    var obj = { items: [] };
    localStorage.setItem(RECENT_KEY, JSON.stringify(obj));
    localStorage.setItem(SAVED_KEY, JSON.stringify(obj));
}

function populateSaved() {
    _saved = getStorageItem(SAVED_KEY);
    populateList(_saved, "saved");
    bindListClicks();
}

function populateRecent() {
    _recent = getStorageItem(RECENT_KEY);
    populateList(_recent, "recent");
    bindListClicks();
}

function populateList(listObj, id) {
    $("#" + id).empty();
    if (listObj != null) {
        for (var i = 0; i < listObj.items.length; i++) {

            var apiName = listObj.items[i].name;
            var apiPath = listObj.items[i].path;
            var dateString = listObj.items[i].dateString;

            //Need to add the delete button for the saved items
            if (id == "saved") {
                var html = "<li data-path=\"" + apiPath + "\" data-date=\"" + dateString + "\" data-type=\"" + id + "\"><div class=\"fl-left\">";
                html += dateString + "<br>" + apiName;
                html += "</div><div class=\"fl-right\">";
                html += "<button type=\"button\" class=\"close pos-btn\" data-path=\"" + apiPath + "\" data-date=\"" + dateString + "\" aria-label=\"Close\">";
                html += "<span aria-hidden=\"true\">&times;</span>";
                html += "</button>";
                html += "</div></li>";
                $("#" + id).append(html);
            } else {
                $("#" + id).append("<li data-path=\"" + apiPath + "\" data-date=\"" + dateString + "\" data-type=\"" + id + "\">" + dateString + "<br>" + apiName + "</li>");    
            }
        }
    }
}

function bindListClicks() {

    //Saved item click
    $('#saved li').click(function (e) {
        e.preventDefault();

        var date = $(this).attr("data-date");
        var apiPath = $(this).attr("data-path");

        for (var i = 0; i < _saved.items.length; i++) {
            if (date == _saved.items[i].dateString && apiPath == _saved.items[i].path) {
                setSelectedAPI(_saved.items[i].path, _saved.items[i].query);
                $("#results").find('li').removeClass('active-api');
                break;
            }
        }
    });

    //Recent item click
    $('#recent li').click(function (e) {
        e.preventDefault();

        var date = $(this).attr("data-date");
        var apiPath = $(this).attr("data-path");

        for (var i = 0; i < _recent.items.length; i++) {
            if (date == _recent.items[i].dateString && apiPath == _recent.items[i].path) {
                setSelectedAPI(_recent.items[i].path, _recent.items[i].query);
                $("#results").find('li').removeClass('active-api');
                break;
            }
        }
    });

    //Delete 'Saved' button
    $('.fl-right button').click(function (e) {
        e.preventDefault();

        var date = $(this).attr("data-date");
        var apiPath = $(this).attr("data-path");
        
        //Remove the item from the array
        for (var i = 0; i < _saved.items.length; i++) {
            if (date == _saved.items[i].dateString && apiPath == _saved.items[i].path) {
                _saved.items.splice(i, 1);
                break;
            }
        }

        //Update the local storage
        localStorage.setItem(SAVED_KEY, JSON.stringify(_saved));
        populateSaved();
    });
}

function saveQuery(location) {
    var toSave = {
        name: _selectedAPI.Name,
        path: _selectedAPI.Path,
        query: $("#txtJSON").val(),
        dateString: moment().format("M/D/YYYY h:mm:ss a")
    };

    if (location == "recent") {

        //Check for duplicates and remove them
        for (var i = 0; i < _recent.items.length; i++) {
            if (_recent.items[i].name == toSave.name && _recent.items[i].query == toSave.query) {
                _recent.items.splice(i, 1);
            }
        }

        _recent.items.push(toSave);

        //Keep only the last 20 entries
        var maxKeep = 20;
        if (_recent.items.length > maxKeep) {
            var tempList = _recent.items.reverse();
            var keepers = [];
            for (var i = 0; i < maxKeep; i++) {
                keepers.push(tempList[i]);
            }
            _recent.items = keepers.reverse();
        }
        
        localStorage.setItem(RECENT_KEY, JSON.stringify(_recent));
        populateRecent();
    } else if(location == "saved") {
        _saved.items.push(toSave);
        localStorage.setItem(SAVED_KEY, JSON.stringify(_saved));
        populateSaved();
    }
}

var _saved = null;
var _recent = null;
var RECENT_KEY = "dagger_recent";
var SAVED_KEY = "dagger_saved";

$(document).ready(function () {
    //resetStorage();
    populateAPIs();
    //populateTags();
    bindAPIClicks();
    populateSaved();
    populateRecent();
    
    $("#mainTabs div").click(function(event) {
        var target = $(event.target);

        $("#tbSearch").removeClass("tb-active");
        $("#tbRecent").removeClass("tb-active");
        $("#tbSaved").removeClass("tb-active");

        $("#tbSearchPanel").hide();
        $("#tbRecentPanel").hide();
        $("#tbSavedPanel").hide();

        target.addClass("tb-active");
        $("#" + event.target.id + "Panel").show();
    });

    $("#selectedAPITabs div").click(function (event) {
        var target = $(event.target);

        $("#tbJSON").removeClass("tb-active");
        $("#tbResults").removeClass("tb-active");
        $("#tbResultsTemplate").removeClass("tb-active");
        
        $("#tbJSONPanel").hide();
        $("#tbResultsPanel").hide();
        $("#tbResultsTemplatePanel").hide();
        
        target.addClass("tb-active");
        $("#" + event.target.id + "Panel").show();
    });

    $("#btnSave").click(function (event) {

        if (_selectedAPI != null) {
            saveQuery("saved");
        } else {
            alert("No API is selected");
        }
    });

    $("#btnExecute").click(function (event) {

        if (_selectedAPI != null) {

            _collapsedResults = false;

            //Show results panel & loader
            $("#tbJSON").removeClass("tb-active");
            $("#tbJSONPanel").hide();
            $("#jsonResults").hide();
            $("#resultsError").hide();

            $("#tbResults").addClass("tb-active");
            $("#tbResultsPanel").show();
            $("#resultsLoader").show();

            //Send the request
            var jsonString = $("#txtJSON").val().replace("(No input parameters)", "");
            var payload = jsonString != "" ? JSON.parse(jsonString) : null;
            var heads = _debugLevel != null ? { "__DebugLevel": _debugLevel } : null;
            //var heads = { "__DebugLevel": "Basic" }; //Detail, FullTrace

            $.ajax({
                url: _selectedAPI.Path,
                type: "post",
                data: payload,
                headers: heads,
                complete: function(r) {
                    if (r.responseJSON.Status == 350) {
                        $("#resultsError").text(r.responseJSON.Message);
                        $("#resultsError").show();
                        $("#btnToggleExpand").hide();
                        $("#resultsLoader").hide();
                        $("#jsonResults").hide();
                        $(".expand-collapse").hide();
                    } else {

                        _jsonResults = r.responseJSON.DebugTrace != null
                            ? {
                                "Data": r.responseJSON.Data,
                                "DebugTrace": r.responseJSON.DebugTrace
                            }
                            : r.responseJSON.Data;

                        $("#jsonResults").jsonViewer(_jsonResults, { collapsed: _collapsedResults });
                        $("#resultsLoader").hide();
                        $("#resultsError").hide();
                        $("#btnToggleExpand").show();
                        $("#jsonResults").show();
                        $("#btnMinus").show();
                        $("#btnPlus").hide();
                    }

                    saveQuery("recent");
                }
            });
        } else {
            alert("No API is selected");
        }
    });

    $("#ulDebugLevel li").click(function (event) {
        _debugLevel = $(event.target).text();
        if (_debugLevel == "None") {
            _debugLevel = null;
            $("#btnExecute").text("Execute");
        } else {
            $("#btnExecute").text("Execute (" + _debugLevel + ")");    
        }
    });

    $(".expand-collapse").click(function (event) {
        if (_jsonResults != null) {
            if (_collapsedResults) {
                $("#btnMinus").show();
                $("#btnPlus").hide();
                _collapsedResults = false;
            } else {
                $("#btnMinus").hide();
                $("#btnPlus").show();
                _collapsedResults = true;
            }

            $("#jsonResults").jsonViewer(_jsonResults, { collapsed: _collapsedResults });    
        }
    });
});