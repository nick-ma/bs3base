var APP_NAME = 'Start Template';
/**
 * Module dependencies.
 */

var express = require('express'),
    mongoStore = require('connect-mongo')(express),
    flash = require('connect-flash'),
    http = require('http'),
    path = require('path'),
    util = require('util'),
    bcrypt = require('bcrypt'),
    mongoose = require('mongoose'),
    colors = require('colors'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    moment = require('moment'),
    sprintf = require('sprintf').sprintf,
    async = require('async'),
    Grid = require('gridfs-stream'),
    events = require('events'),
    i18n = require('i18next'),
    _ = require('underscore');

Grid.mongo = mongoose.mongo;
var app = express();
var mongodb_uri;
// 页面资源相关-> 页面相关的js，插件相关的js，页面相关的css，插件相关的css
var path_js_page, path_js_plugins, path_css_page, path_css_plugins;
app.configure('development', function() { //配置开发环境相关的变量
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
    mongodb_uri = 'mongodb://localhost/dbname?poolSize=5';
    path_js_page = '/pagejs';
    path_css_page = 'pagecss';
    path_js_plugins = 'plugins/js';
    path_css_plugins = 'plugins/css';
});
app.configure('production', function() { //配置生产环境相关的变量
    app.use(express.errorHandler());
    mongodb_uri = 'mongodb://localhost/dbname?poolSize=10';
    path_js_page = '/pagejs-min';
    path_css_page = 'pagecss-min';
    path_js_plugins = 'plugins';
    path_css_plugins = 'plugins/css';
});
// 建立mongodb连接
mongoose.connect(mongodb_uri);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.on('open', function() {
    console.log(colors.yellow('Connected to Mongoose on ' + mongodb_uri));
});
//多语言引擎的配置
i18n.init({
    useCookie: true, //使用cookie来保存语言
    detectLngFromHeaders: true, //使用header里面的信息
    supportedLngs: ['en', 'zh'], //设置支持英文和中文
    fallbackLng: 'zh',
    // debug: true,
    resGetPath: __dirname + '/locales/__lng__/__ns__.json',

    ns: {
        namespaces: ['app', 'btn', 'msg'], //设定命名空间，用来区分不同用途的翻译信息。
        defaultNs: 'app'
    },
    resSetPath: __dirname + '/locales/__lng__/new.__ns__.json',
    saveMissing: true,
    ignoreRoutes: ['img', 'avatar_72', 'avatar_288', 'css', 'js', 'pagejs'],
    // 
    sendMissingTo: 'all'
});
// all environments
app.set('port', process.env.PORT || 9990);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.compress()); //use compress
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('pony'));
app.use(express.session({
    secret: "()&*$#@QDFG^&%$^##W^&*TFGCXS$%$^&*(UOIHDS%$^$%&*%$WSDRFGU*&^R&%F*&T^RF))",
    store: new mongoStore({
        mongoose_connection: db,
    })
}));
app.use(i18n.handle); // have i18n befor app.router
app.use(flash()); // use flash function
app.use(app.router);
// Remember Me middleware & i18n set language
app.use(function(req, res, next) {
    if (req.method == 'POST' && req.url == '/login') {
        if (req.body.rememberme) {
            req.session.cookie.maxAge = 2592000000; // 30*24*60*60*1000 Rememeber 'me' for 30 days
        } else {
            req.session.cookie.expires = false;
        }
    }
    next();
});
//设置passport组件
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(token, done) {
    if (!app.locals.login_users) { //lazy init login_users
        app.locals.login_users = {};
    }
    if (app.locals.login_users[token]) {
        // console.log('deserializeUser from cache');
        done(null, app.locals.login_users[token])
    } else {
        User.findById(token).populate('').exec(function(err, user) {
            // console.log('deserializeUser from database');
            if (user) {
                app.locals.login_users[token] = user;
            };
            done(err, user);
        });
    }
});
app.use(passport.initialize()); //initialing passport midleware
app.use(passport.session()); //enabling passport session support
//设置passport组件——结束
app.use(express.static(path.join(__dirname, 'public')));

app.locals.APP_NAME = APP_NAME;
// 注册helper函数
app.locals({
    toISODate: function(date) {
        return util.isDate(date) ? moment(date).format('YYYY-MM-DD') : date;
    },
    toISOTime: function(date) {
        return util.isDate(date) ? moment(date).format('HH:mm:ss') : date;
    },
    toISODatetime: function(date) {
        return util.isDate(date) ? moment(date).format('YYYY-MM-DD HH:mm:ss') : date;
    },
    calcSize: function(size) {
        if (size < 1024) {
            return sprintf('%0.2f B', size);
        } else if (size >= 1024 && size < 1048576) { //1024 * 1024
            return sprintf('%0.2f KB', size / 1024);
        } else if (size >= 1048576 && size < 1073741824) { //1024^3
            return sprintf('%0.2f MB', size / 1048576);
        } else if (size >= 1073741824) {
            return springf('%0.2f GB', size / 1073741824);
        };
    },
    handle500: function(err, req, res) {
        res.status(500);
        res.render('500.jade', {
            title: '500: Internal Server Error',
            error: err
        });
    },
    handle404: function(err, req, res) {
        res.status(404);
    },

})
// 设置全局变量
app.locals({
    gv_toolpath: path.join(__dirname, 'tools'),
    path_js_page: path_js_page,
    path_js_plugins: path_js_plugins,
    path_css_page: path_css_page,
    path_css_plugins: path_css_plugins,
})
i18n.registerAppHelper(app)
    .serveClientScript(app)
    .serveDynamicResources(app)
    .serveMissingKeyRoute(app)
    .serveChangeKeyRoute(app)
    .serveRemoveKeyRoute(app);
// web translate interface
i18n.serveWebTranslate(app, {
    i18nextWTOptions: {
        languages: ['zh', 'en'],
        namespaces: ['app', 'btn', 'msg'],
        resGetPath: "locales/resources.json?lng=__lng__&ns=__ns__",
        resChangePath: 'locales/change/__lng__/__ns__',
        resRemovePath: 'locales/remove/__lng__/__ns__',
        fallbackLng: "zh",
        dynamicLoad: true
    },
    authenticated: function(req, res) {
        //return req.user;
        return true; //for dev
    }
});
// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

// app.get('/', routes.index);
// app.get('/users', user.list);

// Handle 404 － last chance
app.use(function(req, res) {
    //console.log('message in 404');
    res.status(404);
    res.render('404.jade', {
        title: '404: File Not Found'
    });
});

// Handle 500 － last chance
app.use(function(error, req, res, next) {
    // throw error;
    console.log(util.inspect(error, {
        depth: null
    }));
    res.status(500);
    res.render('500.jade', {
        title: '500: Internal Server Error',
        error: error
    });
});

var server = http.createServer(app).listen(app.get('port'), function() {
    var env_msg = (app.get('env') == 'development') ? colors.green(app.get('env')) : colors.red(app.get('env'));
    console.log("Express server listening on port " + colors.green(app.get('port')) + ' in ' + env_msg + ' mode.');
}).on('close', function() {
    console.log(colors.red('terminating server'));
    client.quit();
});
