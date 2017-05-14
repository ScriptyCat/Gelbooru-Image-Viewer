// ==UserScript==
// @name         ImageBoard Viewer/Downloader
// @version      1.25
// @description  A simple quick and dirty image viewer for gelbooru.com and rule34.xxx supports all formats from gif to webm.
// @author       PineappleLover69
// @include      https://gelbooru.com*
// @include      https://rule34.xxx*
// @include      http://rule34.xxx*
// @include      https://chan.sankakucomplex.com*
// ==/UserScript==


(function () {

    //Settings
    var StartImageHeight = 650;
    var AutoShowImageView = false;
    var DisableImageLinks = true;


    var siteInfo = {
        hostName: window.location.hostname,
        get siteIndex() {
            if (this.hostName == "gelbooru.com" || this.hostName == "rule34.xxx") {
                return "gel+r34";
            } else if (this.hostName == "chan.sankakucomplex.com") {
                return "sankaku";
            }
        }
    };


    //this group of vars is to be set by SetVars() and depends on the current website
    var buttonInsertionPoint, posts, imgList, tagEntry, tagTypeLookup, apiCallJson, tagArray, postSources;


    var tagDictionary = {};

    function GelbooruLayout() {
        buttonInsertionPoint = document.getElementsByClassName("content")[0];
        posts = document.getElementById("post-list");
        imgList = document.getElementsByClassName("thumb");
        tagEntry = document.getElementById("tags");
        postSources = Array(imgList.length);

        tagTypeLookup = {
            0: "tag-type-general",
            1: "tag-type-artist",
            2: "tag-type-copyright",
            3: "tag-type-copyright",
            4: "tag-type-character"
        };
    }

    function SetVars() {
        switch (siteInfo.siteIndex) {
            case "gel+r34":
                GelbooruLayout();
                break;
            case "sankaku":
                GelbooruLayout();
                break;
        }
    }

    SetVars();
    BatchApiCall();

    var imgIndex = 0;
    var imgOpened = false;

    if (DisableImageLinks) {
        for (let i = 0; i < imgList.length;) {
            try {
                imgList[i].setAttribute("openRef", imgList[i].childNodes[0].getAttribute("href"));
                imgList[i].childNodes[0].removeAttribute("href");
                imgList[i].childNodes[0].addEventListener("click", ImgClick);
                i++;
            } catch (ex) {
                imgList[i].remove();
            }
        }
    }

    function ImgClickChildParent(child, parent){
        switch (siteInfo.siteIndex) {
            case "gel+r34":
                child = e.target.parentNode.parentNode;
                parent = child.parentNode;
                break;
            case "sankaku":
                child = e.target.parentNode.parentNode;
                parent = child.parentNode;
                break;
        }
    }

    function ImgClick(e) {
        if (!imgOpened)
            ImgView();

        var child, parent;
        ImgClickChildParent(child, parent);
        console.log(child);

        // The equivalent of parent.children.indexOf(child)
        imgIndex = Array.prototype.indexOf.call(parent.children, child);
        SetImg();
        imgViewBtn.scrollIntoView();
    }

    imgViewBtn = document.createElement("button");
    imgViewBtn.innerHTML = "Image View";
    imgViewBtn.onclick = ImgView;
    var dlAllBtn = document.createElement("button");
    dlAllBtn.innerHTML = "Download All";
    dlAllBtn.onclick = dlAll;

//imgViewBtn.setAttribute("class", "active");
    buttonInsertionPoint.insertBefore(dlAllBtn, buttonInsertionPoint.childNodes[0]);
    buttonInsertionPoint.insertBefore(imgViewBtn, buttonInsertionPoint.childNodes[0]);

    var imgMouseDown = false;
    var imgDownPosX, imgDownPosY, imgDownHeight = 0;

    function ImgView() {
        if (imgOpened)
            return;

        holdDiv = document.createElement("div");
        holdDiv.setAttribute("align", "center");
        buttonInsertionPoint.insertBefore(holdDiv, buttonInsertionPoint.childNodes[2]);

        imgViewImg = document.createElement("img");
        imgViewImg.setAttribute("height", StartImageHeight);
        holdDiv.appendChild(imgViewImg);
        videoImg = document.createElement("video");
        videoImg.setAttribute("height", StartImageHeight);
        videoImg.setAttribute("autoplay", true);
        videoImg.setAttribute("controls", true);
        videoImg.setAttribute("loop", true);
        videoImg.setAttribute("hidden", true);
        holdDiv.appendChild(videoImg);

        preloadImg1 = document.createElement("img");
        preloadImg2 = document.createElement("img");
        preloadImg1.setAttribute("hidden", true);
        preloadImg2.setAttribute("hidden", true);
        holdDiv.appendChild(preloadImg1);
        holdDiv.appendChild(preloadImg2);

        preloadImg3 = document.createElement("img");
        preloadImg4 = document.createElement("img");
        preloadImg3.setAttribute("hidden", true);
        preloadImg4.setAttribute("hidden", true);
        holdDiv.appendChild(preloadImg3);
        holdDiv.appendChild(preloadImg4);

        imgViewImg.addEventListener('load', DoPreload);

        imgViewImg.addEventListener('mousedown', ImageMouseDown);
        imgViewImg.addEventListener('mouseup', ImageMouseUp);
        imgViewImg.addEventListener('mousemove', ImageMouseMove);
        imgViewImg.addEventListener('mouseleave', ImageMouseLeave);

        videoImg.addEventListener('mousedown', ImageMouseDown);
        videoImg.addEventListener('mouseup', ImageMouseUp);
        videoImg.addEventListener('mousemove', ImageMouseMove);
        videoImg.addEventListener('mouseleave', ImageMouseLeave);

        prevBtn = document.createElement("button");
        prevBtn.innerHTML = "Prev";
        prevBtn.onclick = PrevImg;
        nextBtn = document.createElement("button");
        nextBtn.innerHTML = "Next";
        nextBtn.onclick = NextImg;
        dlBtn = document.createElement("button");
        dlBtn.innerHTML = "Download";
        dlBtn.onclick = DownloadCurrent;
        opBtn = document.createElement("button");
        opBtn.innerHTML = "Open Src";
        opBtn.onclick = OpenSrc;
        spacer = document.createElement("img");
        spacer.setAttribute("width", 30);
        spacer2 = document.createElement("img");
        spacer2.setAttribute("width", 30);
        spacer3 = document.createElement("img");
        spacer3.setAttribute("width", 30);
        holdDiv.appendChild(document.createElement("br"));
        holdDiv.appendChild(prevBtn);
        holdDiv.appendChild(spacer);
        holdDiv.appendChild(dlBtn);
        holdDiv.appendChild(spacer2);
        holdDiv.appendChild(opBtn);
        holdDiv.appendChild(spacer3);
        holdDiv.appendChild(nextBtn);

        imgOpened = true;
        document.getElementById("header").remove();
        document.getElementsByClassName("header")[0].remove();

        document.addEventListener("keydown", keyInput);
        SetImg();
    }

    if (AutoShowImageView)
        ImgView();


    function BatchApiCall() {
        var urlItems = getJsonFromUrl();
        var pid = 0;
        if (urlItems.pid)
            pid = urlItems.pid / 42;

        var tags = tagEntry.value;
        var limit = imgList.length;

        var request = "/index.php?page=dapi&s=post&q=index&limit=" + limit + "&tags=" + tags + "&pid=" + pid;

        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                apiCallJson = xmlToJson(this.responseXML);

                for (var i = 0; i < limit; i++) {
                    if (!apiCallJson.posts.post[i])
                        break;
                    postSources[i] = apiCallJson.posts.post[i]["@attributes"].file_url;
                }

                CreateTagBase();
            }
        };
        xhttp.open("GET", request, true);
        xhttp.send();
    }

    function CreateTagBase() {
        var uniqueTagList = [];
        for (var i = 0; i < imgList.length; i++) {
            var currentPost = apiCallJson.posts.post[i];
            var tags = currentPost["@attributes"].tags;
            var splitTags = tags.split(' ');

            uniqueTagList.push(splitTags);
        }
        uniqueTagList = mergeDedupe(uniqueTagList);

        var uniqueTagString = "";
        var uniqueStringArray = [];
        var usCount = 0;
        for (i = 0; i < uniqueTagList.length; i++) {
            if (usCount === 0) {
                uniqueTagString += uniqueTagList[i];
            } else {
                uniqueTagString += " " + uniqueTagList[i];
            }
            usCount++;
            if (usCount > 99 || i == uniqueTagList.length - 1) {
                usCount = 0;
                uniqueStringArray.push(uniqueTagString);
                uniqueTagString = "";
            }
        }

        for (i = 0; i < uniqueStringArray.length; i++) {
            var request = "/index.php?page=dapi&s=tag&q=index&names=" + encodeURIComponent(uniqueStringArray[i]);
            TagRequest(request);
        }


    }

    function TagRequest(tagRequest) {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var tagPageJson = xmlToJson(this.responseXML);
                if (!tagArray)
                    tagArray = tagPageJson.tags.tag;
                else
                    tagArray = tagArray.concat(tagPageJson.tags.tag);

                var tmpArray = tagPageJson.tags.tag;
                for (i = 0; i < tmpArray.length; i++) {
                    tagDictionary[tmpArray[i]["@attributes"].name] = tmpArray[i]["@attributes"];
                }

                if (imgOpened)
                    SetNewTags();
            }
        };
        xhttp.open("GET", tagRequest, true);
        xhttp.send();
    }


    function OpenSrc() {
        window.open(imgList[imgIndex].getAttribute("openRef"));
    }


    function SetCurrentSrc() {
        currentSrc = GetSrcForImg(imgIndex);
    }

    function GetSrcForImg(getIndex) {
        if (postSources[getIndex]) {
            return postSources[getIndex];
        } else {
            var tmpSrc = imgList[getIndex].id;
            tmpSrc = tmpSrc.replace("s", "");

            var thing = JsonHttpRequest("/index.php?page=dapi&s=post&q=index&id=" + tmpSrc.toString());

            tmpSrc = thing.posts.post["@attributes"].file_url;
            postSources[getIndex] = tmpSrc;
            return tmpSrc;
        }
    }


    function RemoveTags() {
        var tagBar = document.getElementById("tag-sidebar");
        for (var i = tagBar.childNodes.length - 1; i >= 1; i--) {
            tagBar.childNodes[i].remove();
        }
    }

    function SetNewTags() {
        if (!tagArray)
            return;

        var currentPost = apiCallJson.posts.post[imgIndex];
        var tags = currentPost["@attributes"].tags;
        var splitTags = tags.split(' ');

        RemoveTags();

        var tagBar = document.getElementById("tag-sidebar");
        var firstTag = tagBar.childNodes[0];
        var stringToReplace = firstTag.innerHTML.substring(firstTag.innerHTML.indexOf("search=") + 7, firstTag.innerHTML.indexOf('" title="Wiki"'));

        for (var i = 1; i < splitTags.length; i++) {
            AddTag(splitTags[i], tagBar, firstTag, stringToReplace);
        }
        firstTag.remove();
        RemoveEmptyTags();
    }

    function RemoveEmptyTags() {
        var tagBar = document.getElementById("tag-sidebar");
        for (var i = tagBar.childNodes.length - 1; i >= 0; i--) {
            let tAg = tagBar.childNodes[i];
            if (tAg.childNodes[7].innerHTML === "") {
                tAg.remove();
            }
        }
    }


    function AddTag(tagName, tagParent, tagToClone, stringToReplace) {
        try {
            var clonedTag = tagToClone.cloneNode(true);
            tagParent.appendChild(clonedTag);
            clonedTag.innerHTML = clonedTag.innerHTML.replaceAll(stringToReplace, encodeURIComponent(tagName));
            clonedTag.childNodes[7].innerHTML = tagName.replace(/_/g, " ");

            var jsonTag = tagDictionary[tagName];
            var tagType = jsonTag.type;
            clonedTag.setAttribute("class", tagTypeLookup[tagType]);
            clonedTag.childNodes[9].innerHTML = jsonTag.count;
        } catch (ex) {
            console.log("Failed tag: " + tagName);
            //console.log(ex);
            console.log(tagDictionary);
        }
    }

    function SetImg() {
        SetCurrentSrc();
        var dI = currentSrc.lastIndexOf(".");
        var fileExt = currentSrc.substring(dI + 1);

        if (fileExt.toLowerCase() == "webm") {
            videoImg.setAttribute("src", currentSrc);
            videoImg.removeAttribute("hidden");
            videoImg.play();
            imgViewImg.setAttribute("hidden", true);
            setTimeout(DoPreload, 200);
        } else {
            imgViewImg.setAttribute("src", "");
            imgViewImg.removeAttribute("hidden");
            videoImg.setAttribute("hidden", true);
            videoImg.pause();

            setTimeout(SetImageAfterTimeout, 1);
        }

        SetNewTags();
    }

    function SetImageAfterTimeout() {
        imgViewImg.setAttribute("src", currentSrc);
    }


    function DoPreload() {
        var preIndex = imgIndex + 1;
        if (preIndex >= imgList.length)
            preIndex = 0;
        preloadImg1.src = GetSrcForImg(preIndex);

        preIndex++;
        if (preIndex >= imgList.length)
            preIndex = 0;
        preloadImg2.src = GetSrcForImg(preIndex);

        preIndex = imgIndex - 1;
        if (preIndex < 0)
            preIndex = imgList.length - 1;
        preloadImg3.src = GetSrcForImg(preIndex);

        //preIndex--;
        //if(preIndex < 0)
        //    preIndex = imgList.length - 1;
        //preloadImg4.src = GetSrcForImg(preIndex);
    }

    function DownloadCurrent() {
        SetCurrentSrc();
        var dI = currentSrc.lastIndexOf(".");
        var uI = currentSrc.lastIndexOf("/") + 5;
        var fileExt = currentSrc.substring(dI);
        var imgName = "tags-" + tagEntry.value + " ";
        if (tagEntry.value === "") {
            imgName = currentSrc.substring(uI, dI);
        } else {
            imgName += currentSrc.substring(uI, dI);
        }
        imgName += " id-" + imgList[imgIndex].childNodes[0].getAttribute("id");
        imgName += fileExt;
        //console.log(imgName);
        var dl = document.createElement("a");
        dl.setAttribute("href", currentSrc);
        dl.setAttribute("download", imgName);
        dl.click();
        dl.remove();

        document.body.focus();
    }

    function dlAll() {
        var prevIndex = imgIndex;
        for (imgIndex = 0; imgIndex < imgList.length;) {
            try {
                DownloadCurrent();
                imgIndex++;
            } catch (ex) {
                console.log(ex);
                imgIndex++;
                //imgList[imgIndex].remove();
            }
        }

        imgIndex = prevIndex;
    }


    function keyInput(e) {
        if (document.activeElement != tagEntry) {
            if (e.keyCode === 32) {
                e.preventDefault();
                return false;
            }
            if (e.keyCode === 37) {
                e.preventDefault();
                PrevImg();
                return false;
            }
            if (e.keyCode === 39) {
                e.preventDefault();
                NextImg();
                return false;
            }
            if (e.keyCode === 40) {
                e.preventDefault();
                DownloadCurrent();
                return false;
            }
        }
    }

    //----------everything below here is either utility or is pretty set in stone-------------------

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


})
();