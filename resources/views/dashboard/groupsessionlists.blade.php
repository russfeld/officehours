@extends('dashboard._layout')

@section('dashcontent')

<div class="row">
  <div class="col-xs-12">
    <div class="box">
      <div class="box-body">
        <table id="table" class="table table-bordered table-striped">
          <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Actions</th>
          </tr>
          </thead>
          <tbody>
          @foreach($groupsessionlists as $groupsessionlist)
          <tr>
            <td>{{ $groupsessionlist->id }}</td>
            <td>{{ $groupsessionlist->name }}</td>
            <td><a class="btn btn-primary btn-sm" href="{{url('/admin/groupsessionlists/' . $groupsessionlist->id)}}" role="button">Edit</a></td>
          </tr>
          @endforeach
          </tbody>
          <tfoot>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Actions</th>
          </tr>
          </tfoot>
        </table>
      </div>
      <!-- /.box-body -->
    </div>
  <!-- /.box -->
  </div>
<!-- /.col -->
</div>
<!-- /.row -->

@endsection
