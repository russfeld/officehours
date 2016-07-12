<?php

namespace App\Models;

use Illuminate\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Foundation\Auth\Access\Authorizable;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Contracts\Auth\Access\Authorizable as AuthorizableContract;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Model implements AuthenticatableContract, AuthorizableContract, CanResetPasswordContract
{
    use Authenticatable, Authorizable, CanResetPassword, SoftDeletes;

    /**
     * The database table used by the model.
     *
     * @var string
     */
    protected $table = 'users';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [ 'eid'];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */

     protected $dates = ['deleted_at'];

    // http://stackoverflow.com/questions/23910553/laravel-check-if-related-model-exists
    public function student(){
        return $this->hasOne('App\Models\Student')->withTrashed();
    }

    public function advisor(){
        return $this->hasOne('App\Models\Advisor')->withTrashed();
    }

}
