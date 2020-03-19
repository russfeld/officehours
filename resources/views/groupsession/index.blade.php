@extends('layouts.master')

@section('title', 'Lab Help Queue')

@section('styles')
    @parent
<!--
    <link rel="stylesheet" type="text/css" href="{{ asset('css/summernote.css') }}">
-->
@endsection

@section('content')

@include('editable.textarea', ['field' => $editables['head' . $gsid]])

@if($user->is_advisor)
<a class="btn btn-danger" href="/groupsession/enable/{{ $gsid }}">Queue is Disabled - Enable? <i class="fa fa-arrow-circle-right" aria-hidden="true"></i></a>
@else
@if($enabled)
<a class="btn btn-success" href="/groupsession/list/{{ $gsid }}">Join the Queue <i class="fa fa-arrow-circle-right" aria-hidden="true"></i></a>
@else
<a class="btn btn-danger" href="#" disabled="disabled">Queue is Unavailable at this Time! <i class="fa fa-ban" aria-hidden="true"></i></a>
@endif
@endif

@endsection
