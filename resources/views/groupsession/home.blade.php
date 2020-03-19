@extends('layouts.master')

@section('title', 'Lab Help Queue')

@section('styles')
    @parent
<!--
    <link rel="stylesheet" type="text/css" href="{{ asset('css/summernote.css') }}">
-->
@endsection

@section('content')

@include('editable.textarea', ['field' => $editables['home']])

<h2>Choose your queue below</h2>

@foreach($groupsessionlists as $groupsessionlist)
<a class="btn btn-primary" href="{{url('/groupsession/' . $groupsessionlist->id)}}" role="button">{{ $groupsessionlist-> name }}</a>
@endforeach

@endsection
