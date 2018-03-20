@extends('layouts.masterwide')

@section('title', 'Flowcharts - Manage Flowchart')

@section('content')

@include('flowcharts._flowchart', ['plan' => $plan, 'link' => false])


<div id="flowchart">

<draggable v-model="semesters" class="flowchart" :options="{group: 'semesters', animation: 150, filter: '.no-drag', preventOnFilter: false}" @end="dropSemester">

  <template v-for="(semester, index) in semesters">
    <div class="semester" v-bind:data-id="semester.id" :key="semester.id">
      <div class="panel panel-default">
        <div v-bind:id="'sem-panelhead-' + semester.id" class="panel-heading clearfix move">
          <h4 class="panel-title pull-left">@{{ semester.name }}</h4>
          <div class="btn-group pull-right">
            <template v-if="semester.courses.length == 0">
              <button type="button" class="delete-sem btn btn-default btn-xs" aria-label="Delete" v-bind:data-id="semester.id" title="Delete Semester" v-on:click="deleteSemester"><i class="fa fa-times"></i></button>
            </template>
            <button type="button" class="edit-sem btn btn-default btn-xs" aria-label="Edit" v-bind:data-id="semester.id" title="Edit Semester" v-on:click="editSemester"><i class="fa fa-pencil"></i></button>
          </div>
        </div>

        <div v-bind:id="'sem-paneledit-' + semester.id" class="panel-heading clearfix" hidden>
          <div class="input-group no-drag">
            <input v-bind:id="'sem-text-' + semester.id" v-on:keyup.enter="saveSemester" type="text" class="form-control input-sm" v-bind:data-id="semester.id" v-model="semester.name">
            <div class="input-group-btn">
              <button type="button" class="save-sem btn btn-success btn-sm" v-bind:data-id="semester.id" aria-label="Save" title="Save Semester" v-on:click="saveSemester"><i class="fa fa-check"></i></button>
            </div>
          </div>
        </div>

          <draggable v-model="semester.courses" class="list-group" v-bind:data-id="index" :options="{group: 'courses', animation: 150}" @end="dropCourse">

              <template v-for="course in semester.courses">
                <div class="course list-group-item move" v-bind:data-id="course.id" :key="course.id">
                  <div class="course-content pull-left">
                    <template v-if="course.name.length != 0">
                      <p>@{{ course.name }} (@{{ course.credits }})</p>
                      <template v-if="course.electivelist_name.length != 0">
                        <p>from @{{ course.electivelist_name }}</p>
                      </template>
                    </template>
                    <template v-else>
                      <p>@{{ course.electivelist_name }} (@{{ course.credits }})</p>
                    </template>
                    <p>@{{ course.notes }}</p>
                  </div>

                  <div class="btn-group pull-right">
                    <template v-if="course.degreerequirement_id.length == 0">
                      <button type="button" class="delete-course btn btn-default btn-xs" aria-label="Delete" title="Delete Course"><i class="fa fa-times"></i></button>
                    </template>
                    <button type="button" class="edit-course btn btn-default btn-xs" aria-label="Edit" title="Edit Course"><i class="fa fa-pencil"></i></button>
                  </div>
                </div>
              </template>

          </draggable>

      </div> <!-- panel -->
    </div> <!-- semester -->
  </template>

</draggable>

</div>

<button class="btn btn-primary" id="reset"><i class="fa fa-undo"></i> Reset</button>



<input type="hidden" id="id" value="{{$plan->id}}">

@endsection
