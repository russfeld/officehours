var dashboard = require('../../util/dashboard');
var site = require('../../util/site');

exports.init = function(){
  var options = dashboard.dataTableOptions;
  options.dom = '<"newbutton">frtip';
  var id = $('#plan_id').val();
  options.ajax = {
      url: '/admin/planrequirements/' + id,
      dataSrc: '',
  };
  options.columns = [
    {'data': 'id'},
    {'data': 'name'},
    {'data': 'credits'},
    {'data': 'semester'},
    {'data': 'ordering'},
    {'data': 'notes'},
    {'data': 'id'},
  ];
  options.columnDefs = [{
            "targets": -1,
            "data": 'id',
            "render": function(data, type, row, meta) {
              return "<a class=\"btn btn-primary btn-sm edit\" href=\"#\" data-id=\"" + data + "\" role=\"button\">Edit</a>";
            }
  }]
  dashboard.init(options);

  $("div.newbutton").html('<a type="button" class="btn btn-success" href="#" id="new">New Plan Requirement</a>');

  $('#save').on('click', function(){
    var data = {
      notes: $('#notes').val(),
      plan_id: $('#plan_id').val(),
      semester: $('#semester').val(),
      ordering: $('#ordering').val(),
      credits: $('#credits').val(),
    };
    var selected = $("input[name='requireable']:checked");
    if (selected.length > 0) {
        var selectedVal = selected.val();
        if(selectedVal == 1){
          data.course_name = $('#course_name').val();
        }else if(selectedVal == 2){
          if($('#electivelist_id').val() > 0){
            data.course_name = $('#course_name').val();
            data.electivelist_id = $('#electivelist_id').val();
          }
        }
    }
    var id = $('#id').val();
    if(id.length == 0){
      var url = '/admin/newplanrequirement';
    }else{
      var url = '/admin/planrequirement/' + id;
    }
    dashboard.ajaxmodalsave(data, url, '#planrequirementform');
  });

  $('#delete').on('click', function(){
    var url = "/admin/deleteplanrequirement";
    var data = {
      id: $('#id').val(),
    };
    dashboard.ajaxmodaldelete(data, url, '#planrequirementform');
  });

  $('#planrequirementform').on('shown.bs.modal', showselected);

  $('#planrequirementform').on('hidden.bs.modal', resetForm);

  resetForm();

  $('#new').on('click', function(){
    $('#id').val("");
    $('#plan_idview').val($('#plan_idview').attr('value'));
    $('#delete').hide();
    $('#planrequirementform').modal('show');
  });

  $('#table').on('click', '.edit', function(){
    var id = $(this).data('id');
    var url = '/admin/planrequirement/' + id;
    window.axios.get(url)
      .then(function(message){
        $('#id').val(message.data.id);
        $('#semester').val(message.data.semester);
        $('#ordering').val(message.data.ordering);
        $('#credits').val(message.data.credits);
        $('#notes').val(message.data.notes);
        $('#plan_idview').val($('#plan_idview').attr('value'));
        if(message.data.type == "course"){
          $('#course_name').val(message.data.course_name);
          $('#requireable1').prop('checked', true);
          $('#requiredcourse').show();
          $('#electivecourse').hide();
        }else if (message.data.type == "electivelist"){
          $('#course_name').val(message.data.course_name);
          $('#electivelist_id').val(message.data.electivelist_id);
          $('#electivelist_idtext').html("Selected: (" + message.data.electivelist_id + ") " + message.data.electivelist_name);
          $('#requireable2').prop('checked', true);
          $('#requiredcourse').hide();
          $('#electivecourse').show();
        }
        $('#delete').show();
        $('#planrequirementform').modal('show');
      })
      .catch(function(error){
        site.handleError('retrieve requirement', '', error);
      });

  });

  $('input[name=requireable]').on('change', showselected);

  dashboard.ajaxautocomplete('electivelist_id', '/electivelists/electivelistfeed');
};

/**
 * Determine which div to show in the form
 */
var showselected = function(){
  //https://stackoverflow.com/questions/8622336/jquery-get-value-of-selected-radio-button
  var selected = $("input[name='requireable']:checked");
  if (selected.length > 0) {
      var selectedVal = selected.val();
      if(selectedVal == 1){
        $('#requiredcourse').show();
        $('#electivecourse').hide();
      }else if(selectedVal == 2){
        $('#requiredcourse').hide();
        $('#electivecourse').show();
      }
  }
}

var resetForm = function(){
  site.clearFormErrors();
  $('#id').val("");
  $('#semester').val("");
  $('#ordering').val("");
  $('#credits').val("");
  $('#notes').val("");
  $('#plan_idview').val($('#plan_idview').attr('value'));
  $('#course_name').val("");
  $('#electivelist_id').val("-1");
  $('#electivelist_idauto').val("");
  $('#electivelist_idtext').html("Selected (0) ");
  $('#requireable1').prop('checked', true);
  $('#requireable2').prop('checked', false);
  $('#requiredcourse').show();
  $('#electivecourse').hide();
}