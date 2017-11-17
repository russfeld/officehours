<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Planelectivecourse extends Model
{
    protected $dates = ['created_at', 'updated_at'];

    public function electivelist(){
        return $this->belongsTo('App\Models\Electivelist');
    }

    public function requirement(){
        return $this->morphMany('App\Models\Planrequirement', 'requireable');
    }
}
