require(["util/site"],function(e){e.ajaxcrsf(),$("#saveProfile").on("click",function(){$("#profileSpin").removeClass("hide-spin");var s={first_name:$("#first_name").val(),last_name:$("#last_name").val()};$.ajax({method:"POST",url:"/profile/update",data:s}).success(function(s){e.displayMessage(s,"success"),e.clearFormErrors(),$("#profileSpin").addClass("hide-spin"),$("#profileAdvisingBtn").removeClass("hide-spin")}).fail(function(s,i){422==s.status?e.setFormErrors(s.responseJSON):alert("Unable to save profile: "+s.responseJSON),$("#profileSpin").addClass("hide-spin")})}),$("#saveAdvisorProfile").on("click",function(){$("#profileSpin").removeClass("hide-spin");var s=new FormData($("form")[0]);s.append("name",$("#name").val()),s.append("email",$("#email").val()),s.append("office",$("#office").val()),s.append("phone",$("#phone").val()),s.append("notes",$("#notes").val()),$("#pic").val()&&s.append("pic",$("#pic")[0].files[0]),$.ajax({method:"POST",url:"/profile/update",data:s,dataType:"json",processData:!1,contentType:!1}).success(function(s){e.displayMessage(s,"success"),e.clearFormErrors(),$("#profileSpin").addClass("hide-spin"),$("#profileAdvisingBtn").removeClass("hide-spin"),$.ajax({method:"GET",url:"/profile/pic"}).success(function(e){$("#pictext").val(e),$("#picimg").attr("src",e)})}).fail(function(s,i){422==s.status?e.setFormErrors(s.responseJSON):alert("Unable to save profile: "+s.responseJSON),$("#profileSpin").addClass("hide-spin")})}),$(document).on("change",".btn-file :file",function(){var e=$(this),s=e.get(0).files?e.get(0).files.length:1,i=e.val().replace(/\\/g,"/").replace(/.*\//,"");e.trigger("fileselect",[s,i])}),$(".btn-file :file").on("fileselect",function(e,s,i){var a=$(this).parents(".input-group").find(":text"),n=s>1?s+" files selected":i;a.length?a.val(n):n&&alert(n)})});