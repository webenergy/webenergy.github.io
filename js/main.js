$we.require("core", function() {

	$(function() {
		$('.runnable').each(function() {
			var code = this;
			var button = '<div class="run" title="运行"></div>';
			$(button).insertBefore(code).bind('click', function(){
				$we.utils.exec($(code).find("code").text());
			});
		});

		hljs.tabReplace = '    '; // 4 spaces
	  	hljs.initHighlighting();
	});
});