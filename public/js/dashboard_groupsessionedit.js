require(["util/site","util/dashboard"],function(e,s){e.ajaxcrsf();var i=s.dataTableOptions;i.dom='<"newbutton">frtip',s.init(i),e.checkMessage(),$("#delete").on("click",function(){var s=confirm("Are you sure? You cannot undo this action.");if(s===!0){$("#spin").removeClass("hide-spin");var i={id:$("#id").val()},n="/admin/deletegroupsession";$.ajax({method:"POST",url:n,data:i}).success(function(e){$(location).attr("href","/admin/groupsessions")}).fail(function(s,i){422==s.status?e.setFormErrors(s.responseJSON):alert("Unable to delete: "+s.responseJSON),$("#spin").addClass("hide-spin")})}})});