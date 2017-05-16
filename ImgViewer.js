// ==UserScript==
// @name         ImageBoard Viewer/Downloader
// @version      1.31
// @description  A simple quick and dirty image viewer for gelbooru.com and rule34.xxx supports all formats from gif to webm.
// @author       PineappleLover69
// @include      https://gelbooru.com*
// @include      https://rule34.xxx*

// ==/UserScript==


(function () {

    //Settings
    var StartImageHeight = 650;
    var AutoShowImageView = false;
    var DisableImageLinks = true;

    var siteObj, defaultSiteObject;
    SetUpSiteSwitchObjs();

    //this group of vars is to be set by SetVars() and depends on the current website
    var buttonInsertionPoint, posts, imgList, tagEntry, tagTypeLookup, postsJson, tagArray, postSources;


    var tagDictionary = {};

    siteObj.SetVars();
    BatchPostApiCall();

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


    function ImgClick(e) {
        if (!imgOpened)
            ImgView();

        var parentchildObj = {};
        siteObj.ImgClickGetChildAndParent(parentchildObj, e);

        // The equivalent of parent.children.indexOf(child)
        imgIndex = Array.prototype.indexOf.call(parentchildObj.parent.children, parentchildObj.child);
        SetImg();
        imgViewBtn.scrollIntoView();
    }

    var imgViewBtn = document.createElement("button");
    imgViewBtn.innerHTML = "Image View";
    imgViewBtn.onclick = ImgView;
    var dlAllBtn = document.createElement("button");
    dlAllBtn.innerHTML = "Download All";
    dlAllBtn.onclick = dlAll;

    //imgViewBtn.setAttribute("class", "active");
    buttonInsertionPoint.insertBefore(dlAllBtn, buttonInsertionPoint.childNodes[0]);
    buttonInsertionPoint.insertBefore(imgViewBtn, buttonInsertionPoint.childNodes[0]);

    var imgViewImg, videoImg, preloadImg1, preloadImg2, preloadImg3, preloadImg4;

    function ImgView() {
        if (imgOpened)
            return;

        var holdDiv = document.createElement("div");
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
        let header = document.getElementById("header");
        if (header)
            header.remove();
        header = document.getElementsByClassName("header")[0];
        if (header)
            header.remove();

        document.addEventListener("keydown", keyInput);
        SetImg();
    }

    if (AutoShowImageView)
        ImgView();


    function BatchPostApiCall() {
        var apiCallObj = getJsonFromUrl();
        siteObj.posts.PostApiSelector(apiCallObj);

        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                postsJson = xmlToJson(this.responseXML);

                siteObj.posts.PostSourcesSelector(apiCallObj);

                CreateTagBase();
            }
        };
        xhttp.open("GET", apiCallObj.request, true);
        xhttp.send();
    }

    function CreateTagBase() {
        let uniqueTagList = [];
        siteObj.tags.GetSplitTagsPerPost(uniqueTagList);
        uniqueTagList = mergeDedupe(uniqueTagList);

        siteObj.tags.TagApiSelector(uniqueTagList);
    }

    function TagRequest(tagRequest) {
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                let tagPageJson = xmlToJson(this.responseXML);

                siteObj.tags.TagDictionarySetup(tagPageJson);

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
            return siteObj.posts.SinglePostSrc(getIndex);
        }
    }

    function SetNewTags() {
        if (!tagArray)
            return;

        siteObj.tags.RemoveTags();
        siteObj.tags.AddTags();
        siteObj.tags.RemoveEmptyTags();
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

    function SetUpSiteSwitchObjs() {
        ///this is the object that controls what should be done for each individual website supported
        defaultSiteObject = {
            //the default here serves as a master obj so that code bits can be reused if certain websites
            //use similar layouts in areas. it is based on the gelbooru design.

            SetVars: function () {
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
            },
            ImgClickGetChildAndParent: function (obj, e) {
                obj.child = e.target.parentNode.parentNode;
                obj.parent = obj.child.parentNode;
            },
            posts: {
                PostApiSelector: function (apiObj) {
                    var pid = 0;
                    apiObj.postLimit = 42;
                    if (apiObj.pid) {
                        pid = apiObj.pid / apiObj.postLimit;
                    }
                    var tags = encodeURIComponent(tagEntry.value);
                    apiObj.request = "/index.php?page=dapi&s=post&q=index&limit=" + apiObj.postLimit + "&tags=" + tags + "&pid=" + pid;
                },
                PostSourcesSelector: function (apiObj) {
                    for (var i = 0; i < apiObj.postLimit; i++) {
                        if (!postsJson.posts.post[i])
                            break;
                        postSources[i] = postsJson.posts.post[i]["@attributes"].file_url;
                    }
                },
                SinglePostSrc: function (getIndex) {
                    var tmpSrc = imgList[getIndex].id;
                    tmpSrc = tmpSrc.replace("s", "");

                    var thing = JsonHttpRequest("/index.php?page=dapi&s=post&q=index&id=" + tmpSrc.toString());

                    tmpSrc = thing.posts.post["@attributes"].file_url;
                    postSources[getIndex] = tmpSrc;
                    return tmpSrc;
                }
            },
            tags: {
                GetSplitTagsPerPost: function (uniqueTagList) {
                    for (var i = 0; i < imgList.length; i++) {
                        var currentPost = postsJson.posts.post[i];
                        var tags = currentPost["@attributes"].tags.toLowerCase();
                        var splitTags = tags.split(' ');

                        uniqueTagList.push(splitTags);
                    }
                },
                TagApiSelector: function (uniqueTagList) {
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
                        let request = "/index.php?page=dapi&s=tag&q=index&names=" + encodeURIComponent(uniqueStringArray[i]);
                        TagRequest(request);
                    }
                },
                TagDictionarySetup: function (tagsJson) {

                    let tmpArray = tagsJson.tags.tag;
                    if (!tagArray)
                        tagArray = tmpArray;
                    else {
                        tagArray = tagArray.concat(tmpArray);

                    }

                    for (i = 0; i < tmpArray.length; i++) {
                        tagDictionary[tmpArray[i]["@attributes"].name.toLowerCase()] = tmpArray[i]["@attributes"];
                    }
                },
                AddTag: function (tagName, tagParent, tagToClone, stringToReplace) {
                    try {
                        var clonedTag = tagToClone.cloneNode(true);
                        tagParent.appendChild(clonedTag);
                        clonedTag.innerHTML = clonedTag.innerHTML.replaceAll(stringToReplace, encodeURIComponent(tagName));
                        let nodeIndex = (window.location.hostname == "rule34.xxx") ? 4 : 7;
                        clonedTag.childNodes[nodeIndex].innerHTML = tagName.replace(/_/g, " ");

                        var jsonTag = tagDictionary[tagName];
                        var tagType = jsonTag.type;
                        clonedTag.setAttribute("class", tagTypeLookup[tagType]);
                        clonedTag.childNodes[nodeIndex + 2].innerHTML = jsonTag.count;
                    } catch (ex) {
                        console.log("Failed tag: " + tagName);
                        console.log(ex);
                        console.log(tagDictionary);
                    }
                },
                AddTags: function () {
                    let currentPost = postsJson.posts.post[imgIndex];
                    let tags = currentPost["@attributes"].tags;
                    let splitTags = tags.split(' ');

                    let tagBar = document.getElementById("tag-sidebar");
                    let firstTag = tagBar.childNodes[0];
                    //let stringToReplace = firstTag.innerHTML.substring(firstTag.innerHTML.lastIndexOf("tags=") + 5, firstTag.innerHTML.lastIndexOf('</a>') - 3);
                    let nodeIndex = (window.location.hostname == "rule34.xxx") ? 4 : 7;
                    let stringToReplace = encodeURIComponent(firstTag.childNodes[nodeIndex].innerHTML);

                    for (let i = 1; i < splitTags.length; i++) {
                        this.AddTag(splitTags[i], tagBar, firstTag, stringToReplace);
                    }

                    firstTag.remove();
                },
                RemoveTags: function () {
                    let tagBar = document.getElementById("tag-sidebar");
                    if (tagBar.childNodes[0].innerHTML === undefined) {
                        //console.log(tagBar.childNodes[0]);
                        //console.log(tagBar.childNodes[1]);
                        tagBar.childNodes[0].remove();
                    }
                    for (let i = tagBar.childNodes.length - 1; i >= 1; i--) {
                        tagBar.childNodes[i].remove();
                    }
                },
                RemoveEmptyTags: function () {
                    let tagBar = document.getElementById("tag-sidebar");
                    for (let i = tagBar.childNodes.length - 1; i >= 0; i--) {
                        let tAg = tagBar.childNodes[i];
                        if (tAg.childNodes[5].innerHTML === "" || tAg.childNodes[7].innerHTML === "") {
                            tAg.remove();
                        }
                    }
                }
            }
        };

        //siteObj = JSON.parse(JSON.stringify(defaultSiteObject));
        siteObj = cloneObject(defaultSiteObject);

        switch (window.location.hostname) {
            case "rule34.xxx":

                break;


            case "chan.sankakucomplex.com":
                break;
        }
    }

    function cloneObject(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        let temp = obj.constructor(); // give temp the original obj's constructor
        for (let key in obj) {
            temp[key] = cloneObject(obj[key]);
        }

        return temp;
    }


    //----------everything below here is either utility or is pretty set in stone-------------------

    Element.prototype.remove = function () {
        if (this)
            this.parentElement.removeChild(this);
    };

    //String.prototype.replaceAll = function (search, replacement) {
    //    var target = this;
    //    return target.replace(new RegExp(search, 'g'), replacement);
    //};

    String.prototype.replaceAll = function (search, replacement) {
        var target = this;
        return target.split(search).join(replacement);
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

    var imgMouseDown = false;
    var imgDownPosX, imgDownPosY, imgDownHeight = 0;

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