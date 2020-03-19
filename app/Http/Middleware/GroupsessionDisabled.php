<?php

namespace App\Http\Middleware;

use Closure;
use DbConfig;
use Auth;

class GroupsessionDisabled
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
      return $next($request);
    }
}
