@extends('dashboard._layout')

@section('dashcontent')

<div class="row">
  <div class="col-xs-12">
    <form>
      @include('forms.text', ['field' => 'id', 'label' => 'ID', 'value' => $groupsessionlist->id, 'disabled' => 'disabled'])
      @include('forms.text', ['field' => 'name', 'label' => 'Name', 'value' => $groupsessionlist->name])
      <input type="hidden" id="id" value="{{$groupsessionlist->id}}">
      <span id="spin" class="fa fa-cog fa-spin fa-lg hide-spin">&nbsp;</span>
      <button type="button" class="btn btn-primary" id="save">Save</button>
      @if (isset($groupsessionlist->id))
        <button type="button" class="btn btn-danger" id="delete">Delete</button>
      @endif
      <a type="button" class="btn btn-warning" href="{{ url('/admin/groupsessionlists/')}}">Back</a>
    </form>
  </div>
</div>

@endsection
