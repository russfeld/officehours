require(["util/site","util/dashboard"],function(e,s){e.ajaxcrsf();var a=s.dataTableOptions;a.dom='<"newbutton">frtip',s.init(a),e.checkMessage(),$("div.newbutton").html('<a type="button" class="btn btn-success" href="/admin/newstudent">New Student</a>'),$("#save").on("click",function(){$("#spin").removeClass("hide-spin");var s={first_name:$("#first_name").val(),last_name:$("#last_name").val(),email:$("#email").val()};$("#advisor").val()>0&&(s.advisor=$("#advisor").val()),$("#department").val()>0&&(s.department=$("#department").val());var a=$("#id").val();if(0==a.length){s.eid=$("#eid").val();var t="/admin/newstudent"}else{s.eid=$("#eid").val();var t="/admin/students/"+a}$.ajax({method:"POST",url:t,data:s}).success(function(s){0==a.length?(e.clearFormErrors(),$("#spin").addClass("hide-spin"),$(location).attr("href",s)):(e.displayMessage(s,"success"),e.clearFormErrors(),$("#spin").addClass("hide-spin"))}).fail(function(s,a){422==s.status?e.setFormErrors(s.responseJSON):alert("Unable to save: "+s.responseJSON),$("#spin").addClass("hide-spin")})}),$("#delete").on("click",function(){var s=confirm("Are you sure?");if(s===!0){$("#spin").removeClass("hide-spin");var a={id:$("#id").val()},t="/admin/deletestudent";$.ajax({method:"POST",url:t,data:a}).success(function(e){$(location).attr("href","/admin/students")}).fail(function(s,a){422==s.status?e.setFormErrors(s.responseJSON):alert("Unable to delete: "+s.responseJSON),$("#spin").addClass("hide-spin")})}}),$("#forcedelete").on("click",function(){var s=confirm("Are you sure? This will permanently remove all related records. You cannot undo this action.");if(s===!0){$("#spin").removeClass("hide-spin");var a={id:$("#id").val()},t="/admin/forcedeletestudent";$.ajax({method:"POST",url:t,data:a}).success(function(e){$(location).attr("href","/admin/students")}).fail(function(s,a){422==s.status?e.setFormErrors(s.responseJSON):alert("Unable to delete: "+s.responseJSON),$("#spin").addClass("hide-spin")})}}),$("#restore").on("click",function(){var s=confirm("Are you sure?");if(s===!0){$("#spin").removeClass("hide-spin");var a={id:$("#id").val()},t="/admin/restorestudent";$.ajax({method:"POST",url:t,data:a}).success(function(e){$(location).attr("href","/admin/students")}).fail(function(s,a){422==s.status?e.setFormErrors(s.responseJSON):alert("Unable to restore: "+s.responseJSON),$("#spin").addClass("hide-spin")})}})});