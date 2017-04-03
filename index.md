---
# You don't need to edit this file, it's empty on purpose.
# Edit theme's home layout instead if you wanna make some changes
# See: https://jekyllrb.com/docs/themes/#overriding-theme-defaults
layout: default
bodyClass: gray
---
<div class="overlay"></div>
<div class="homepage">
    <a href="/frontend/" class="section">
        <h1 id="engineer-header">front-end engineer</h1>
        <pre><code class="javascript"></code></pre>
    </a>
    <a href="/photographer/" class="section">
        <img src="/images/horizontal_loading.gif" alt="loading" id="loading_horizontal" class="hide loading_horizontal" />
        <h1 id="photographer-header">photographer</h1>
        <div id="JustifiedGallery" class="gallery"></div>
    </a>
</div>
<div id="originals">
{% assign files = site.static_files %}
    {% for file in files %}
        {% if file.path contains 'photos/index' and file.extname == '.jpg'%}
            <a href="{{file.path}}"><img src="{{file.path}}" class="thumbnail" /></a>
        {% endif %}
    {% endfor %}
</div>
<link rel="stylesheet" href="/css/tomorrow.css">
<script type="text/javascript" src="/js/highlight.pack.js"></script>
<script type="text/javascript" src="/js/slideshow.js"></script>
<script language="JavaScript">
    var showImagesOnComplete = false;
    var showImageCode =
"var images = loadAllImages();\n\
 \n\
_.foreach(images, function (image) {\n\
  image.show();\n\
});";

    var showEngineerTextCode = "\n\n\ndisplayText('front-end engineer');"

    var showPhotographerTextCode = "\n\ndisplayText('photographer');";

    addCode($('code'), showImageCode, fadeInImages);

    $(window).load(function() {
        var isMobile = $(window).width() < 768;
        var headerHeight = 185;

        randomize($("#originals"));

        slideshow.setupGallery({
            margin: 2,
            maxThumbnailHeight: isMobile ? 100 : 200,
            calcGalleryMaxHeight: function(){
                return isMobile ? 
                        ($(window).height() - headerHeight)/2 : 
                        $(window).height() - headerHeight
            },
            onComplete: function() {
                if (showImagesOnComplete)
                    fadeInImages();
            }
        });
    });

    function randomize(parent) {
        var divs = parent.children();
        while (divs.length) {
            parent.append(divs.splice(Math.floor(Math.random() * divs.length), 1)[0]);
        }
    }

    function fadeInImages() {
        var images = $('.gallery a');
        if (!images.length) {
            showImagesOnComplete = true;
            $('#loading_horizontal').css('display', 'block');
            return;
        }
        var cursor = $('<span>').text('|');
        var i = 0;
        var imageInterval = setInterval(function () {
            $(images.get(i)).css('opacity', 1);
            i++;
            if (i >= images.length) {
                clearInterval(imageInterval);
                addCode($('code'), showEngineerTextCode, showTextEngineer);
            }
        }, 400);
    }


    function addCode(container, code, onComplete) {
        var prevCode = container.text().slice(0, -1);
        typeCode(container, prevCode + code, prevCode.length, onComplete);
    }

    function typeCode(container, code, i, onComplete) {

        container.html(code.substring(0, i));

        if (i <= code.length) {
            var waitTime = code.charAt(i) === ' '? 100:  40;
            container.append('|');
            setTimeout(function() {
                typeCode(container, code, i+1, onComplete);
            }, waitTime);
        } else {
            container.append('<span class="typed-cursor">|</span>');
            onComplete();
        }
        hljs.highlightBlock(container.get(0));
    }

    function showTextEngineer() {
        $('#engineer-header').addClass('show');
        $('code').addClass('dim');
        setTimeout(function() {
            addCode($('code'), showPhotographerTextCode, showTextPhotographer);
        }, 1000);
    }
    function showTextPhotographer() {
        $('#photographer-header').addClass('show');
        $('.gallery').addClass('dim show-all-images');
    }
</script>
