<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Student;
use App\Models\Advisor;

use League\Fractal\Manager;
use League\Fractal\Resource\Collection;
use App\JsonSerializer;

use Auth;
use Illuminate\Http\Request;

class ProfilesController extends Controller
{

	public function __construct()
	{
		$this->middleware('cas');
        $this->fractal = new Manager();
	}

    /**
     * Responds to requests to GET /courses
     */
    public function getIndex(Request $request)
    {
        $user = Auth::user();

        if($user->is_advisor){
            $user->load('advisor');
						if ($request->session()->has('lastUrl')) {
						  return view('profiles/advisorindex')->with('advisor', $user->advisor)->with('lastUrl', $request->session()->get('lastUrl'));
						}else{
							return view('profiles/advisorindex')->with('advisor', $user->advisor);
						}
        }else{
            $user->load('student.advisor', 'student.department');

						if ($request->session()->has('lastUrl')) {
						  return view('profiles/index')->with('student', $user->student)->with('lastUrl', $request->session()->get('lastUrl'));
						}else{
							return view('profiles/index')->with('student', $user->student);
						}


        }
    }

		public function getPic(Request $request, $id = -1){
			$user = Auth::user();
			if($user->is_advisor){
				if($id < 0){
					return response()->json($user->advisor->pic);
				}else{
					$advisor = Advisor::findOrFail($id);
					return response()->json(url($advisor->pic));
				}
			}else{
				return response()->json(trans('errors.unimplemented'));
			}
		}

    public function getStudentfeed(Request $request){
    	$user = Auth::user();
    	if($user->is_advisor){
	    	$this->validate($request, [
	            'query' => 'required|string',
	        ]);

          $students = Student::filterName($request->input('query'))->get();

	        $resource = new Collection($students, function($student) {
                return[
                    'value' => $student->name,
                    'data' => $student->id,
                ];
	        });

	    	return $this->fractal->createData($resource)->toJson();
    	}else{
    		return response()->json(trans('errors.advisors_only'), 403);
    	}
    }

    public function postUpdate(Request $request){
        $user = Auth::user();
        if($user->is_advisor){
						$this->validate($request, [
								'name' => 'required|string',
								'email' => 'required|string|email',
								'office' => 'required|string',
								'phone' => 'required|string',
								'notes' => 'string',
								'pic' => 'image',
						]);
						$advisor = $user->advisor;
						$advisor->name = $request->input('name');
						$advisor->email = $request->input('email');
						$advisor->office = $request->input('office');
						$advisor->phone = $request->input('phone');
						$advisor->notes = $request->input('notes');
						if($request->hasFile('pic')){
							$path = storage_path() . "/app/images";
							$extension = $request->file('pic')->getClientOriginalExtension();
							$filename = $user->eid . '.' . $extension;
							$request->file('pic')->move($path, $filename);
							$advisor->pic = 'images/' . $filename;
						}
						$user->update_profile = true;
						$user->save();
						$advisor->save();
						return response()->json(trans('messages.profile_updated'));
        }else{
            $this->validate($request, [
                'first_name' => 'required|string',
                'last_name' => 'required|string',
            ]);
            $student = $user->student;
            $student->first_name = $request->input('first_name');
            $student->last_name = $request->input('last_name');
						$user->update_profile = true;
						$user->save();
            $student->save();
						if ($request->session()->has('lastUrl')){
							$request->session()->forget('lastUrl');
						}
						return response()->json(trans('messages.profile_updated'));
        }

    }

		public function postNewstudent(Request $request){
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
				return response()->json(trans('messages.user_created'), 200);
			}else{
				return response()->json(trans('errors.user_exists'), 500);
			}
		}

}
