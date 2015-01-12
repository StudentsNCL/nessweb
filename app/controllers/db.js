var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('nessweb.db');
var check;
db.serialize(function() {

  db.run("CREATE TABLE if not exists marks (user TEXT, module TEXT, work TEXT, mark INT, percent INT, actual INT DEFAULT 0, PRIMARY KEY (user, module, work))");
  db.run("CREATE TABLE if not exists stages (user TEXT, stage INT, percent INT, PRIMARY KEY (user, stage))");

});

module.exports.addMark = function(user, module, work, mark, percent) {
	db.run('INSERT OR REPLACE INTO marks VALUES ($user, $module, $work, $mark, $percent, 0)',
		{
			$user: user,
			$module: module,
			$work: work,
			$mark: mark,
			$percent: percent
		});
}

module.exports.addMarks = function(user, module, marks) {
	var stmt = db.prepare('INSERT OR REPLACE INTO marks VALUES ($user, $module, $work, $mark, $percent, $actual)');
	marks.forEach(function(mark) {
		stmt.run({
			$user: user,
			$module: module,
			$work: mark.work,
			$mark: mark.mark,
			$percent: mark.percent,
			$actual: mark.actual
		});
	});
	stmt.finalize();
}

module.exports.getMarks = function(user, module, callback) {
	db.all('SELECT * FROM marks WHERE user = $user AND module = $module',
	{
		$user: user,
		$module: module
	}, callback);
}

module.exports.getAllMarks = function(user, callback) {
	db.all('SELECT * FROM marks WHERE user = $user',
	{
		$user: user
	}, callback);
}

module.exports.addStages = function(user, stages) {
	var stmt = db.prepare('INSERT OR REPLACE INTO stages VALUES ($user, $stage, $percent)');
	stages.forEach(function(stage) {
		stmt.run({
			$user: user,
			$stage: stage.stage,
			$percent: stage.percent
		});
	});
	stmt.finalize();
}

module.exports.getStages = function(user, callback) {
	db.all('SELECT * FROM stages WHERE user = $user',
	{
		$user: user
	}, callback);
}


////db.close();