var slideshow = (function(){

	var maxThumbnailHeight = 320;	// maximum height 
	var margin = 3;				// margin around gallery images
	var slideshowMargin = 3;	// margin around slideshow image

	var photos;					// array of all thumbnails
	var slideshowIndex = 0;		// index of image being displayed in the slideshow, -1 if in gallery mode
	var lastRowIndex = 0;		// index of the first image of the last incomplete row 

	var lastWidth = 0;			// width of entire gallery
	var lastHeight = 0;			// height of entire gallery

	var success; 	// if we got the gallery to be the right height (used for sideGallery)
	var inSlideshow = 0;
	var useAnimations; 
	var useCrossFade=0; 

	// infinite scroll variables
	var loadURL;			// URL to load more images from
	var start = 0;			// start loading images from this index using AJAX
	var step = 10;			// Number of images we load each time 
	var reachedBottom = 0;	// True if we've loaded all the photos and reached the bottom of the page
	var loading = 0;		// True if currently executing a ajax load of more images
	
	function setupGallery(URL){
		loadURL = URL;
		slideshowIndex = -1;	// gallery mode
		$("#JustifiedGallery").addClass("galleryMode");
		margin = 6;
		init();
	}
	function setupSlideshow(URL, Animations){
		loadURL = URL;
		useAnimations = Animations;
		slideshowIndex = 0;
		$("#JustifiedGallery").addClass("slideshowMode");
		init();
		$("#JustifiedGallery").append("<div id='overlay'></div> \
									<div id='slideshowBox' class='slideshowBox'></div>");
		$("#overlay").height($("body").height()+75).click(function(){closeSlideshow();});
		var next = $("<div>").html($("<img>").attr("src","/images/next.png").css({right:0})).attr("id","next").addClass("arrow unselectable").css({right:0, width:"75%"});
		var prev = $("<div>").html($("<img>").attr("src","/images/prev.png")).attr("id","previous").addClass("arrow unselectable").css({left:0, width:"25%"});
		var close = $("<div>").html($("<img>").attr("src","/images/close.png")).attr("id","close").css("display","none");
		var loading = $("<img>").attr("src","/images/loading2.gif").attr("id","loading").addClass("unselectable");
		
		//next.bind("click",nextSlide);
		//prev.bind("click",previousSlide);
		//close.click(function(event){closeSlideshow();});
		$("#slideshowBox").append(next).append(prev).append(loading).append(close).css({display:"none",opacity:0});
		initSwipe();
	}
	
	function init(){
		photos = $("#originals img");
		$("#originals").css("display","none");
		//set up divs
		$("#JustifiedGallery").html("<div id='Gallery' class='gallery'></div>");
		$("#JustifiedGallery").after('<img src="/images/horizontal_loading.gif" alt="loading" id="loading_horizontal" />');
		
		$(window).resize(function() { 
			if (atBottom()) loadMoreImages();
			var nowWidth = $("#JustifiedGallery").innerWidth();
			var nowHeight = $(window).innerHeight();
			$("#overlay").height($("body").height()+75);
			 
			 // test to see if the window resize is big enough to deserve a reprocess
			if (nowWidth < lastWidth || nowWidth > lastWidth || nowHeight > lastHeight+30 || nowHeight < lastHeight-30){
				lastWidth = $("#JustifiedGallery").innerWidth();
				lastHeight = $(window).innerHeight();
				justifiedGallery($("#Gallery"),Infinity, 0,Infinity, maxThumbnailHeight);
				if (inSlideshow) slideshow();
			}
		});
		$(window).resize();
	}
	
	var slideshowScrollSpeed = .3;
	var desiredSlideIndex = 0;
	function nextSlide(e){
		//$("#slideshowBox").stop(true);
		if (slideshowIndex + 1 >= photos.length){	// stop at last image in the slideshow
			$("#slideshowBox").animate({"left":$(window).width()/2},500);
		}else if($("#slideshowBox").queue().length==0){	// nothing currently animating
			desiredSlideIndex = slideshowIndex+1;
			slideTransition();
		}else{
			if (desiredSlideIndex<photos.length-1) desiredSlideIndex++;
			slideTransition();
		}
	}
	function previousSlide(e){
		//$("#slideshowBox").stop(true);	
		if (slideshowIndex-1<0){	// stop at first image in the slideshow
			$("#slideshowBox").animate({"left":$(window).width()/2},500);
		}else if($("#slideshowBox").queue().length==0){	// nothing currently animating
			desiredSlideIndex = slideshowIndex-1;
			slideTransition();
		}else{
			if (desiredSlideIndex>0) desiredSlideIndex--;
			slideTransition();
		}
	}
	
	function slideTransition(diff){
		$("#slideshowBox").stop(true);
		if (!diff)	var diff = Math.abs(desiredSlideIndex - slideshowIndex);
		if (desiredSlideIndex>slideshowIndex){	// next slide transition
			var left = $("#nextSlide").length==0?
					- $(window).width()/2:	//if next slide hasn't loaded yet
					- $("#nextSlide").width()/2;
			var speed = (diff == 1)? // transition once
							($("#nextSlide").width()/2 + $("#slideshowBox").position().left)*slideshowScrollSpeed: // change speed based on distance
							200 / (diff);
			$("#slideshowBox").animate({
				"left":  left
				},speed,"linear",
				function(){
					slideshowIndex++;
					slideshow();
					slideTransition(diff);
				});
		}else if (desiredSlideIndex<slideshowIndex){ // previous slide transition
			var left = $("#prevSlide").length==0?
					$(window).width()*1.5:	//if next slide hasn't loaded yet
					$("#prevSlide").width()/2+ $(window).width();
			var speed = (diff == 1)? // transition once
							(($("#prevSlide").width()/2+ $(window).width()) - $("#slideshowBox").position().left)*slideshowScrollSpeed:	// change speed based on distance
							200 / (diff);
			$("#slideshowBox").animate({
				"left": left
				},speed,"linear",
				function(){
					slideshowIndex--;
					slideshow();
					slideTransition(diff);
				});
		}
	}
	
	var startTouchX;	// location that user started swipe
	var startTime=-1;	// time that user started swipe, set to -1 if not currently swiping
	
	function initSwipe(){
		$(".slideshowBox").on('touchstart mousedown',function(e) {
			startTime = jQuery.now();
			e.preventDefault();
						
			if (e.type=="touchstart"){
				startTouchX = e.originalEvent.touches[0].pageX;
				$("#next").html("TouchStart<br />");
			}else if(e.type=="mousedown"){
				startTouchX = e.pageX;
			}
			
			$(".slideshowBox").live("touchmove mousemove", onTouchMove);
		});
		
		$(".slideshowBox").on('touchend mouseup mouseout', function(e) {
			if (startTime!=-1){	// currently swiping
				//e.preventDefault();
				$(".slideshowBox").die("touchmove mousemove");
				
				if (e.type=="touchend")	 var touchLocation = e.originalEvent.changedTouches[0].pageX;
				else if	(e.type=="mouseup" || e.type=="mouseout" ) var touchLocation = e.pageX;
				
				var distanceMoved = touchLocation - startTouchX;
				
				// determine if slide attempt triggered next/prev slide
				if(Math.abs(distanceMoved) > $(window).width()/4 	//swiped far enough
					|| Math.abs(distanceMoved)>20 && (jQuery.now() - startTime)<250){	// or swiped more than 20px in less than 250ms
					if(distanceMoved < 0){	//swiped left, load next
						nextSlide();
					}else{	//swiped right, load previous
						previousSlide();
					}
				}else if (Math.abs(distanceMoved)<20){
					if(jQuery(e.target).attr("id")=="previous" || jQuery(e.target).parents(".arrow").attr("id")=="previous"){	//Click Previous
						previousSlide();
					}else if(jQuery(e.target).attr("id")=="next" || jQuery(e.target).parents(".arrow").attr("id")=="next"){	//Click Next
						nextSlide();
					}else if(jQuery(e.target).attr("id")=="close" || jQuery(e.target).parent().attr("id")=="close"){	//Click Close
						closeSlideshow();
					}
				}else
					$("#slideshowBox").css("left",$(window).width()/2);
					
				startTime = -1;
			}
		});
	}
	
	function onTouchMove(e){
		if (e.type=="touchmove")	 var touchLocation = e.originalEvent.touches[0].pageX;
		else if	(e.type=="mousemove") var touchLocation = e.pageX;
		
		$("#slideshowBox").css("left",$(window).width()/2 - (startTouchX-touchLocation));
		
	}


	// keyboard shortcuts for seeing the next image
	// left: 37, up: 38, right: 39, down: 40, spacebar: 32, 
	$(document).keydown(function(e){
		if (slideshowIndex > -1 && inSlideshow){	// in slideshow mode
			if (e.keyCode == 37 || e.keyCode == 38) { 	//left or up key press
				previousSlide(e);
				preventDefault(e);
				return;
			}else if (e.keyCode == 39 || e.keyCode == 40 || e.keyCode == 32) { //right or down or space key press
				nextSlide(e);
				preventDefault(e);
				return;
			}else if (e.keyCode == 27) { // esc key press
				closeSlideshow();
			}
		}
	});
	$(document).mousedown(function(e){
		if (slideshowIndex > -1 && inSlideshow){	// in slideshow mode
			if (e.button == 1) { 	//center click
				preventDefault(e);
				return;
			}
		}
	});

	////Disable scrolling
	var keys = [33,34,35,36]; // pageup: 33, pagedown: 34, end: 35, home: 36

	function preventDefault(e) {
		e = e || window.event;
		if (e.preventDefault) {
			e.preventDefault();
		}
		e.returnValue = false;
	}

	function keydown(e) {
		for (var i = keys.length; i--;) {
			if (e.keyCode === keys[i]) {
				preventDefault(e);
				return;
			}
		}
	}

	function wheel(e) {
		preventDefault(e);
	}

	function disable_scroll() {
		if (window.addEventListener) {
			window.addEventListener('DOMMouseScroll', wheel, false);
		}
		window.onmousewheel = document.onmousewheel = wheel;
		window.ontouchmove = document.ontouchmove = wheel;
		document.onkeydown = keydown;
	}

	function enable_scroll() {
		if (window.removeEventListener) {
			window.removeEventListener('DOMMouseScroll', wheel, false);
		}
		window.onmousewheel = document.onmousewheel = window.ontouchmove = document.ontouchmove = document.onkeydown = null;
	}

	// Main function that creates the justified gallery

	function justifiedGallery(gallery, maxHeight, startIndex, stopIndex, thumbnailHeight)
	{	
		success = false; 	// if we got the gallery to be the right height
		
		var photoIndex = startIndex;
		var totalRowWidth = 0;			// cumulative width of image in the current row 
		var lastFullRowPhotoNum = -1;	// index of the last image in the last complete row
		
		if(gallery.hasClass("gallery"))	gallery.width(lastWidth);
		
		// div to contain the images
		var galleryRow = $("<div />").addClass("galleryRow").appendTo(gallery);		// add new row
		//var galleryRow = $("<div />").addClass("galleryRow");
		//gallery.html(galleryRow);
		
		// get row width - this is fixed.
		var rowWidth = galleryRow.innerWidth();

		var currentHeight = thumbnailHeight;
			
		// if maxHeight is less than the height of a thumbnail
		/*if (maxHeight-margin*2 < thumbnailHeight){	
			// make all thumbnails maxHeight
			currentHeight = maxHeight/2;
		}else if (maxHeight-margin*2 < 2*thumbnailHeight){
			currentHeight = maxHeight/2;
		}*/
		
		while(photoIndex < photos.length && photoIndex < stopIndex){
			
			//TODO: rows with mostly portrait photos should use larger thumbnails?
			
			//////////////// 	add image to row	////////////////
			var photo = photos.eq(photoIndex)
			photo.stop();	//stop animations (fading)
			photo.css({width:"",height:"",opacity:""});	// clear styles
			photo.parent(".galleryRow").remove();
			//console.log(photo.parent());
			
			galleryRow.append(photo);
			photo.height(currentHeight);
			totalRowWidth += photo.width() + margin*2;	// add photo's width to total row count
			
			if (slideshowIndex > -1){	// slideshow mode			
				// load slideshow with this image on click
				 photo.click(function(num){
					return function(event){	// this function is needed for due to scoping issues of photoIndex
						slideshowIndex = num;
						slideshow();
					}
				}(photoIndex));
			}else{	//gallery mode
				var link = $("#originals").children("a").eq(photoIndex).clone();
				link.html(photo);
				galleryRow.append(link);
			}
			
			photoIndex++;
			
			// If the row is full, calculate the new height of the row
			if(galleryRow.height()>currentHeight*1.5 || totalRowWidth>rowWidth){
				
				var ratio = rowWidth / totalRowWidth;
				var newHeight = Math.floor(currentHeight*ratio);	// calculate height of row such that it is the correct width
				totalRowWidth = 0
				galleryRow.find("img").each(function(){ $(this).height(newHeight);}); // set new height
				galleryRow.find("img").each(function(){
					$(this).width(Math.floor($(this).width()));
					totalRowWidth += Math.floor($(this).width()) + margin*2
				}); // set width
				
				console.log("totalRowWidth: "+totalRowWidth+ " maxWidth: "+rowWidth+" diff: "+(rowWidth - totalRowWidth));
								
				var numImages = galleryRow.children().length;
				if (numImages == 1){
					galleryRow.find("img").width(rowWidth - 2 * margin -.5);
				}else{
					// if total width is slightly smaller than 
					// actual div width then add 1 from each 
					// photo width till they match
					var i=0;
					while(galleryRow.height()<newHeight*1.5 && totalRowWidth<rowWidth){
						var img = galleryRow.find("img").eq(i%numImages);
						img.width(img.width()+.9);
						i++;
						totalRowWidth++;
						if (i>25){ 
							console.log("ERROR: COULD NOT FIT IMAGE "+photoIndex+" IN ROW");
							break;
						}
					}
					if(galleryRow.height()>newHeight*1.5 && i>1)	img.width(img.width()-1);	// decrease by 1 so that it all fits in one line
						
					// if total width is slightly bigger than 
					// actual div width then subtract 1 from each 
					// photo width till they match
					while(galleryRow.height()>newHeight*1.5){
						var img = galleryRow.find("img").eq(i%numImages);
						img.width(img.width()-1.5);
						i++;
						totalRowWidth--;
						if (i>50){ 
							console.log("ERROR: COULD NOT FIT IMAGE "+photoIndex+" IN ROW");
							break;
						}
					}
				}
				galleryRow.height(newHeight + margin*2);

				if (modifyGalleryHeight(gallery,galleryRow,maxHeight) == "stop") break;
				
				lastFullRowPhotoNum = photoIndex-1;
				totalRowWidth = 0;
				if(currentHeight!=thumbnailHeight){
					currentHeight = maxHeight - currentHeight - margin*2
				}
				lastRowIndex = photoIndex;
				if (photoIndex != photos.length)
					galleryRow = $("<div />").addClass("galleryRow").appendTo(gallery);		// add new row
			}else if (photoIndex == photos.length){
				galleryRow.height(currentHeight + margin*2);
				modifyGalleryHeight(gallery,galleryRow,maxHeight);
				break;
			}	
			
		}
		
		if (slideshowIndex == -1){	// gallery mode		
			//add labels for gallery items
			$(".thumbnail").each(function(){ 
				var label = $("<div />").addClass("photoLabel").html($(this).attr("alt"));
				var position = $(this).position();
				position.top += $(this).height();
				label.offset(position);
				label.width($(this).width());
				$(this).after(label);
			});
			//adjust row sizes for labels
			$(".galleryRow").each(function(){
				var heights = $(this).find(".photoLabel").map(function(){
					return $(this).height();
				}).get();
				$(this).height($(this).height() + Math.max.apply(Math,(heights)));
			});
		}
				
		if (photoIndex == stopIndex || gallery.height() > maxHeight){	// if next image is the slideshow image or too tall (last row contains incomplete row), remove last row
			galleryRow.remove();	//remove last row
			return lastFullRowPhotoNum;
		}else if (photoIndex == photos.length){
			success=true;
		}
		return photoIndex-1;
	}
	
	function modifyGalleryHeight(gallery,galleryRow,maxHeight){
		
		if(maxHeight < Infinity){	// if we want the gallery a specific height (like for the sideGallery)
			var heightDiff = gallery.height() - maxHeight;	
			console.log("Height Diff = "+heightDiff);					
			if (heightDiff==0){	// if exactly the right height
				console.log("SUCCESS");
				success = true;
				return "stop";
			}else if(heightDiff>-10 && heightDiff<10){		//slightly too tall or too short
				var i = 0;
				var numRows = gallery.children().length
				while (heightDiff!=0){
					var row = gallery.children().eq(i%numRows)
					var images = row.find("img");
					if (heightDiff>0)
						var newHeight = row.height() - 1;
					else
						var newHeight = row.height() + 1;
					images.each(function(){ $(this).height(newHeight-margin*2);}); // set new height of the last row
					row.height(newHeight);
					heightDiff = gallery.height() - maxHeight;	
				}
				console.log("SUCCESS"+"  Height Diff = "+heightDiff);
				success = true;
				return "stop";
				
			}else if (heightDiff>0){ // if sideGallery is much taller than the slideshow, remove the last row
				//galleryRow.remove();
				//console.log("Height Diff = "+(gallery.height() - maxHeight +" after removing a row"));
				console.log("Give up");
				return "stop";
			}
		}
		return "continue";
	}

	function slideshow(){
		disable_scroll();
		$('body,html').stop(); //stop animations
		$("#loadingOverThumbnail").remove();
		var image = $("<img>").attr("src",$("#originals").children("a").eq(slideshowIndex).attr("href")).addClass('slideshow');
		
		//load next and previous image
		if(slideshowIndex>0){
			$("#slideshowBox #prevSlide").addClass("old");
			var prevSlide = $("<img>").attr("src",$("#originals").children("a").eq(slideshowIndex-1).attr("href")).attr("id","prevSlide").css("position","absolute").addClass("slide");
			prevSlide.load(setupSlide);
		}
		if(slideshowIndex<photos.length-1){
			$("#slideshowBox #nextSlide").addClass("old");
			var nextSlide = $("<img>").attr("src",$("#originals").children("a").eq(slideshowIndex+1).attr("href")).attr("id","nextSlide").css("position","absolute").addClass("slide");
			nextSlide.load(setupSlide);
		}
			
		// remove arrow for first and last image
		if(slideshowIndex==0){
			$("#previous").css("opacity",0);
		}else{
			$("#previous").css("opacity","");
		}
		if(slideshowIndex==photos.length-1){
			$("#next").css("opacity",0);
		}else{
			loadMoreImages();
			$("#next").css("opacity","");
		}
		
		if (!inSlideshow){	//if you're opening the slideshow
			$("#slideshowBox").css("opacity","1");	//open slideshow box
			
			var thumbnail = photos.eq(slideshowIndex);
			var loading = $("<img>").attr("src","/images/loading2.gif").attr("id","loadingOverThumbnail").addClass("unselectable");
			loading.css({
				position: "absolute",
				left: thumbnail.offset().left + thumbnail.width()/2 - 22,
				top: thumbnail.offset().top + thumbnail.height()/2 - 22,
				display: "none",
			});
			loading.fadeIn(1000);
			$("#JustifiedGallery").append(loading);
			image.css("opacity","0");
			
			if (useAnimations){
				// setup zoom image
				var image2 = $("<img>").attr("src",$("#originals").children("a").eq(slideshowIndex).attr("href"));
				image2.css({
					height: thumbnail.height(),
					width: thumbnail.width(),
					position: "absolute",
					left: thumbnail.offset().left,
					top: thumbnail.offset().top,
					"z-index": 10
				});
			}
		}else{	// scrolling through images
			//set-up cross fade 
			if (useAnimations && useCrossFade){
				$("#JustifiedGallery .slideshow").fadeTo(1000,0);	// fade out image
				$("#slideshowBox #loading").fadeTo(2000, .9);		// show loading icon
			}else{
				$("#JustifiedGallery .slideshow").css("opacity","0");// remove image
				$("#slideshowBox #loading").css("opacity",.9);		// show loading icon
			}
			
			// make a copy of the current slideshow image to fade out
			$(".slideshowBoxCopy").remove();
			var oldImage = $("#slideshowBox").clone().attr("id","").addClass("slideshowBoxCopy").css("z-index",6);
			$("#JustifiedGallery").append(oldImage);	
			$("#slideshowBox").css({
				display:"block",
				top:$(window).height()/2,
				left:$(window).width()/2
			});
		}
		
		// Once the image loads
		image.load(function(useAnimations, slideshowIndexLoaded){
			return function(event){	
				if (slideshowIndex != slideshowIndexLoaded)	return;// not current image
				$("#slideshowBox").css({display:"block"});
				$("#slideshowBox #loading").stop(true,true);
				$("#slideshowBox #loading").css("opacity",0);		// remove loading icon
				$("#JustifiedGallery .slideshow, .slide").appendTo(oldImage);	// move the previous photo
				$("#slideshowBox").append(image);					// display new photo
				$("#slideshowBox .slide.old").remove();
				$("body").css("overflow","hidden");		// prevent scrolling while in slideshow
				
				setSlideShowImageSize(image);
				
				$("#slideshowBox").css({
					"margin-top": -.5*image.height() + $(window).scrollTop(),
					"margin-left": -.5*image.width(),
					top:$(window).height()/2,
					left:$(window).width()/2
				});
				
				if (!inSlideshow){	//if you're opening the slideshow
					$("#overlay").css("display","block");	// grey out background
					loading.remove();
					$(".slide").remove();
					
					if (useAnimations){
						// have the thumbnail enlarge
						$("#JustifiedGallery").append(image2);			
						image2.animate({
							height: image.height(),
							width: image.width(),
							left: image.offset().left,
							top: image.offset().top
							}, 500, 
							function(){
								$(this).remove();
								image.css("opacity","1");
								$("#close").css("display","block");
							});
					}else{
						image.css("opacity","1");
						$("#close").css("display","block");
					}
				}else{		// scrolling through images
					//cross fade 
					if (useAnimations && useCrossFade){
						image.css("display","none");
						image.fadeIn(1000, function(){
							$(".slideshowBoxCopy").remove();
						});
					}else{
						$(".slideshowBoxCopy").remove();
					}
				}
								
				
				
				inSlideshow = 1;
			};
		}(useAnimations, slideshowIndex));
	}
	
	// setup hidden slides (previous and next) once they have loaded
	function setupSlide(eventObject){
		var image = jQuery(eventObject.target);
		
		if(image.attr("id") == "prevSlide"){
			image.css("right", $(".slideshow").width()/2 + $(window).width()/2);
			$("#prevSlide.old").remove();
		}else if(image.attr("id") == "nextSlide"){
			image.css("left", $(".slideshow").width()/2 + $(window).width()/2);
			$("#nextSlide.old").remove();
		}
		
		$("#slideshowBox").append(image);
		setSlideShowImageSize(image);
		image.css({
			"margin-top": -.5*image.height(),
			top: $(".slideshow").height()/2
		})
	}
	// Set slideshow image size
	function setSlideShowImageSize(image){
		if(image.width() > image.height()){ //landscape image
			image.css("height", "")
			image.width($(window).width()-slideshowMargin*2);
		}else{								//portrait image
			image.css("width", "")
			image.height($(window).height()-slideshowMargin*2);			
		}
		if (image.width()> $(window).innerWidth()){	//if screen too narrow, maximize width
			image.css("height", "")
			image.width($(window).innerWidth()-slideshowMargin*2);
		}
		if (image.height()> $(window).innerHeight()){	//if screen too short, maximize height
			image.css("width", "")
			image.height($(window).innerHeight()-slideshowMargin*2);
		}
	}
	
	function closeSlideshow(){
		enable_scroll();
		inSlideshow = 0;
		$("#overlay").css("display","none");
		$("body").css("overflow","");
		var image = $("#JustifiedGallery .slideshow");
		
		// image shrinks to thumbnail
		if (useAnimations){
			var image2 = $("<img>").attr("src",$("#originals").children("a").eq(slideshowIndex).attr("href"));
			image2.css({
				height: image.height(),
				width: image.width(),
				position: "absolute",
				left: image.offset().left,
				top: image.offset().top,
				"z-index": 10
			});
			$("#JustifiedGallery").append(image2);		
			image2.animate({
				height: photos.eq(slideshowIndex).height(),
				width: photos.eq(slideshowIndex).width(),
				position: "absolute",
				left: photos.eq(slideshowIndex).offset().left,
				top: photos.eq(slideshowIndex).offset().top,
				}, 1000, 
				function(){
					$(this).remove();	// remove the slideshow photo
				}
			);				
		}
		image.remove();
		$("#slideshowBox #loading").css("opacity",0);
		$("#slideshowBox").css({display:"none",opacity:0});
		$("#close").css("display","none");
		$('body,html').animate({scrollTop:photos.eq(slideshowIndex).offset().top - .25*$(window).innerHeight()},1000); // scroll to where the slideshow photo is
	}
		
	function atBottom(){
		return $(window).scrollTop() + 350 >= ($(document).height() - $(window).height())
	}

	// load more images using ajax
	function loadMoreImages(){
		if (!reachedBottom && !loading){
			loading = 1;
			$.ajax({
				url: loadURL,
				data:{ 
					'start' :   start, 
					'end'   :   start + step
				},
				success: function(data) {
					$('#originals').append(data);
					
					// wait till all images have loaded before processing
					var imagesCount = $('#originals').find('.thumbnail').length;
					if (imagesCount==0){	// we've finished displaying all the images (reached the bottom of the page)
						reachedBottom=1;
						$("#loading_horizontal").hide();
					}else{
						var imagesLoaded = 0;
						$('#originals').find('.thumbnail').load( function() {
							++imagesLoaded;
							if (imagesLoaded >= imagesCount) {
								processNewImages();
								loading=0;
								if (atBottom()) loadMoreImages();		// if still not enough photos, load more
							}
						});
					}
				}
			});
			start = start+step;
		}
	}
	
	// process newly loaded images
	function processNewImages(){
		$.merge(photos,$("#originals img"));
		justifiedGallery($("#Gallery"),Infinity, lastRowIndex ,Infinity, maxThumbnailHeight);		
		$("#overlay").height(Math.max($("body").height()+75 , $(window).height() + $(window).scrollTop()));	//update the overlay
	}
	$(window).scroll(function () {if (atBottom()) loadMoreImages();});

	// make these functions publicly available 
	return {
		setupGallery:setupGallery,
		setupSlideshow:setupSlideshow,
		processNewImages:processNewImages
	}
	
}());


// TODO: add touch swipe feature