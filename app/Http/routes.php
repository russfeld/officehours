<?php

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It's a breeze. Simply tell Laravel the URIs it should respond to
| and give it the controller to call when that URI is requested.
|
*/

/*
 * Static routes for static pages
 * Tested in tests/RouteTest.php
 */
Route::get('/', 'RootRouteController@getIndex');
Route::get('/about', 'RootRouteController@getAbout');
Route::get('/help', 'RootRouteController@getHelp');
Route::get('/test', 'RootRouteController@getTest');


/*
 * Static route for images in storage
 * http://stackoverflow.com/questions/30191330/laravel-5-how-to-access-image-uploaded-in-storage-within-view
 */

Route::get('images/{filename}', 'RootRouteController@getImage');

/*
 * Routes for the CoursesController
 */
//Route::controller('courses', 'CoursesController');
Route::get('courses/', 'CoursesController@getIndex');
Route::get('courses/category/{category}', 'CoursesController@getCategory');
Route::get('courses/course/{slug}', 'CoursesController@getCourse');
Route::get('courses/coursefeed', 'CoursesController@getCoursefeed');

/*
 * Routes for the FlowchartsController
 */
//Route::controller('flowcharts', 'FlowchartsController');
Route::get('flowcharts/', 'FlowchartsController@getIndex');

/*
 * Routes for the AdvisingController
 */
//Route::controller('advising', 'AdvisingController');
Route::get('advising', 'AdvisingController@getIndex');
Route::get('advising/index/{id?}', 'AdvisingController@getIndex');
Route::get('advising/select/{dept?}', 'AdvisingController@getSelect');
Route::get('advising/meetingfeed', 'AdvisingController@getMeetingfeed');
Route::get('advising/blackoutfeed', 'AdvisingController@getBlackoutfeed');
Route::get('advising/blackout', 'AdvisingController@getBlackout');
Route::get('advising/meeting', 'AdvisingController@getMeeting');
Route::get('advising/conflicts', 'AdvisingController@getConflicts');
Route::post('advising/createmeeting', 'AdvisingController@postCreatemeeting');
Route::post('advising/deletemeeting', 'AdvisingController@postDeletemeeting');
Route::post('advising/createblackout', 'AdvisingController@postCreateblackout');
Route::post('advising/createblackoutevent', 'AdvisingController@postCreateblackoutevent');
Route::post('advising/deleteblackout', 'AdvisingController@postDeleteblackout');
Route::post('advising/deleteblackoutevent', 'AdvisingController@postDeleteblackoutevent');
Route::post('advising/resolveconflict', 'AdvisingController@postResolveconflict');

/*
 * Routes for the ProfilesController
 */
//Route::controller('profile', 'ProfilesController');
Route::get('profile/', 'ProfilesController@getIndex');
Route::get('profile/pic/{id?}', 'ProfilesController@getPic');
Route::get('profile/studentfeed', 'ProfilesController@getStudentfeed');
Route::post('profile/update', 'ProfilesController@postUpdate');
Route::post('profile/newstudent', 'ProfilesController@postNewstudent');

/*
 * Routes for the GroupsessionController
 */
//Route::controller('groupsession', 'GroupsessionController');
Route::get('groupsession/', 'GroupsessionController@getIndex');
Route::get('groupsession/list', 'GroupsessionController@getList');
Route::get('groupsession/queue', 'GroupsessionController@getQueue');
Route::post('groupsession/register', 'GroupsessionController@postRegister');
Route::post('groupsession/take', 'GroupsessionController@postTake');
Route::post('groupsession/put', 'GroupsessionController@postPut');
Route::post('groupsession/done', 'GroupsessionController@postDone');
Route::post('groupsession/delete', 'GroupsessionController@postDelete');
Route::get('groupsession/enable', 'GroupsessionController@getEnable');
Route::post('groupsession/disable', 'GroupsessionController@postDisable');

/*
 * Routes for the DashboardController
 */
//Route::controller('admin', 'DashboardController');
Route::get('admin/', 'DashboardController@getIndex');
Route::get('admin/students/{id?}', 'DashboardController@getStudents');
Route::get('admin/newstudent', 'DashboardController@getNewstudent');
Route::post('admin/students/{id?}', 'DashboardController@postStudents');
Route::post('admin/newstudent', 'DashboardController@postNewstudent');
Route::post('admin/deletestudent', 'DashboardController@postDeletestudent');
Route::post('admin/forcedeletestudent', 'DashboardController@postForcedeletestudent');
Route::post('admin/restorestudent', 'DashboardController@postRestorestudent');
Route::get('admin/advisors/{id?}', 'DashboardController@getAdvisors');
Route::get('admin/newadvisor', 'DashboardController@getNewadvisor');
Route::post('admin/advisors/{id?}', 'DashboardController@postAdvisors');
Route::post('admin/newadvisor', 'DashboardController@postNewadvisor');
Route::post('admin/deleteadvisor', 'DashboardController@postDeleteadvisor');
Route::post('admin/forcedeleteadvisor', 'DashboardController@postForcedeleteadvisor');
Route::post('admin/restoreadvisor', 'DashboardController@postRestoreadvisor');
Route::get('admin/departments/{id?}', 'DashboardController@getDepartments');
Route::get('admin/newdepartment', 'DashboardController@getNewdepartment');
Route::post('admin/departments/{id?}', 'DashboardController@postDepartments');
Route::post('admin/newdepartment', 'DashboardController@postNewdepartment');
Route::post('admin/deletedepartment', 'DashboardController@postDeletedepartment');
Route::post('admin/restoredepartment', 'DashboardController@postRestoredepartment');
Route::post('admin/forcedeletedepartment', 'DashboardController@postForcedeletedepartment');
Route::get('admin/meetings/{id?}', 'DashboardController@getMeetings');
Route::post('admin/deletemeeting', 'DashboardController@postDeletemeeting');
Route::post('admin/forcedeletemeeting', 'DashboardController@postForcedeletemeeting');
Route::get('admin/blackouts/{id?}', 'DashboardController@getBlackouts');
Route::post('admin/deleteblackout', 'DashboardController@postDeleteblackout');
Route::get('admin/groupsessions/{id?}', 'DashboardController@getGroupsessions');
Route::post('admin/deletegroupsession', 'DashboardController@postDeletegroupsession');
Route::get('admin/settings', 'DashboardController@getSettings');
Route::post('admin/newsetting', 'DashboardController@postNewsetting');
Route::post('admin/savesetting', 'DashboardController@postSavesetting');
Route::get('admin/degreeprograms', 'DashboardController@getDegreeprograms');
Route::get('admin/degreeprograms/{id?}', 'DashboardController@getDegreeprogramDetail');
Route::post('admin/newdegreerequirement/', 'DashboardController@postNewdegreerequirement');
Route::get('admin/degreeprogramrequirements/{id?}', 'DashboardController@getDegreeprogramRequirements');
Route::get('admin/degreerequirement/{id?}', 'DashboardController@getDegreerequirement');
Route::post('admin/degreerequirement/{id?}', 'DashboardController@postDegreerequirement');
Route::get('admin/degreeprograms/{id?}/edit', 'DashboardController@getDegreeprograms');
Route::get('admin/newdegreeprogram', 'DashboardController@getNewdegreeprogram');
Route::post('admin/degreeprograms/{id?}', 'DashboardController@postDegreeprograms');
Route::post('admin/newdegreeprogram', 'DashboardController@postNewdegreeprogram');
Route::post('admin/deletedegreeprogram', 'DashboardController@postDeletedegreeprogram');
Route::post('admin/restoredegreeprogram', 'DashboardController@postRestoredegreeprogram');
Route::post('admin/forcedeletedegreeprogram', 'DashboardController@postForcedeletedegreeprogram');
Route::get('admin/plans/{id?}', 'DashboardController@getPlans');
Route::get('admin/newplan', 'DashboardController@getNewplan');
Route::post('admin/plans/{id?}', 'DashboardController@postPlans');
Route::post('admin/newplan', 'DashboardController@postNewplan');
Route::post('admin/deleteplan', 'DashboardController@postDeleteplan');
Route::post('admin/restoreplan', 'DashboardController@postRestoreplan');
Route::post('admin/forcedeleteplan', 'DashboardController@postForcedeleteplan');
Route::get('admin/completedcourses/{id?}', 'DashboardController@getCompletedcourses');
Route::get('admin/newcompletedcourse', 'DashboardController@getNewcompletedcourse');
Route::post('admin/completedcourses/{id?}', 'DashboardController@postCompletedcourses');
Route::post('admin/newcompletedcourse', 'DashboardController@postNewcompletedcourse');
Route::post('admin/deletecompletedcourse', 'DashboardController@postDeletecompletedcourse');

/*
 * Routes for ElectivelistsController
 */
Route::get('electivelists/electivelistfeed', 'ElectivelistsController@getElectivelistfeed');

/*
 * Routes for Authentication
 */
Route::get('auth/login', 'Auth\AuthController@CASLogin');
Route::get('auth/logout', 'Auth\AuthController@Logout');
Route::get('auth/caslogout', 'Auth\AuthController@CASLogout');
Route::get('auth/force', 'Auth\AuthController@ForceLogin');

Route::post('editable/save/{id?}', 'EditableController@postSave');
