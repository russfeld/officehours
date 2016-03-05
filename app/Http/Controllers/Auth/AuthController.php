<?php

namespace App\Http\Controllers\Auth;

use App\Models\User;
use App\Models\Student;
use Auth;
use Cas;
use Validator;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;


class AuthController extends Controller
{

    protected $redirectPath = '/';

    /*
    |--------------------------------------------------------------------------
    | Registration & Login Controller
    |--------------------------------------------------------------------------
    |
    | This controller handles the registration of new users, as well as the
    | authentication of existing users. By default, this controller uses
    | a simple trait to add these behaviors. Why don't you explore it?
    |
    */

    /**
     * Create a new authentication controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('cas', ['only' => ['CASLogin']]);
    }

    public function CASLogin()
    {
        return redirect('/');
    }

    public function Logout()
    {
        Auth::logout();
        return redirect('/auth/caslogout');
    }

    public function CASLogout()
    {
        CAS::logout();
        return redirect('/');
    }

    public function ForceLogin(Request $request){
        if(env('AUTH_TYPE') == 'force'){
          if(!$request->has('eid')){
            return ('eid required');
          }
          $user = User::where('eid', $request->input('eid'))->first();
          if($user === null){
              $user = new User;
              $user->eid = $request->input('eid');
              $user->is_advisor = false;
              $user->save();

              $student = new Student;
              $student->user_id = $user->id;
              $student->first_name = $user->eid;
              $student->email = $user->eid . "@ksu.edu";
              $student->department_id = null;
              $student->advisor_id = null;
              $student->save();
          }
          Auth::login($user);
          return redirect('/');
        }else{
          abort(404);
        }
    }

}
