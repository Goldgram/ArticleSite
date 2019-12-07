// add a new string to the top of this list for each new article
var archives = [
  "2019-February",
  "2019-January",
  "2018-December"
];
// The first string is considered the current batch
var archiveDefault = archives[0];
// This object contains all the tags for articles, each has:
//   tag - a tag that identifies it in the source data
//   title - A presentation title to be added in the menu and section headers
//   color - A color association with articles of this type
var articleFilters = {
  "all"  : {class:"all", tag:"all", title:"All", color:"#FDD600"},
  "type1": {class:"type1", tag:"social", title:"Social", color:"#FF5003"},
  "type2": {class:"type2", tag:"whatsup", title:"What's Happening", color:"#FFAFD8"},// retired tag
  "type3": {class:"type3", tag:"cognitive", title:"Cognitive", color:"#5AAAFA"},
  "type4": {class:"type4", tag:"analytics", title:"Analytics", color:"#8CD211"},
  "type5": {class:"type5", tag:"careers", title:"Careers", color:"#99DFD7"},// retired tag
  "type6": {class:"type6", tag:"education", title:"Education", color:"#CDA7E4"},// retired tag
  "type7": {class:"type7", tag:"security", title:"Security", color:"#000088"},
  "type8": {class:"type8", tag:"cloud", title:"Cloud", color:"#75F1CF"},
  "type9": {class:"type9", tag:"mobile", title:"Mobile", color:"#FF0000"},
  "type10": {class:"type10", tag:"iot", title:"Internet of Things", color:"#FEB1B1"},// retired tag
  "type11": {class:"type11", tag:"general", title:"General News", color:"#FE339B"},
  "type12": {class:"type12", tag:"commerce", title:"Commerce", color:"#00B4A0"},
  "type13": {class:"type13", tag:"innovation", title:"Innovation", color:"#9855D4"},
  "type14": {class:"type14", tag:"watson", title:"Watson", color:"#4216FF"}
};
var articles, currentTagType, articleIdByTags, currentArchive;
var loadingMarker = 0;


//smart resize
(function($,sr){
  // debouncing function from John Hann
  // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
  var debounce = function (func, threshold, execAsap) {
    var timeout;
    return function debounced () {
      var obj = this, args = arguments;
      function delayed () {
        if (!execAsap) {
          func.apply(obj, args);
        }
        timeout = null;
      }

      if (timeout) {
        clearTimeout(timeout);
      }
      else if (execAsap) {
        func.apply(obj, args);
      }
      timeout = setTimeout(delayed, threshold || 100);
    };
  };
  // smartresize
  jQuery.fn[sr] = function(fn){  return fn ? this.bind('resize', debounce(fn)) : this.trigger(sr); };
})(jQuery,'smartresize');

function createArchiveTitle(archiveKey) {
  var archiveStrings = archiveKey.split("-");
  var year = archiveStrings[0].match("^(19|20)[0-9][0-9]") ? archiveStrings[0] : "";
  var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var monthIndex = monthNames.indexOf(archiveStrings[1]);
  var month =  (monthIndex > -1) ? monthNames[monthIndex] : "";
  return month+" "+year;
}

function createArchiveButtons() {
  var archiveString = "";
  for (var i = 0; i < archives.length; i++) {
    archiveString += "<div class='archiveItem noSelectClick' archiveString='"+archives[i]+"''>"+createArchiveTitle(archives[i])+"</div>";
  }
  $("#archiveOverlay").append(archiveString);
}

function addFilterSelected(tag) {
  $(".filterItem div").removeClass("selected");
  $(".filterItem div."+tag+"_link").addClass("selected");
}

function filterBy(tag){
  currentTagType = tag;
  addFilterSelected(tag);
  if (articleFilters.all.class===tag) {
    $("#cardContainer .cardItem").removeClass("displayNone filtering");
  } else {
    $("#cardContainer .cardItem").addClass("displayNone filtering");
    $("#cardContainer .cardItem."+tag+"Class").removeClass("displayNone");
  }
}

function hideAndClearOverLays() {
  $("#mobileFiltersOverlay,.miniOverlay").hide();
  $("#feedbackName").val("");
  $("#feedbackEmail").val("");
  $("#feedbackMessage").val("");
  $("#formWarning").text("").hide();
  $("#feedbackForm").show();
}

function findTagClass(tags){
  if(!tags) { return ""; }
  for (var i = 0; i < tags.length; i++) {
    for (var key in articleFilters) {
      if (articleFilters[key].tag===tags[i].slug){
        return articleFilters[key].class;
      }
    }
  }
  return "";
}

function changeArticle(articleId) {
  articleId = parseInt(articleId,10);
  var article = articles[articleId];
  var tagClass = findTagClass(article.terms.post_tag);

  $("#overlay").removeClass().addClass(tagClass+"_border");

  var articleSet = articleIdByTags[currentTagType];
  var articleIndex = articleSet.indexOf(articleId);
  if (articleIndex === 0) {
    $("#overlay .previousArticle").addClass("hideButton");
  } else {
    var previousArticleIndex = articleIndex - 1;
    var previousId = articleSet[previousArticleIndex];
    var previousIdTitle = articles[previousId].title;
    $("#overlay .previousArticle .articleButton").attr("articleId", previousId);
    $("#overlay .previousArticle .articleTitle").html(previousIdTitle);
    $("#overlay .previousArticle").removeClass("hideButton");
  }

  if (articleIndex === articleSet.length-1) {
    $("#overlay .nextArticle").addClass("hideButton");
  } else {
    var nextArticleIndex = articleIndex + 1;
    var nextId = articleSet[nextArticleIndex];
    var nextIdTitle = articles[parseInt(nextId,10)].title;
    $("#overlay .nextArticle .articleButton").attr("articleId", nextId);
    $("#overlay .nextArticle .articleTitle").html(nextIdTitle);
    $("#overlay .nextArticle").removeClass("hideButton");
  }

  $("#overlay .articleType").html(articleFilters[tagClass].title);
  $("#overlay .title").html(article.title);
  // $("#overlay .image").attr("src",imgSrc);
  $("#overlay .content").html(article.content);

  window.history.pushState(null, null, "?archive="+currentArchive+"&articleId="+articleId);
}

function showArticle(articleId, speed) {
  changeArticle(articleId);
  $("#overlay").fadeIn(speed, function() {
    $("body").css("overflow","hidden");
    $("#overlay").css("overflow","auto");
  });
}

function hideArticle() {
  var stateString = currentArchive!==archiveDefault ? "?archive="+currentArchive : "/";
  window.history.pushState(null, null, stateString);
  $("body").css("overflow","auto");
  $("#overlay").css("overflow","hidden").hide();
}

function getUrlParameter(sParam) {
  var sPageURL = window.location.search.substring(1);
  var sURLVariables = sPageURL.split("&");
  for (var i = 0; i < sURLVariables.length; i++) {
    var sParameterName = sURLVariables[i].split("=");
    if (sParameterName[0] === sParam) {
      return sParameterName[1];
    }
  }
}

function articleComparator(a, b){
  var tag1 = a.order;
  var tag2 = b.order;
  return ((tag1 < tag2) ? -1 : ((tag1 > tag2) ? 1 : 0));
}

function pushTagIndex(tag, articleId) {
  if (!articleIdByTags[tag]) {
    articleIdByTags[tag] = [];
  }
  articleIdByTags[tag].push(articleId);
}

function calReadingTime(string) {
  var wordsPerMin = 180;
  var averageWordLength = 7;
  var time = Math.ceil(string.length / (wordsPerMin*averageWordLength));
  return time+" min"+(time>1?"s":"");
}

function stripHTML(html) {
   var tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
}

function multiLineElipses(string, length) {
  if (string.length > length) {
    string = string.slice(0, length-3).trim()+"...";
  }
  return string;
}

function appendCard(id, article, cardLayoutCount) {
  if(!article) {
    console.log("no article data (id: "+id+")");
    console.log("id: "+id);
    return "";
  }
  // get the array of tags, if there are no tags then we ignore the article
  var tags = (article.terms && article.terms.post_tag) ? article.terms.post_tag : "";
  if(!tags) {
    console.log("no tags found");
    console.log(article);
    return "";
  }
  // if there is a no_display tag then we also ignore the article
  if(tags.indexOf("no_display") > -1) {
    console.log("article has no display tag");
    console.log(article);
    return "";
  }
  // get tag class, if there are no tags then we ignore the article
  var tagClass = findTagClass(tags);
  if(!tagClass) {
    console.log("no recognised tag");
    console.log("tags: "+JSON.stringify(tags));
    console.log(article);
    return "";
  }
  // build the index arrays for each tag (to be used in the article overlay)
  pushTagIndex(articleFilters.all.class, id);
  pushTagIndex(tagClass, id);
  // If a featured image is not found default to a placeholder image
  var imgSrc = "";
  if (article.featured_image) {
    imgSrc = article.featured_image.source;
  } else {
    console.log("no image source found");
    console.log(article);
    return "";
  }
  var content = stripHTML(article.content);
  content = content.replace("&nbsp;", " ");
  var time = calReadingTime(content);
  var longTitle = stripHTML(article.title);
  var shortTitle = multiLineElipses(longTitle, 98);
  var shortContent = multiLineElipses(content, 106);
  var cardType = "";
  var additionalClasses = "";
  // 0 1l 2
  if (cardLayoutCount === 1) {
    cardType = "largeCard";
  }
  // 8w 9w 7l
  if (cardLayoutCount === 7) {
    cardType = "largeCard";
    additionalClasses = "cardFloatRight";
  }
  if (cardLayoutCount === 8 || cardLayoutCount === 9) {
    cardType = "wideCard";
  }
  // 14l 15w 16w
  if (cardLayoutCount === 14) {
    cardType = "largeCard";
  }
  if (cardLayoutCount === 15 || cardLayoutCount === 16) {
    cardType = "wideCard";
  }
  var newCard = "";
  newCard += "<div class='cardItem "+cardType+" "+tagClass+"Class "+additionalClasses+"' articleId="+id+">";
    newCard += "<div class='cardImage' style='background:url("+imgSrc+") center / cover;'>";
      newCard += "<img class='cardMobileImage' src='"+imgSrc+"'>";
      newCard += "<div class='cardImageTitle "+tagClass+"_background'>"+articleFilters[tagClass].title+"</div>";
    newCard += "</div>";
    newCard += "<div class='cardContent'>";
      newCard += "<img class='clockImage' src='img/clock.png'/>";
      newCard += "<div class='readingTime'>"+time+"</div>";
      newCard += "<div class='largeTitle'>"+longTitle+"</div>";
      newCard += "<div class='title'>"+shortTitle+"</div>";
      newCard += "<div class='content'>"+shortContent+"</div>";
    newCard += "</div>";
  newCard += "</div>";
  return newCard;
}

function renderCards() {
  var cards = "";
  var cardLayoutCount = 0;
  $.each(articles, function(id, article){
    var cardString = appendCard(id, article, cardLayoutCount);
    if (cardString) {
      cards += cardString;
      cardLayoutCount++;
    }
  });
  cards += "<div class='clearBoth'></div>";
  $("#cardContainer").html(cards);
}

function createFilterStyle(){
  var string = "";
  for (var tagClass in articleIdByTags) {
    string += "#filters ."+articleFilters[tagClass].class+"_link { border-bottom: 2px solid "+articleFilters[tagClass].color+"; }";
    string += "#filters ."+articleFilters[tagClass].class+"_link.selected { background-color: "+articleFilters[tagClass].color+"; }";
    string += "#mobileFilters .filterItem div."+articleFilters[tagClass].class+"_link { border: 2px solid "+articleFilters[tagClass].color+"; }";
    string += "#mobileFilters .filterItem div."+articleFilters[tagClass].class+"_link.selected { background-color: "+articleFilters[tagClass].color+" !important; }";
    string += "."+articleFilters[tagClass].class+"_background { background-color: "+articleFilters[tagClass].color+" !important; }";
    string += "#overlay."+articleFilters[tagClass].class+"_border .overlayCenter { border-color: "+articleFilters[tagClass].color+" !important; }";
  }
  $("#dynamicStyles").html(string);
}

function renderNavigationBurger() {
  if (Object.keys(articleIdByTags).length > 3) {
    var bunNumber = 1;
    for (var key in articleIdByTags) {
      if (key !== articleFilters.all.class) {
        $("#burger"+bunNumber).removeClass().addClass(key+"_background");
        bunNumber++;
        if (bunNumber > 3) {
          break;
        }
      }
    }
  }
}

function getFilterItemString(tagClass) {
  return "<div class='filterItem' tagClass='"+tagClass+"'><div class='noSelectClick "+tagClass+"_link'>"+articleFilters[tagClass].title+"</div></div>";
}

function buildNavString(type) {
  if (type===articleFilters.all.class) {
    return getFilterItemString(type);
  }
  var string = "";
  for (var tagClass in articleIdByTags) {
    if (tagClass!==articleFilters.all.class) {
      string += getFilterItemString(tagClass);
    }
  }
  return string;
}

function renderNavigation() {
  var startString = buildNavString(articleFilters.all.class);
  var endString = buildNavString();
  $("#stagingArea").html(startString+endString);
  var headerSpace = $("header").width()-230;
  var filtersWidth = $("#stagingArea").width();
  $("#stagingArea").html("");
  if (filtersWidth > headerSpace) {
    $("#filters").html(startString);
    $("#mobileButton").removeClass("displayNone");
  } else {
    $("#filters").html(startString+endString);
    $("#mobileButton").addClass("displayNone");
  }
  addFilterSelected(currentTagType);
  return endString;
}

function render() {
  $(".dynamicMonthText").text("From Something, "+createArchiveTitle(currentArchive));
  $(".archiveItem").removeClass("selected");
  $(".archiveItem[archiveString='"+currentArchive+"']").addClass("selected");
  renderCards();
  createFilterStyle();
  var navString = renderNavigation();
  $("#mobileFilters").html(navString + "<div class='clearBoth'></div>");
  renderNavigationBurger();
}

function checkQueryString(){
  var articleId = getUrlParameter("articleId");
  if (articleId) {
    articleId = parseInt(articleId, 10);
    if (articleId>=0 && articleId<articles.length) {
      showArticle(articleId, 0);
    }
  }
}

function startUp() {
  render();
  checkQueryString();
  $("#loadingMask").fadeOut(100);
}

function showLoadingError(error) {
  $("#loadingText").text("Error! Please try again later.");
  $("#loadingPoll").hide();
  $("#warningIcon").show();
  throw JSON.stringify(error);
}

function init() {
  $("#loadingMask").show();
  $("#cardContainer").html("");
  articles = [];
  currentTagType = articleFilters.all.class;
  articleIdByTags = {};
  // Get value of archive parameter (if any)
  currentArchive = getUrlParameter("archive");
  if (!currentArchive) { // Specify current article if none passed in
    currentArchive = archiveDefault;
  }

  var settings = {
    "async": true,
    "crossDomain": true,
    "url": "https://api.nasa.gov/planetary/apod?api_key=l6IaSJLtLshfUdApvNXC3dzhATcE1w8c6bstBY28&concept_tags=true&date=[2018-10-10,2019-10-10]",
    "method": "GET"
  }

  $.ajax(settings).done (function(data) {
    articles = testData;
    // articles = data.sort(articleComparator);
    if (articles.length) {
      startUp();
    } else if (currentArchive !== archiveDefault && loadingMarker<3){
      loadingMarker++;
      window.history.pushState(null, null, "?archive="+archiveDefault);
      init();
    } else {
      showLoadingError("Articles not found.");
    }
  }).fail(function(error) {
    showLoadingError(error);
  });

  // articles = testData;
  // startUp();

  // hide when testing
  // GET the articles/posts as json
  // $.ajaxPrefilter( "json script", function( options ) {
  //   options.crossDomain = true;
  // });
  // $.ajax({
  //   type: "GET",
  //   url: "/index.php?json_route=/posts&filter[category_name]=" + currentArchive,
  //   dataType: "json"
  // }).done (function(data) {
  //   articles = data.sort(articleComparator);
  //   if (articles.length) {
  //     startUp();
  //   } else if (currentArchive !== archiveDefault && loadingMarker<3){
  //     loadingMarker++;
  //     window.history.pushState(null, null, "?archive="+archiveDefault);
  //     init();
  //   } else {
  //     showLoadingError("Articles not found.");
  //   }
  // }).fail(function(error) {
  //   showLoadingError(error);
  // });

  // articles = testData;
  // startUp();
}


const testData = [
  {
    concepts: "concept_tags functionality turned off in current service",
    copyright: "Anton Komlev",
    date: "2019-12-07",
    explanation: "In time stars trace lines through the night sky on a rotating planet. Taken over two hours or more, these digitally added consecutive exposures were made with a camera and wide angle lens fixed to a tripod near Orel farm, Primorsky Krai, Russia, planet Earth. The stars trail in concentric arcs around the planet's south celestial pole below the scene's horizon, and north celestial pole off the frame at the upper right. Combined, the many short exposures also bring out the pretty star colours. Bluish trails are from stars hotter than Earth's Sun, while yellowish trails are from cooler stars. A long time ago this tree blossomed, but now reveals the passage of time in the wrinkled and weathered lines of its remains.",
    hdurl: "https://apod.nasa.gov/apod/image/1912/LinesOfTimeKomlev.jpg",
    media_type: "image",
    service_version: "v1",
    title: "Lines of Time",
    url: "https://apod.nasa.gov/apod/image/1912/LinesOfTimeKomlev1100.jpg"
  },
  {
    concepts: "concept_tags functionality turned off in current service",
    copyright: "Anton Komlev",
    date: "2019-12-07",
    explanation: "In time stars trace lines through the night sky on a rotating planet. Taken over two hours or more, these digitally added consecutive exposures were made with a camera and wide angle lens fixed to a tripod near Orel farm, Primorsky Krai, Russia, planet Earth. The stars trail in concentric arcs around the planet's south celestial pole below the scene's horizon, and north celestial pole off the frame at the upper right. Combined, the many short exposures also bring out the pretty star colours. Bluish trails are from stars hotter than Earth's Sun, while yellowish trails are from cooler stars. A long time ago this tree blossomed, but now reveals the passage of time in the wrinkled and weathered lines of its remains.",
    hdurl: "https://apod.nasa.gov/apod/image/1912/LinesOfTimeKomlev.jpg",
    media_type: "image",
    service_version: "v1",
    title: "Lines of Time",
    url: "https://apod.nasa.gov/apod/image/1912/LinesOfTimeKomlev1100.jpg"
  },
  {
    concepts: "concept_tags functionality turned off in current service",
    copyright: "Anton Komlev",
    date: "2019-12-07",
    explanation: "In time stars trace lines through the night sky on a rotating planet. Taken over two hours or more, these digitally added consecutive exposures were made with a camera and wide angle lens fixed to a tripod near Orel farm, Primorsky Krai, Russia, planet Earth. The stars trail in concentric arcs around the planet's south celestial pole below the scene's horizon, and north celestial pole off the frame at the upper right. Combined, the many short exposures also bring out the pretty star colours. Bluish trails are from stars hotter than Earth's Sun, while yellowish trails are from cooler stars. A long time ago this tree blossomed, but now reveals the passage of time in the wrinkled and weathered lines of its remains.",
    hdurl: "https://apod.nasa.gov/apod/image/1912/LinesOfTimeKomlev.jpg",
    media_type: "image",
    service_version: "v1",
    title: "Lines of Time",
    url: "https://apod.nasa.gov/apod/image/1912/LinesOfTimeKomlev1100.jpg"
  },
  {
    concepts: "concept_tags functionality turned off in current service",
    copyright: "Anton Komlev",
    date: "2019-12-07",
    explanation: "In time stars trace lines through the night sky on a rotating planet. Taken over two hours or more, these digitally added consecutive exposures were made with a camera and wide angle lens fixed to a tripod near Orel farm, Primorsky Krai, Russia, planet Earth. The stars trail in concentric arcs around the planet's south celestial pole below the scene's horizon, and north celestial pole off the frame at the upper right. Combined, the many short exposures also bring out the pretty star colours. Bluish trails are from stars hotter than Earth's Sun, while yellowish trails are from cooler stars. A long time ago this tree blossomed, but now reveals the passage of time in the wrinkled and weathered lines of its remains.",
    hdurl: "https://apod.nasa.gov/apod/image/1912/LinesOfTimeKomlev.jpg",
    media_type: "image",
    service_version: "v1",
    title: "Lines of Time",
    url: "https://apod.nasa.gov/apod/image/1912/LinesOfTimeKomlev1100.jpg"
  },
  {
    concepts: "concept_tags functionality turned off in current service",
    copyright: "Anton Komlev",
    date: "2019-12-07",
    explanation: "In time stars trace lines through the night sky on a rotating planet. Taken over two hours or more, these digitally added consecutive exposures were made with a camera and wide angle lens fixed to a tripod near Orel farm, Primorsky Krai, Russia, planet Earth. The stars trail in concentric arcs around the planet's south celestial pole below the scene's horizon, and north celestial pole off the frame at the upper right. Combined, the many short exposures also bring out the pretty star colours. Bluish trails are from stars hotter than Earth's Sun, while yellowish trails are from cooler stars. A long time ago this tree blossomed, but now reveals the passage of time in the wrinkled and weathered lines of its remains.",
    hdurl: "https://apod.nasa.gov/apod/image/1912/LinesOfTimeKomlev.jpg",
    media_type: "image",
    service_version: "v1",
    title: "Lines of Time",
    url: "https://apod.nasa.gov/apod/image/1912/LinesOfTimeKomlev1100.jpg"
  },
  {
    concepts: "concept_tags functionality turned off in current service",
    copyright: "Anton Komlev",
    date: "2019-12-07",
    explanation: "In time stars trace lines through the night sky on a rotating planet. Taken over two hours or more, these digitally added consecutive exposures were made with a camera and wide angle lens fixed to a tripod near Orel farm, Primorsky Krai, Russia, planet Earth. The stars trail in concentric arcs around the planet's south celestial pole below the scene's horizon, and north celestial pole off the frame at the upper right. Combined, the many short exposures also bring out the pretty star colours. Bluish trails are from stars hotter than Earth's Sun, while yellowish trails are from cooler stars. A long time ago this tree blossomed, but now reveals the passage of time in the wrinkled and weathered lines of its remains.",
    hdurl: "https://apod.nasa.gov/apod/image/1912/LinesOfTimeKomlev.jpg",
    media_type: "image",
    service_version: "v1",
    title: "Lines of Time",
    url: "https://apod.nasa.gov/apod/image/1912/LinesOfTimeKomlev1100.jpg"
  }
];

// after loading register events
function registerClickEvents(){
  $(document).on("click", ".filterItem", function() {
    filterBy($(this).attr("tagClass"));
    $("#mobileFiltersOverlay").hide();
  });

  $(document).on("click", "#mobileButton", function() {
    $(".miniOverlay").hide();
    $("#mobileFiltersOverlay").stop(true, true).slideToggle();
  });

  $(document).on("click", ".cardItem", function() {
    hideAndClearOverLays();
    showArticle($(this).attr("articleId"), 250);
  });
  $(document).on("click", ".articleButton", function() {
    changeArticle($(this).attr("articleId"));
  });
  $(document).on("click", ".closeOverlay", function() {
    hideArticle();
  });

  $(document).on("click", "#feedback, #archive", function() {
    hideAndClearOverLays();
    $("#"+$(this).attr("id")+"Overlay").show();
  });
  $(document).on("click", ".closeMiniOverlay", function() {
    hideAndClearOverLays();
  });
  $(document).on("click", ".archiveItem", function() {
    hideAndClearOverLays();
    var string = $(this).attr("archiveString");
    window.history.pushState(null, null, "?archive="+string);
    init();
  });

  $(window).smartresize(function(){
    renderNavigation();
    $("#mobileFiltersOverlay").hide();
  });

  $(document).on("submit", "#feedbackForm", function(event) {
    var feedbackName = $("#feedbackName").val();
    var feedbackEmail = $("#feedbackEmail").val();
    var feedbackMessage = $("#feedbackMessage").val();
    if (feedbackName && feedbackEmail && feedbackMessage) {
      var data = $("#feedbackForm").serialize();
      $.post("./email_feedback.php", data, function(response) {
        var responseText = response==="success" ? "Thank you for your feedback!" : "Error, please try again later";
        $("#formWarning").text(responseText).show();
        $("#feedbackForm").hide();
      });
    } else {
      $("#formWarning").text("Please fill in all fields").show();
    }
    event.preventDefault();
  });
}


createArchiveButtons();
registerClickEvents();
init();
