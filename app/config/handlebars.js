var handlebars = require('express3-handlebars'),
    moment = require('moment');

module.exports = function (app) {
    app.engine('.hbs', handlebars({
        defaultLayout: 'main',
        layoutsDir: 'app/views/layouts/',
        extname: '.hbs',
        helpers: {
            eq: function (obj1, obj2, options) {
                if (obj1 === obj2) {
                    return options.fn(this);
                } else {
                    return options.inverse(this);
                }
            },
            dueDate: function(datetime) {
                return moment(datetime).fromNow();
                //return moment(datetime).format("HH:mm");
            },
            formatDate: function(datetime) {
                return moment(datetime).format("dddd DD MMMM YYYY - HH:mm");
            },
            dateAfter: function(datetime, options) {
                if(moment().diff(datetime) > 0)
                    return options.fn(this);
                else
                    return options.inverse(this);
            },
            getMarkPercentage: function(mark) {
                return Math.round(mark.mark / mark.total * 1000) / 10;
            },
            markPass: function(mark, options) {
                var markPercentage = mark.mark / mark.total * 100;
                if(markPercentage > 40)
                    return true;
                else
                    return false;
            },
            gte: function(num, comp, options) {
                if (typeof(num) === 'number' && num >= comp) {
                    return options.fn(this);
                }
                else {
                    return options.inverse(this);
                }
            },
            math: function(lvalue, operator, rvalue, options) {
                lvalue = parseFloat(lvalue);
                rvalue = parseFloat(rvalue);

                return {
                    "+": lvalue + rvalue,
                    "-": lvalue - rvalue,
                    "*": lvalue * rvalue,
                    "/": lvalue / rvalue,
                    "%": lvalue % rvalue
                }[operator];
            },
            ifCond: function (v1, operator, v2, options) {
                switch (operator) {
                    case '==':
                        return (v1 == v2) ? options.fn(this) : options.inverse(this);
                    case '===':
                        return (v1 === v2) ? options.fn(this) : options.inverse(this);
                    case '!=':
                        return (v1 != v2) ? options.fn(this) : options.inverse(this);
                    case '!==':
                        return (v1 !== v2) ? options.fn(this) : options.inverse(this);
                    case '<':
                        return (v1 < v2) ? options.fn(this) : options.inverse(this);
                    case '<=':
                        return (v1 <= v2) ? options.fn(this) : options.inverse(this);
                    case '>':
                        return (v1 > v2) ? options.fn(this) : options.inverse(this);
                    case '>=':
                        return (v1 >= v2) ? options.fn(this) : options.inverse(this);
                    case '&&':
                        return (v1 && v2) ? options.fn(this) : options.inverse(this);
                    case '||':
                        return (v1 || v2) ? options.fn(this) : options.inverse(this);
                    default:
                        return options.inverse(this);
                }
            }
        },
    }));

    app.set('view engine', '.hbs');
    app.set('views', 'app/views/');
}