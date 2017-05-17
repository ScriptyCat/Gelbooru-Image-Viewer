// ==UserScript==
// @name         ImageBoard Viewer/Downloader
// @version      1.36
// @description  A simple quick and dirty image viewer for gelbooru.com and rule34.xxx supports all formats from gif to webm.
// @author       PineappleLover69
// @include      https://gelbooru.com*
// @include      https://rule34.xxx*
// @include      https://danbooru.donmai*

// ==/UserScript==


(function () {

    //Settings
    var StartImageHeight = 650;
    var AutoShowImageView = false;
    var DisableImageLinks = true;

    var siteObj, defaultSiteObject;
    siteObj = siteObj;
    SetUpSiteSwitchObjs();

    //this group of vars is to be set by SetVars() and depends on the current website
    var buttonInsertionPoint, posts, imgList, tagEntry, tagTypeLookup, postsJson, tagArray, postSources;


    var tagDictionary = {};

    siteObj.SetVars();
    siteObj.posts.BatchPostApiCall();

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

        siteObj.posts.OnImgView();

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

        if (fileExt.toLowerCase() == "webm" || fileExt.toLowerCase() == "mp4") {
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
                siteObj.posts.RemoveTextFillerElements();


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
            GetObjectProperty: function (obj, propName) {
                return obj["@attributes"][propName];
            },
            posts: {
                postIdReplaceChar: "s",
                postLimit: 42,
                postPageIdName: "pid",
                postLimitName: "limit",
                postTagsName: "tags",
                postIdName: "id",
                postFileUrlName: "file_url",
                postApiEndpoint: "/index.php?page=dapi&s=post&q=index",
                addSiteNameToFileUrl: false,
                OnImgView: function () {

                },
                RemoveTextFillerElements: function () {
                    for (let i = 0; i < imgList.length;) {
                        if (imgList[i].tagName === undefined) {
                            imgList[i].remove();
                        } else {
                            i++;
                        }
                    }
                },
                BatchPostApiCall: function () {
                    var apiCallObj = getJsonFromUrl();
                    siteObj.posts.PostApiSelector(apiCallObj);

                    var xhttp = new XMLHttpRequest();

                    xhttp.onreadystatechange = function () {
                        if (this.readyState == 4 && this.status == 200) {
                            postsJson = xmlToJson(this.responseXML);

                            siteObj.posts.PostSourcesSelector(apiCallObj);

                            siteObj.tags.CreateTagBase();
                        }
                    };
                    xhttp.open("GET", apiCallObj.request, true);
                    xhttp.send();
                },
                HandlePageId: function (value) {
                    return value / this.postLimit;
                },
                PostApiSelector: function (apiObj) {
                    let pid = 0;
                    apiObj.postLimit = this.postLimit;
                    if (apiObj[this.postPageIdName]) {
                        pid = this.HandlePageId(apiObj[this.postPageIdName]);
                    }
                    let tags = encodeUriSpecial(tagEntry.value);
                    apiObj.request = this.postApiEndpoint + "&" + this.postLimitName + "=" + apiObj.postLimit
                    + "&" + this.postTagsName + "=" + tags + "&" + this.postPageIdName + "=" + pid;
                },
                PostsJsonGetPost: function (index) {
                    let tmpPost = postsJson.posts.post[index];
                    return tmpPost;
                },
                PostMismatch: function(apiObj, index){
                    imgList[index].remove();
                    imgList[imgList.length - 1].remove();
                    apiObj.postLimit -= 2;
                    console.log("removed 1: " + apiObj.postLimit + " : " + imgList.length);
                },
                PostSourcesSelector: function (apiObj) {
                    apiObj.postOffset = 0;
                    for (let i = 0; i < apiObj.postLimit;) {
                        let tmpPost = siteObj.posts.PostsJsonGetPost(i + apiObj.postOffset);
                        if (!tmpPost)
                            break;
                        let tmpId = imgList[i].id;
                        tmpId = tmpId.replace(this.postIdReplaceChar, "");

                        if (siteObj.GetObjectProperty(tmpPost, "id") != tmpId) {
                            siteObj.posts.PostMismatch(apiObj, i);
                        } else {
                            postSources[i] = siteObj.GetObjectProperty(tmpPost, this.postFileUrlName);
                            if (siteObj.posts.addSiteNameToFileUrl)
                                postSources[i] = window.location.hostname + postSources[i];
                            i++;
                        }
                    }
                },
                GetSinglePostApiRequest: function(tmpId){
                    let request = JsonHttpRequest(this.postApiEndpoint + "&" + this.postIdName + "=" + tmpId.toString());
                    return siteObj.GetObjectProperty(request, this.postFileUrlName);
                },
                SinglePostSrc: function (getIndex) {
                    var tmpId = imgList[getIndex][this.postIdName];
                    tmpId = tmpId.replace(this.postIdReplaceChar, "");
                    var tmpSrc = siteObj.posts.GetSinglePostApiRequest(tmpId);

                    postSources[getIndex] = tmpSrc;
                    return tmpSrc;
                }
            },
            tags: {
                tagApiEndpoint: "/index.php?page=dapi&s=tag&q=index&names=",
                maxTagApiCount: 99,
                logTagErrors: true,
                tagApiSplitChar: " ",
                tagsSplitChar: " ",
                tagsPropertyName: "tags",
                tagCategoryPropertyName: "type",
                tagCountPropertyName: "count",
                tagNamePropertyName: "name",
                GetTagSidebarElement:function(){
                    return document.getElementById("tag-sidebar");
                },
                CreateTagBase: function () {
                    let uniqueTagList = [];
                    siteObj.tags.GetSplitTagsPerPost(uniqueTagList);
                    uniqueTagList = mergeDedupe(uniqueTagList);

                    siteObj.tags.TagApiSelector(uniqueTagList);
                },
                GetSplitTagsPerPost: function (uniqueTagList) {
                    for (var i = 0; i < imgList.length; i++) {
                        var currentPost = siteObj.posts.PostsJsonGetPost(i);
                        var tags = siteObj.GetObjectProperty(currentPost, this.tagsPropertyName).toLowerCase();
                        var splitTags = tags.split(this.tagsSplitChar);

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
                            uniqueTagString += this.tagApiSplitChar + uniqueTagList[i];
                        }
                        usCount++;
                        if (usCount > this.maxTagApiCount || i == uniqueTagList.length - 1) {
                            usCount = 0;
                            uniqueStringArray.push(uniqueTagString);
                            uniqueTagString = "";
                        }
                    }

                    for (i = 0; i < uniqueStringArray.length; i++) {
                        let request = this.tagApiEndpoint + encodeUriSpecial(uniqueStringArray[i]);
                        TagRequest(request);
                    }
                },
                GetTagJsonArray: function(tagJson){
                    return tagJson.tags.tag;
                },
                TagDictionarySetup: function (tagsJson) {
                    let tmpArray = siteObj.tags.GetTagJsonArray(tagsJson);
                    if (!tagArray)
                        tagArray = tmpArray;
                    else {
                        tagArray = tagArray.concat(tmpArray);
                    }

                    for (i = 0; i < tmpArray.length; i++) {
                        tagDictionary[siteObj.GetObjectProperty(tmpArray[i], this.tagNamePropertyName).toLowerCase()] = tmpArray[i];
                    }
                },
                GetNodeIndex: function(){
                    return(window.location.hostname == "rule34.xxx") ? 4 : 7;
                },
                TagCountFormatter: function(count){
                    var nCount = Number(count);
                    return nCount;
                },
                TagCloneNameSetter: function(tagClone, tagName){
                    let nodeIndex = siteObj.tags.GetNodeIndex();
                    tagClone.childNodes[nodeIndex].innerHTML = tagName.replace(/_/g, " ");
                },
                TagCloneCountSetter: function(tagClone, tagCount){
                    let nodeIndex = siteObj.tags.GetNodeIndex();
                    tagClone.childNodes[nodeIndex + 2].innerHTML = siteObj.tags.TagCountFormatter(tagCount);
                },
                AddTag: function (tagName, tagParent, tagToClone, stringToReplace) {
                    try {
                        var clonedTag = tagToClone.cloneNode(true);
                        tagParent.appendChild(clonedTag);
                        clonedTag.innerHTML = clonedTag.innerHTML.replaceAll("class=", "cla$$=");
                        clonedTag.innerHTML = clonedTag.innerHTML.replaceAll(stringToReplace, encodeUriSpecial(tagName));
                        clonedTag.innerHTML = clonedTag.innerHTML.replaceAll("cla$$=", "class=");

                        siteObj.tags.TagCloneNameSetter(clonedTag, tagName);

                        var jsonTag = tagDictionary[tagName];
                        var tagType = siteObj.GetObjectProperty(jsonTag, this.tagCategoryPropertyName);
                        var tagCount = siteObj.GetObjectProperty(jsonTag, this.tagCountPropertyName);

                        clonedTag.setAttribute("class", tagTypeLookup[tagType]);
                        siteObj.tags.TagCloneCountSetter(clonedTag, tagCount);
                    } catch (ex) {
                        if (this.logTagErrors) {
                            console.log("Failed tag: " + tagName);
                            console.log(ex);
                            console.log(tagDictionary);
                        }
                    }
                },
                FindStringToReplace: function(tag){
                    let nodeIndex = siteObj.tags.GetNodeIndex();
                    return encodeUriSpecial(tag.childNodes[nodeIndex].innerHTML);
                },
                AddTags: function () {
                    let currentPost = siteObj.posts.PostsJsonGetPost(imgIndex);
                    let tags = siteObj.GetObjectProperty(currentPost, this.tagsPropertyName);
                    let splitTags = tags.split(this.tagsSplitChar);

                    let tagBar = siteObj.tags.GetTagSidebarElement();

                    let firstTag = tagBar.childNodes[0];

                    //let stringToReplace = firstTag.innerHTML.substring(firstTag.innerHTML.lastIndexOf("tags=") + 5, firstTag.innerHTML.lastIndexOf('</a>') - 3);
                    let stringToReplace = siteObj.tags.FindStringToReplace(firstTag);

                    for (let i = 1; i < splitTags.length; i++) {
                        siteObj.tags.AddTag(splitTags[i], tagBar, firstTag, stringToReplace);
                    }

                    firstTag.remove();
                },
                RemoveTags: function () {
                    let tagBar = siteObj.tags.GetTagSidebarElement();
                    if (tagBar.childNodes[0].innerHTML === undefined) {
                        tagBar.childNodes[0].remove();
                    }
                    for (let i = tagBar.childNodes.length - 1; i >= 1; i--) {
                        tagBar.childNodes[i].remove();
                    }
                },
                RemoveEmptyTags: function () {
                    let tagBar = siteObj.tags.GetTagSidebarElement();
                    for (let i = tagBar.childNodes.length - 1; i >= 0; i--) {
                        let tAg = tagBar.childNodes[i];
                        try {
                            if (tAg.childNodes[4].innerHTML === "" || tAg.childNodes[7].innerHTML === "") {
                                tAg.remove();
                            }
                        } catch (ex) {

                        }
                    }
                }
            }
        };

        siteObj = cloneObject(defaultSiteObject);

        let hostName = window.location.hostname;
        //console.log(hostName + " : " + ());
        if (hostName.startsWith("danbooru.donmai"))
            hostName = "danbooru.donmai";

        switch (hostName) {

            case "rule34.xxx":
                siteObj.tags.logTagErrors = false;
                break;


            case "danbooru.donmai":
                siteObj.SetVars = function () {
                    buttonInsertionPoint = document.getElementById("post-sections");
                    posts = document.getElementById("posts");
                    imgList = posts.childNodes[1].childNodes;
                    tagEntry = document.getElementById("tags");
                    postSources = Array(imgList.length);
                    siteObj.posts.RemoveTextFillerElements();

                    tagTypeLookup = {
                        0: "category-0",
                        1: "category-1",
                        2: "category-2",
                        3: "category-3",
                        4: "category-4"
                    };
                };

                //danbooru post stuff
                siteObj.posts.postPageIdName = "page";
                siteObj.posts.postIdReplaceChar = "post_";
                siteObj.posts.postFileUrlName = "large-file-url";
                siteObj.posts.postApiEndpoint = "/posts.xml?";
                siteObj.posts.postLimit = 20;
                siteObj.posts.HandlePageId = function (value) {
                    return Number(value);
                };
                siteObj.GetObjectProperty = function (obj, propName) {
                    return obj[propName]["#text"];
                };
                siteObj.posts.GetSinglePostApiRequest = function(tmpId){
                    let request = JsonHttpRequest("/posts/" + tmpId.toString() + ".xml?");
                    return siteObj.GetObjectProperty(request, siteObj.posts.postFileUrlName);
                };
                siteObj.posts.PostMismatch = function(apiObj, index){
                    console.log(postsJson);
                    //imgList[index].remove();
                    apiObj.postLimit--;
                    apiObj.postOffset++;
                    console.log("removed 1: " + apiObj.postLimit + " : " + imgList.length);
                };

                //danbooru tag stuff
                siteObj.tags.tagApiEndpoint = "/tags.xml?search[name]=";
                siteObj.tags.tagApiSplitChar = ",";
                siteObj.tags.tagsPropertyName = "tag-string";
                siteObj.tags.tagCategoryPropertyName = "category";
                siteObj.tags.tagCountPropertyName = "post-count";
                siteObj.tags.maxTagApiCount = 19;
                siteObj.tags.GetTagSidebarElement = function(){
                    return document.getElementById("tag-box").childNodes[3];
                };
                siteObj.tags.FindStringToReplace = function(tag){
                    let tmpStr = tag.childNodes[2].innerHTML.replace(/ /g, "_");
                    return encodeUriSpecial(tmpStr);
                };
                siteObj.tags.TagCloneNameSetter = function(tagClone, tagName){
                    tagClone.childNodes[2].innerHTML = tagName.replace(/_/g, " ");
                };
                siteObj.tags.TagCountFormatter = function(count){
                    var nCount = Number(count);
                    if(nCount < 1000) {
                        return nCount.toString();
                    }else if(nCount < 10000){
                        return (nCount / 1000).toPrecision(2).toString() + "k";
                    }else{
                        nCount /= 1000;
                        return Math.round(nCount).toString() + "k";
                    }
                };
                siteObj.tags.TagCloneCountSetter = function(tagClone, tagCount){
                    tagClone.childNodes[4].innerHTML = siteObj.tags.TagCountFormatter(tagCount);
                };

                break;


            case ("chan.sankakucomplex.com" || ""):
                break;

        }

        //end switch setup
    }


    //----------everything below here is either utility or is pretty set in stone-------------------

    function encodeUriSpecial(str){
        return encodeURIComponent(str).replace(/\(/g, "%28").replace(/\)/g, "%29");
    }

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