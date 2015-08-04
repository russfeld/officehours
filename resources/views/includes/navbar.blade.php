<!-- Fixed navbar -->
    <nav class="navbar navbar-inverse navbar-fixed-top">
      <div class="container">
        <div class="navbar-header">
          <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
            <span class="sr-only">Toggle navigation</span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </button>
          <a class="navbar-brand" href="{{ url('/') }}">K-State Engineering Advising</a>
        </div>
        <div id="navbar" class="navbar-collapse collapse">
          <ul class="nav navbar-nav">
            <li class="{{ Request::is('courses*') ? 'active' : '' }}"><a href="{{ url('/courses') }}">Courses</a></li>
            <li class="{{ Request::is('flowcharts*') ? 'active' : '' }}"><a href="{{ url('/flowcharts') }}">Flowcharts</a></li>
            <li class="{{ Request::is('advising*') ? 'active' : '' }}"><a href="{{ url('/advising') }}">Advising</a></li>
          </ul>
        @if( Auth::check())
          <ul class="nav navbar-nav navbar-right">
              <li><a href="{{ url('/profile') }}">{{ Auth::user()->name }}</a></li>
              <li><p class="navbar-btn">
                <a href="{{ url('auth/logout') }}" class="btn btn-success">Logout</a>
              </p></li>
          </ul>
        @else
          <ul class="nav navbar-nav navbar-right">
              <li><p class="navbar-btn">
                <a href="{{ url('auth/login') }}" class="btn btn-success">Sign in</a>
              </p></li>
          </ul>
        @endif
        </div><!--/.nav-collapse -->
      </div>
    </nav>