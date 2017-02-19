	// style page depending on width of screen
	$(window).resize(function() { 
		if($(window).innerWidth() < 800){
			$("#main_container").css("margin-left", Math.max(5,100 - (700 - $(window).innerWidth())/3));
			$("#main_container").css("margin-right", Math.max(5,100 - (700 - $(window).innerWidth())/3));
			$("#nameHeader").css("margin-top",0).css("width", $("#main_container").innerWidth() - 5);
			$("#fullLinks").css("display","none");
			$("#compressedLinks").css("display","block");
		}else{
			$("#main_container").css({
				"margin-left": 100,
				"margin-right": 100,
			});
			$("#nameHeader").css("margin-top",20).css("width", "");
			$("#fullLinks").css("display","block");
			$("#compressedLinks").css("display","none");
		}
	});
	$(window).resize();