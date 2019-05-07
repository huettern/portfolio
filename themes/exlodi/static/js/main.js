/*
* @Author: Noah Huetter
* @Date:   2019-05-07 15:13:41
* @Last Modified by:   Noah Huetter
* @Last Modified time: 2019-05-07 16:03:02
*/

jQuery(document).ready(function() {

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


});