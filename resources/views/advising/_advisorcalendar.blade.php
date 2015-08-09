@section('scripts')
    @parent
    <script type="text/javascript" src="{{ asset('js/calendar.js') }}"></script>
    <script type="text/javascript" src="{{ asset('js/advisorcalendar.js') }}"></script>
@endsection

@section('styles')
    @parent
    <link rel="stylesheet" type="text/css" href="{{ asset('css/calendar.css') }}">
@endsection

@include('advising._blackoutform')

@include('advising._eventform')

<div id="calendar">
</div>

<input type="hidden" id="calendarAdvisorID" value="{{ $advisor->id }}" />

