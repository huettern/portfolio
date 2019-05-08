/*
* @Author: Noah Huetter
* @Date:   2019-05-07 15:13:41
* @Last Modified by:   Noah Huetter
* @Last Modified time: 2019-05-08 21:15:13
*/

jQuery(document).ready(function() {

  /* Back to Top button logic */
  var bttbtn = $('#bttbutton');
  $(window).scroll(function() {
    if ($(window).scrollTop() > 300) {
      bttbtn.addClass('show');
    } else {
      bttbtn.removeClass('show');
    }
  });

  bttbtn.on('click', function(e) {
    $("html, body").animate({ scrollTop: 0 }, "slow");
  });

  /* scroll progress logic */
  $(".progressCounter").progressScroll();

  var spbadge = $('.progressCounter');
  $(window).scroll(function() {
    if ($(window).scrollTop() > 300) {
      spbadge.addClass('show');
    } else {
      spbadge.removeClass('show');
    }
  });

});

/*
 * December 2014
 * progressScroll 1.0.0
 * @author Mario Vidov
 * @url http://vidov.it
 * @twitter MarioVidov
 * GPL license
 */

$.fn.progressScroll = function(options) {

    var settings = $.extend({
        width: 50,
        height: 50,
        borderSize: 10,
        mainBgColor: "#ffffff",
        lightBorderColor: "#7d7e80  ",
        darkBorderColor: "#343a40",
        fontSize: "20px"
    }, options);

    var innerHeight, offsetHeight, netHeight,
        self = this,
        container = $(".progressCounter"),
        borderContainer = "progressScroll-border",
        circleContainer = "progressScroll-circle",
        textContainer = "progressScroll-text";

    this.getHeight = function () {
        innerHeight = window.innerHeight;
        offsetHeight = document.body.offsetHeight;
        netHeight = offsetHeight - innerHeight;
    }

    this.addEvent = function () {
        var e = document.createEvent("Event");
        e.initEvent("scroll", false, false);
        window.dispatchEvent(e);
    }

    this.updateProgress = function (per) {
        var per = Math.round(100 * per);
        var deg = per * 360 / 100;
        if (deg <= 180) {
            $("." + borderContainer, container).css(
              "background-image", 
              "linear-gradient(" + (90 + deg) + 
              "deg, transparent 50%, #7d7e80 50%),linear-gradient(90deg, #7d7e80 50%, transparent 50%)");
        }
        else {
            $("." + borderContainer, container).css("background-image",
             "linear-gradient(" + (deg - 90) + 
             "deg, transparent 50%, #343a40 50%),linear-gradient(90deg, #7d7e80 50%, transparent 50%)");
        }
        $("." + textContainer, container).text(parseInt(Math.ceil(per*2.55)).toString(16));
    }

    this.prepare = function () {
        $(container).addClass("progressScroll");
        $(container).html("<div class='" + borderContainer + "'><div class='" + circleContainer + "'><span class='" + textContainer + "'></span></div></div>");

        $(".progressScroll").css({
            "width" : settings.width,
            "height" : settings.height,
            "position" : "fixed",
            "bottom" : "30px",
            "left" : "30px"
        });
        $("." + borderContainer, container).css({
            "position" : "relative",
            "text-align" : "center",
            "width" : "100%",
            "height" : "100%",
            "border-radius" : "50%",
            "background-color" : settings.darkBorderColor,
            "background-image" : "linear-gradient(91deg, transparent 50%," + settings.lightBorderColor + "50%), linear-gradient(90deg," +  settings.lightBorderColor + "50%, transparent 50%"
        });
        $("." + circleContainer, container).css({
            "position": "relative",
            "top" : "50%",
            "left" : "50%",
            "transform" : "translate(-50%, -50%)",
            "text-align" : "center",
            "width" : settings.width - settings.borderSize,
            "height" : settings.height - settings.borderSize,
            "border-radius" : "50%",
            "background-color" : settings.mainBgColor
        });
        $("." + textContainer, container).css({
            "top" : "50%",
            "left" : "50%",
            "transform" : "translate(-50%, -50%)",
            "position" : "absolute",
            "font-size" : settings.fontSize
        });
    }

    this.init = function () {

        self.prepare();

        $(window).bind("scroll", function () {
            var getOffset = window.pageYOffset || document.documentElement.scrollTop,
                per = Math.max(0, Math.min(1, getOffset / netHeight));
            self.updateProgress(per);
        });

        $(window).bind("resize", function () {
            self.getHeight();
            self.addEvent();
        });

        $(window).bind("load", function () {
            self.getHeight();
            self.addEvent();
        });
    }

    self.init();
}