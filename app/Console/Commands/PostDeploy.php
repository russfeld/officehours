<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Editable;
use DbConfig;

class PostDeploy extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'deploy:post';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Post Deploy Actions';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        $this->info('PostDeploy routine beginning...');
        $settings_off = array("groupsessionenabled", "showmessage", "navbar_showflowcharts", "navbar_showcourses");
        $settings_on = array("navbar_showgroupsession", "navbar_showadvising");
        $bar = $this->output->createProgressBar(count($settings_off) + count($settings_on));
        foreach($settings_off as $setting){
          if(!DbConfig::has($setting)){
            DbConfig::store($setting, false);
          }
          $bar->advance();
        }
        foreach($settings_on as $setting){
          if(!DbConfig::has($setting)){
            DbConfig::store($setting, true);
          }
          $bar->advance();
        }
        $bar->finish();
        $this->line('');

        //ADD EDITABLES TO App/Providers/ComposerServiceProvider AS WELL!
        $bar = $this->output->createProgressBar(7);

        $editables = Editable::where('controller', 'GroupsessionController')->where('action', 'getIndex')->where('key', 'head')->where('version', 0)->get();
        if($editables->count() == 0){
          $editable = new Editable;
          $editable->controller = "GroupsessionController";
          $editable->action = "getIndex";
          $editable->key = "head";
          $editable->version = 0;
          $editable->user_id = 1;
          $editable->contents= "<div class='col-xs-12 col-sm-12 col-md-12 col-lg-12 bg-light-purple rounded'>
	<h3 class='top-header text-center'>Lab Help Sessions</h3>
</div>

<div class='col-xs-12 col-sm-12 col-md-12 col-lg-12'>
  <p>The CS department holding group advising sessions as part of Fall 2018 enrollment. Please plan to attend the appropriate session from the list below. All group advising sessions will be held in Fiedler Auditorium (DUF 1107).</p>

  <ul>
    <li><b>Juniors/seniors (60+ hours already finished):</b> Wednesday, March 9, 6:00-9:00 pm</li>
    <li><b>Freshmen/sophomores with last name A-M:</b> Wednesday, March 23, 6:00-9:00 pm</li>
    <li><b>Freshmen/sophomores with last name N-Z:</b> Wednesday, March 30, 6:00-9:00 pm</li>
  </ul>

  <p>At the group session, you will meet with an advisor on a first-come, first-serve basis. The advisor will approve your schedule for the next semester and lift your advising flag.</p><p>

  </p><p>After your group advising session, you will still need to enroll in KSIS. You can look up your enrollment time in your KSIS Student Center under “Enrollment Dates”.  This is the first day and time when you are eligible to enroll. Please note that enrollment dates are staggered by number of hours: seniors may enroll as early as March 21, but freshmen may not enroll until April 15.</p>

  <p>If you have additional questions or are unable to make ANY of the listed group advising times, then you may schedule an individual appointment with your advisor. However, these individual times will be limited.<br></p>

  <div class='panel panel-primary'>
    <div class='panel-heading'>
      Make sure you have the following available, either on paper or electronically, <b>before</b> you check in:
    </div>
    <div class='panel-body'>
      <ul>
        <li>A copy of your DARS report (<a href='http://www.k-state.edu/ksis/help/students/stuViewDARS.html'>Instructions</a>)</li>
        <li>A proposed schedule for the next semester.
          <ul>
            <li>When planning your schedule, you should consult both your DARS report and your current CS flowchart (<a href='https://flowcharts.engg.ksu.edu/'>Engineering Flowchart Site</a>)</li>
            <li>Pay attention to which CS courses are marked as Fall-only or Spring-only in the flowchart.</li>
           </ul></li>
          </ul>
         <p><b>Students who do not have a DARS report and proposed schedule will not be seen by an advisor until these steps are completed</b></p>
     </div>
   </div>
</div>";
          $editable->save();
        }

        $bar->advance();

        $editables = Editable::where('controller', 'AdvisingController')->where('action', 'getIndex')->where('key', 'message')->where('version', 0)->get();
        if($editables->count() == 0){
          $editable = new Editable;
          $editable->controller = "AdvisingController";
          $editable->action = "getIndex";
          $editable->key = "message";
          $editable->version = 0;
          $editable->user_id = 1;
          $editable->contents= "<div class='alert alert-danger' role='alert'>The CS Department is holding <b>Group Advising</b> sessions this year. Click <a href='/groupsession' class='alert-link'><b>here</b></a> to learn more! Please attend a group session if possible unless you require an in-depth advising appointment. This will help us keep individual times available for students who need them most.</div>";
          $editable->save();
        }

        $bar->advance();

        $editables = Editable::where('controller', 'RootRouteController')->where('action', 'getIndex')->where('key', 'header')->where('version', 0)->get();
        if($editables->count() == 0){
          $editable = new Editable;
          $editable->controller = "RootRouteController";
          $editable->action = "getIndex";
          $editable->key = "header";
          $editable->version = 0;
          $editable->user_id = 1;
          $editable->contents= "<div class='jumbotron'>
  <div class='container'>
    <h1>CS Office Hours<br></h1>
    <p>Welcome to the new K-State CS Office Hours system. We're using this to help ease the burden of scheduling online office hours and help sessions.<br></p>
    <p><a class='btn btn-primary btn-lg' href='/about' role='button'>Learn more »</a></p>
  </div>
</div>";
          $editable->save();
        }

        $bar->advance();

        $editables = Editable::where('controller', 'RootRouteController')->where('action', 'getIndex')->where('key', 'advising')->where('version', 0)->get();
        if($editables->count() == 0){
          $editable = new Editable;
          $editable->controller = "RootRouteController";
          $editable->action = "getIndex";
          $editable->key = "advising";
          $editable->version = 0;
          $editable->user_id = 1;
          $editable->contents= "<h2>Office Hours</h2>
  <p>When you are ready to schedule an appointment, click below.</p>
  <p><a class='btn btn-default' href='/advising' role='button'>Schedule an Appointment »</a></p>";
          $editable->save();
        }

        $bar->advance();

        $editables = Editable::where('controller', 'RootRouteController')->where('action', 'getIndex')->where('key', 'groupsession')->where('version', 0)->get();
        if($editables->count() == 0){
          $editable = new Editable;
          $editable->controller = "RootRouteController";
          $editable->action = "getIndex";
          $editable->key = "groupsession";
          $editable->version = 0;
          $editable->user_id = 1;
          $editable->contents= "<h2>Lab Help</h2>
  <p>Attending a lab help session? Click here to get on the waiting list or find your place in the queue.</p>
  <p><a class='btn btn-default' href='/groupsession' role='button'>Lab Help Sessions &raquo;</a></p>";
          $editable->save();
        }

        $bar->advance();

        $editables = Editable::where('controller', 'RootRouteController')->where('action', 'getIndex')->where('key', 'help')->where('version', 0)->get();
        if($editables->count() == 0){
          $editable = new Editable;
          $editable->controller = "RootRouteController";
          $editable->action = "getIndex";
          $editable->key = "help";
          $editable->version = 0;
          $editable->user_id = 1;
          $editable->contents= "<h2>Help</h2>
  <p>Not sure how to use the new system? Click here for help!</p>
  <p><a class='btn btn-default' href='/help' role='button'>Help &raquo;</a></p>";
          $editable->save();
        }

        $editables = Editable::where('controller', 'RootRouteController')->where('action', 'getAbout')->where('key', 'about')->where('version', 0)->get();
        if($editables->count() == 0){
          $editable = new Editable;
          $editable->controller = "RootRouteController";
          $editable->action = "getAbout";
          $editable->key = "about";
          $editable->version = 0;
          $editable->user_id = 1;
          $editable->contents= "<h2>About the new CS Office Hours System<br></h2>
  <p>This site is a work in progress. Our goal is to create the best experience for students and advisors alike. Contact russfeld@ksu.edu if you have any questions or comments</p></p>";
          $editable->save();
        }

        $bar->advance();

        $bar->finish();
        $this->line('');

        $this->info('PostDeploy routine complete!');
    }
}
