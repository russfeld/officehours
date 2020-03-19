<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class Groupsessionlist extends Migration
{
  /**
   * Run the migrations.
   *
   * @return void
   */
  public function up()
  {
    Schema::create('groupsessionlists', function (Blueprint $table) {
        $table->increments('id');
        $table->string('name');
        $table->timestamps();
    });

    Schema::table('groupsessions', function (Blueprint $table) {
        $table->integer('groupsessionlist_id')->unsigned();
        $table->foreign('groupsessionlist_id')->references('id')->on('groupsessionlist');

    });

  }

  /**
   * Reverse the migrations.
   *
   * @return void
   */
  public function down()
  {
      //https://github.com/laravel/framework/issues/13873

      Schema::table('groupsessions', function (Blueprint $table) {
          $table->dropForeign('groupsessions_groupsessionlist_id_foreign');
          $table->dropColumn('groupsessionlist_id');
      });

      Schema::drop('groupsessionlists');

  }

}
