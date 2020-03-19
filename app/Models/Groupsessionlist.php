<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Groupsessionlist extends Validatable
{

    protected $dates = ['created_at', 'updated_at'];

    protected $rules = array(
      'name' => 'required|string',
    );

    protected $fillable = ['name'];

    public function sessions(){
        return $this->hasMany('App\Models\Groupsession')->orderBy('id');
    }
}
