module.exports = function(app, passport){
    
    app.get('/', homeCheckLoggedIn, function(req, res){
        res.render('index.ejs', {
            login: undefined, 
            signup: undefined
        });
    }).post('/', function(req, res, next){
        if(req.body.hasOwnProperty('username')){
            passport.authenticate('login', function(err, user, info){
                if(err) return next(err);
                if(!user){
                    res.render('index.ejs', {
                        login: info,
                        signup: undefined
                    });
                }else{
                    req.login(user, function(err){
                        if(err) throw err;
                    });
                    res.redirect('/');
                }
            })(req, res, next);
        }else{
            passport.authenticate('signup', function(err, user, message){
                if(err) return next(err);
                if(!user){
                    res.render('index.ejs', {
                        login: undefined,
                        signup: message
                    });
                }else{
                    req.login(user, function(err){
                        if(err) throw err;
                    });
                    res.redirect('/');
                }
            })(req, res, next);
        }
    });
    
    app.get('/dashboard', dashboardCheckLoggedIn, function(req, res){
        res.send('dashboard');
    });
    
};

function homeCheckLoggedIn(req, res, next){
    if(!req.isAuthenticated()) return next();
    res.redirect('/dashboard');
}

function dashboardCheckLoggedIn(req, res, next){
    if(req.isAuthenticated()) return next();
    res.redirect('/');
}