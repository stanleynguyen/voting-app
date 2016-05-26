var localStrat = require("passport-local").Strategy;
var User = require("../app/models/user");

module.exports = function(passport){
    passport.serializeUser(function(user, done){
        done(null, user.id);
    });
    
    passport.deserializeUser(function(id, done){
        User.findById(id, function(err, user){
            done(err, user);
        });
    });
    
    passport.use('signup', new localStrat({
        usernameField: 'newusername',
        passwordField: 'newpassword',
        passReqToCallback: true
    }, function(req, name, password, done){
        process.nextTick(function(){
            User.findOne({username: name}, function(err, user){
                if(err) return done(err);
                if(user){
                    return done(null, false, 'username');
                }else{
                    User.findOne({email: req.body.newemail}, function(err, user){
                        if(err) return done(err);
                        if(user){
                            return done(null, false, 'email');
                        }else{
                            var newUser = new User();
                            newUser.username = name;
                            newUser.email = req.body.newemail;
                            newUser.password = newUser.generateHash(password);
                            newUser.answer = {'initialize': 'ok'};
                            
                            newUser.save(function(err){
                                if(err) throw err;
                                return done(null, newUser);
                            });
                        }
                    });
                }
            });
        });
    }));
    
    passport.use('login', new localStrat({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
    }, function(req, name, password, done){
        User.findOne({username: name}, function(err, user){
            if(err) return done(err);
            if(!user){
                return done(null, false, 'fail');
            }else{
                if(!user.validPassword(password)){
                    return done(null, false, 'fail');
                }else{
                    return done(null, user);
                }
            }
        });
    }));
};