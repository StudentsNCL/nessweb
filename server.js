var app = require('./app/config');
var port = app.locals.config.http_port || 8080

app.listen(port);

console.info('Server listening on port ' + port);
