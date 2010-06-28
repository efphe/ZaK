/*
	HUMANIZED MESSAGES 1.0
	idea - http://www.humanized.com/weblog/2006/09/11/monolog_boxes_and_transparent_messages
	home - http://humanmsg.googlecode.com
*/

var humanMsg = {
	setup: function(appendTo, logName, msgOpacity) {
		humanMsg.msgID = 'humanMsg';
		humanMsg.msgIDErr = 'humanMsgErr';
		humanMsg.logID = 'humanMsgLog';

		// appendTo is the element the msg is appended to
		if (appendTo == undefined)
			appendTo = 'body';

		// The text on the Log tab
		if (logName == undefined)
			logName = 'Zak Messages';

		// Opacity of the message
		humanMsg.msgOpacity = .8;

		if (msgOpacity != undefined) 
			humanMsg.msgOpacity = parseFloat(msgOpacity);

		// Inject the message structure
		jQuery(appendTo).append('<div id="'+humanMsg.msgID+'" class="humanMsg"><p></p></div> <div id="'+humanMsg.msgIDErr+'" class="humanMsgErr"><p></p></div> <div id="'+humanMsg.logID+'"><p>'+logName+'</p><ul></ul></div>')
		
		jQuery('#'+humanMsg.logID+' p').click(
			function() { jQuery(this).siblings('ul').slideToggle() }
		)
	},

	displayMsg: function(msg, err) {
		if (msg == '')
			return;

		clearTimeout(humanMsg.t2);

		// Inject message
        if (!err) 
          jQuery('#'+humanMsg.msgID+' p').html(msg);
        else
          jQuery('#'+humanMsg.msgIDErr+' p').html(msg);
	
		// Show message
        if (err) 
          var _kk= '#'+humanMsg.msgIDErr+'';
        else
          var _kk= '#'+humanMsg.msgID+'';
		jQuery(_kk).show().animate({ opacity: humanMsg.msgOpacity}, 200, function() {
			jQuery('#'+humanMsg.logID)
				.show().children('ul').prepend('<li>'+msg+'</li>')	// Prepend message to log
				.children('li:first').slideDown(200)				// Slide it down
		
			if ( jQuery('#'+humanMsg.logID+' ul').css('display') == 'none') {
				jQuery('#'+humanMsg.logID+' p').animate({ bottom: 40 }, 200, 'linear', function() {
					jQuery(this).animate({ bottom: 0 }, 300, 'easeOutBounce', function() { jQuery(this).css({ bottom: 0 }) })
				})
			}
			
		})

		// Watch for mouse & keyboard in .5s
        /*humanMsg.t1 = setTimeout("humanMsg.bindEvents()", 2400)*/
		// Remove message after 5s
		humanMsg.t2 = setTimeout("humanMsg.removeMsg()", 2400)
	},

	bindEvents: function() {
	// Remove message if mouse is moved or key is pressed
		jQuery(window)
			.mousemove(humanMsg.removeMsg)
			.click(humanMsg.removeMsg)
			.keypress(humanMsg.removeMsg)
	},

	removeMsg: function() {
		// Unbind mouse & keyboard
                 /*jQuery(window)*/
                 /*.unbind('mousemove', humanMsg.removeMsg)*/
                 /*.unbind('click', humanMsg.removeMsg)*/
                 /*.unbind('keypress', humanMsg.removeMsg)*/

		// If message is fully transparent, fade it out
		if (jQuery('#'+humanMsg.msgID).css('opacity') == humanMsg.msgOpacity) 
			jQuery('#'+humanMsg.msgID).animate({ opacity: 0 }, 500, function() { jQuery(this).hide() });
		if (jQuery('#'+humanMsg.msgIDErr).css('opacity') == humanMsg.msgOpacity) 
			jQuery('#'+humanMsg.msgIDErr).animate({ opacity: 0 }, 500, function() { jQuery(this).hide() });
	}
};

jQuery(document).ready(function(){
	humanMsg.setup();
})
