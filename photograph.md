---
layout: default
title: Danica Chang - Photographer
permalink: /photography/
---

<div id="JustifiedGallery" class="gallery"></div>      
<div id="originals">
    {% for file in site.static_files %}
        {% if file.path contains 'thumbnail' %}{% else %}
            {% if file.path contains 'photos/' and file.extname == '.jpg'%}
                <a href="/photos/{{file.name}}"><img src="/photos/thumbnails/{{file.name}}" class="thumbnail" /></a>
            {% endif %}
        {% endif %}
    {% endfor %}
</div>
<script language="JavaScript">    
$(window).load(function() {
    slideshow.setupSlideshow('getPhotos.php', 1, false);
});
</script>
