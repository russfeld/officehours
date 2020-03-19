var dashboard = require('../../util/dashboard');

exports.init = function(){
  var options = dashboard.dataTableOptions;
  options.dom = '<"newbutton">frtip';
  dashboard.init(options);

  $("div.newbutton").html('<a type="button" class="btn btn-success" href="/admin/newgroupsessionlist">New Groupsession List</a>');

  $('#save').on('click', function(){
    var data = {
      name: $('#name').val(),
    };
    var id = $('#id').val();
    if(id.length == 0){
      var url = '/admin/newgroupsessionlist';
    }else{
      var url = '/admin/groupsessionlists/' + id;
    }
    dashboard.ajaxsave(data, url, id);
  });

  $('#delete').on('click', function(){
    var url = "/admin/deletegroupsessionlist";
    var retUrl = "/admin/groupsessionlists";
    var data = {
      id: $('#id').val(),
    };
    dashboard.ajaxdelete(data, url, retUrl, true);
  });

};
