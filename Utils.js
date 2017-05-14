Element.prototype.remove = function () {
    if (this)
        this.parentElement.removeChild(this);
};

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function mergeDedupe(arr) {
    return [...new Set([].concat(...arr))];
}

function PrevImg() {
    imgIndex--;
    if (imgIndex < 0)
        imgIndex = imgList.length - 1;
    SetImg();
}

function NextImg() {
    imgIndex++;
    if (imgIndex >= imgList.length)
        imgIndex = 0;
    SetImg();
}

function ImageMouseDown(e) {
    e.preventDefault();
    imgMouseDown = true;
    imgDownPosX = e.screenX;
    imgDownPosY = e.screenY;
    imgDownHeight = Number(imgViewImg.getAttribute("height"));
    return false;
}

function ImageMouseUp(e) {
    e.preventDefault();
    imgMouseDown = false;
    return false;
}

function ImageMouseMove(e) {
    if (imgMouseDown) {
        e.preventDefault();
        var moveDist = e.screenY - Number(imgDownPosY);
        imgViewImg.setAttribute("height", imgDownHeight + moveDist * 2);
        videoImg.setAttribute("height", imgDownHeight + moveDist * 2);
        return false;
    }
}

function ImageMouseLeave(e) {
    e.preventDefault();
    imgMouseDown = false;
    return false;
}

function getJsonFromUrl() {
    var query = location.search.substr(1);
    var result = {};
    query.split("&").forEach(function (part) {
        var item = part.split("=");
        result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
}

function JsonHttpRequest(urlRequest) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", urlRequest, false);
    xhr.send();
    return xmlToJson(xhr.responseXML);
}

// Changes XML to JSON
function xmlToJson(xml) {

    // Create the return object
    var obj = {};

    if (xml.nodeType == 1) { // element
        // do attributes
        if (xml.attributes.length > 0) {
            obj["@attributes"] = {};
            for (var j = 0; j < xml.attributes.length; j++) {
                var attribute = xml.attributes.item(j);
                obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
            }
        }
    } else if (xml.nodeType == 3) { // text
        obj = xml.nodeValue;
    }

    // do children
    if (xml.hasChildNodes()) {
        for (var i = 0; i < xml.childNodes.length; i++) {
            var item = xml.childNodes.item(i);
            var nodeName = item.nodeName;
            if (typeof(obj[nodeName]) == "undefined") {
                obj[nodeName] = xmlToJson(item);
            } else {
                if (typeof(obj[nodeName].push) == "undefined") {
                    var old = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(old);
                }
                obj[nodeName].push(xmlToJson(item));
            }
        }
    }
    return obj;
}