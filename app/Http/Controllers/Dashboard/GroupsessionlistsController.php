<?php

namespace App\Http\Controllers\Dashboard;

use Illuminate\Http\Request;

use App\Http\Controllers\Controller;

use App\Models\Groupsessionlist;
use App\Models\Editable;
use DbConfig;

class GroupsessionlistsController extends Controller
{
  public function __construct()
  {
    $this->middleware('cas');
    $this->middleware('update_profile');
    $this->middleware('advisors_only');
  }

  public function getGroupsessionlists(Request $request, $id = -1){
    if($id < 0){
        $groupsessionlists = Groupsessionlist::all();
        return view('dashboard.groupsessionlists')->with('groupsessionlists', $groupsessionlists)->with('page_title', "Groupsessionlists");
    }else{
      $groupsessionlist = Groupsessionlist::findOrFail($id);
      return view('dashboard.groupsessionlistedit')->with('groupsessionlist', $groupsessionlist)->with('page_title', "Edit Groupsessionlist");
    }
  }

  public function getNewgroupsessionlist(){
    $groupsessionlist = new Groupsessionlist();
    return view('dashboard.groupsessionlistedit')->with('groupsessionlist', $groupsessionlist)->with('page_title', "New Groupsessionlist");
  }

  public function postGroupsessionlists($id = -1, Request $request){
    if($id < 0){
      abort(404);
    }else{
      $data = $request->all();
      $groupsessionlist = Groupsessionlist::findOrFail($id);
      if($groupsessionlist->validate($data)){
        $groupsessionlist->fill($data);
        $groupsessionlist->save();
        $editables = Editable::where('controller', 'GroupsessionController')->where('action', 'getIndex')->where('key', 'head' . $groupsessionlist->id)->where('version', 0)->get();
        if($editables->count() == 0){
          $editable = new Editable;
          $editable->controller = "GroupsessionController";
          $editable->action = "getIndex";
          $editable->key = "head" . $groupsessionlist->id;
          $editable->version = 0;
          $editable->user_id = 1;
          $editable->contents= "<div class='col-xs-12 col-sm-12 col-md-12 col-lg-12 bg-light-purple rounded'>
  <h3 class='top-header text-center'>Edit Me</h3>
  </div>

  <div class='col-xs-12 col-sm-12 col-md-12 col-lg-12'>
  <p>Edit Me</p>
  </div>";
          $editable->save();
        }
        $editables = Editable::where('controller', 'GroupsessionController')->where('action', 'getList')->where('key', 'head' . $groupsessionlist->id)->where('version', 0)->get();
        if($editables->count() == 0){
          $editable = new Editable;
          $editable->controller = "GroupsessionController";
          $editable->action = "getList";
          $editable->key = "head" . $groupsessionlist->id;
          $editable->version = 0;
          $editable->user_id = 1;
          $editable->contents= "<div class='col-xs-12 col-sm-12 col-md-12 col-lg-12 bg-light-purple rounded'>
  <h3 class='top-header text-center'>Edit Me</h3>
  </div>

  <div class='col-xs-12 col-sm-12 col-md-12 col-lg-12'>
  <p>Edit Me</p>
  </div>";
          $editable->save();
        }
        return response()->json(trans('messages.item_saved'));
      }else{
        return response()->json($groupsessionlist->errors(), 422);
      }
    }
  }

  public function postNewgroupsessionlist(Request $request){
    $data = $request->all();
    $groupsessionlist = new Groupsessionlist();
    if($groupsessionlist->validate($data)){
      $groupsessionlist->fill($data);
      $groupsessionlist->save();
      $editables = Editable::where('controller', 'GroupsessionController')->where('action', 'getIndex')->where('key', 'head' . $groupsessionlist->id)->where('version', 0)->get();
      if($editables->count() == 0){
        $editable = new Editable;
        $editable->controller = "GroupsessionController";
        $editable->action = "getIndex";
        $editable->key = "head" . $groupsessionlist->id;
        $editable->version = 0;
        $editable->user_id = 1;
        $editable->contents= "<div class='col-xs-12 col-sm-12 col-md-12 col-lg-12 bg-light-purple rounded'>
<h3 class='top-header text-center'>Edit Me</h3>
</div>

<div class='col-xs-12 col-sm-12 col-md-12 col-lg-12'>
<p>Edit Me</p>
</div>";
        $editable->save();
      }
      $editables = Editable::where('controller', 'GroupsessionController')->where('action', 'getList')->where('key', 'head' . $groupsessionlist->id)->where('version', 0)->get();
      if($editables->count() == 0){
        $editable = new Editable;
        $editable->controller = "GroupsessionController";
        $editable->action = "getList";
        $editable->key = "head" . $groupsessionlist->id;
        $editable->version = 0;
        $editable->user_id = 1;
        $editable->contents= "<div class='col-xs-12 col-sm-12 col-md-12 col-lg-12 bg-light-purple rounded'>
<h3 class='top-header text-center'>Edit Me</h3>
</div>

<div class='col-xs-12 col-sm-12 col-md-12 col-lg-12'>
<p>Edit Me</p>
</div>";
        $editable->save();
      }
      $setting = "groupsessionenabled" . $groupsessionlist->id;
      if(!DbConfig::has($setting)){
        DbConfig::store($setting, false);
      }
      $request->session()->put('message', trans('messages.item_saved'));
      $request->session()->put('type', 'success');
      return response()->json(url('admin/groupsessionlists/' . $groupsessionlist->id));
    }else{
      return response()->json($groupsessionlist->errors(), 422);
    }
  }

  public function postDeletegroupsessionlist(Request $request){
    $this->validate($request, [
      'id' => 'required|exists:groupsessionlists',
    ]);
    $groupsessionlist = Groupsessionlist::findOrFail($request->input('id'));
    $groupsessionlist->delete();
    $request->session()->put('message', trans('messages.item_deleted'));
    $request->session()->put('type', 'success');
    return response()->json(trans('messages.item_deleted'));
  }

}
