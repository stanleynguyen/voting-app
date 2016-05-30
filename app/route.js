var Poll = require("./models/poll");
var User = require("./models/user");

module.exports = function(app, passport){
    
    app.get('/', homeCheckLoggedIn, function(req, res){
        Poll.find({}, '_id question author', function(err, polls){
            if(err) res.redirect('/');
            res.render('index.ejs', {
                login: undefined, 
                signup: undefined,
                polls: polls
            });
        });
    }).post('/', function(req, res, next){
        if(req.body.hasOwnProperty('username')){
            passport.authenticate('login', function(err, user, info){
                if(err) return next(err);
                if(!user){
                    Poll.find({}, '_id question author', function(err, polls){
                        if(err) res.redirect('/');
                        res.render('index.ejs', {
                            login: info, 
                            signup: undefined,
                            polls: polls
                        });
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
                    Poll.find({}, '_id question author', function(err, polls){
                        if(err) res.redirect('/');
                        res.render('index.ejs', {
                            login: undefined, 
                            signup: message,
                            polls: polls
                        });
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
    
    app.get('/dashboard', privateCheckLoggedIn, function(req, res){
        Poll.find({}, '_id author question resNumber', function(err, polls){
            if(err) res.redirect('/dashboard');
            var otherPolls = polls.filter(function(curr){return curr.author !== req.user.username});
            var myPolls = polls.filter(function(curr){return curr.author === req.user.username});
            res.render('dashboard.ejs', {
                username: req.user.username,
                polls: polls,
                otherPolls: otherPolls,
                myPolls: myPolls
            });
        });
    }).post('/dashboard', privateCheckLoggedIn, function(req, res){
        var newPoll = new Poll();
        newPoll.question = req.body.question;
        newPoll.choices = {"iniVal": 'ok'};
        for(var key in req.body){
            if(key !== 'question'){
                newPoll.choices[key] = {};
                newPoll.choices[key].content = req.body[key];
                newPoll.choices[key].vote = 0;
            }
        }
        newPoll.author = req.user.username;
        newPoll.save(function(err, poll){
            if(err) throw err;
            res.redirect('/mypolls/'+poll._id);
        });
    });
    
    app.get('/polls/:id', myPollorNot, function(req, res){
        Poll.findOne({_id: req.params.id}, function(err, poll){
            if(err) res.redirect('/');
            if(!req.isAuthenticated()){
                res.render('poll.ejs', {
                    authenticate: false,
                    login: undefined,
                    signup: undefined,
                    autho: false,
                    choices: poll.getChoices(),
                    question: poll.question,
                    percentage: poll.getPercentage(),
                    userchoice: undefined
                });
            }else{
                res.render('poll.ejs', {
                    authenticate: true,
                    username: req.user.username,
                    autho: false,
                    choices: poll.getChoices(),
                    question: poll.question,
                    percentage: poll.getPercentage(),
                    userchoice: req.user.answer[poll._id]
                });
            }
        });
    }).post('/polls/:id', function(req, res, next){
        if(req.body.hasOwnProperty('username')){
            passport.authenticate('login', function(err, user, info){
                if(err) return next(err);
                if(!user){
                    Poll.findOne({_id: req.params.id}, function(err, poll){
                        if(err) res.redirect('/');
                        res.render('poll.ejs', {
                            login: info, 
                            signup: undefined,
                            authenticate: false,
                            autho: false,
                            choices: poll.getChoices(),
                            question: poll.question,
                            percentage: poll.getPercentage(),
                            userchoice: undefined
                        });
                    });
                }else{
                    req.login(user, function(err){
                        if(err) throw err;
                    });
                    res.redirect('/polls/'+req.params.id);
                }
            })(req, res, next);
        }else if(req.body.hasOwnProperty('newusername')){
            passport.authenticate('signup', function(err, user, message){
                if(err) return next(err);
                if(!user){
                    Poll.findOne({_id: req.params.id}, function(err, poll){
                        if(err) res.redirect('/');
                        res.render('poll.ejs', {
                            login: undefined, 
                            signup: message,
                            authenticate: false,
                            autho: false,
                            choices: poll.getChoices(),
                            question: poll.question,
                            percentage: poll.getPercentage(),
                            userchoice: undefined
                        });
                    });
                }else{
                    req.login(user, function(err){
                        if(err) throw err;
                    });
                    res.redirect('/polls/'+req.params.id);
                }
            })(req, res, next);
        }else if(req.isAuthenticated()){
            vote(req,res);
        }else{
            res.redirect('/polls/'+req.params.id);
        }
    });
    
    app.get('/mypolls/:id', pubPollorNot, function(req, res){
        Poll.findOne({_id: req.params.id}, function(err, poll){
            if(err) res.redirect('/dashboard');
            res.render('poll.ejs', {
                username: req.user.username,
                authenticate: true,
                autho: true,
                choices: poll.getChoices(),
                question: poll.question,
                percentage: poll.getPercentage(),
                userchoice: req.user.answer[poll._id]
            });
        });
    }).post('/mypolls/:id', privateCheckLoggedIn, function(req, res){
       vote(req, res); 
    });
    
    app.get('/delete/:id', pubPollorNot, function(req, res){
        Poll.findOne({_id: req.params.id}).remove().exec();
        res.redirect('/dashboard');
    });
    
    app.get('/settings', privateCheckLoggedIn, function(req, res){
        res.render('settings.ejs',{
            username: req.user.username,
            email: req.user.email,
            status: null
        });
    }).post('/settings', privateCheckLoggedIn, function(req, res){
        if(req.user.validPassword(req.body.password)){
            User.findOneAndUpdate({username: req.user.username}, {password: req.user.generateHash(req.body.newpassword)}, function(err){
                if(err) throw err;
            });
            res.render('settings.ejs', {
                username: req.user.username,
                email: req.user.email,
                status: 'success'
            });
        }else{
            res.render('settings.ejs', {
                username: req.user.username,
                email: req.user.email,
                status: 'fail'
            });
        }
    });
    
    app.get('/logout', privateCheckLoggedIn, function(req, res){
        req.logout();
        res.redirect('/');
    });
};

function homeCheckLoggedIn(req, res, next){
    if(!req.isAuthenticated()) return next();
    res.redirect('/dashboard');
}

function privateCheckLoggedIn(req, res, next){
    if(req.isAuthenticated()) return next();
    res.redirect('/');
}

function myPollorNot(req, res, next){
    Poll.findOne({_id: req.params.id}, 'author', function(err, poll){
        if(err) return res.redirect('/');
        if(!poll) return res.redirect('/');
        if(!req.user) return next();
        if(poll.author !== req.user.username) return next();
        res.redirect('/mypolls/'+req.params.id);
    });
}

function pubPollorNot(req, res, next){
    Poll.findOne({_id: req.params.id}, 'author', function(err, poll){
        if(err) return res.redirect('/');
        if(!poll) return res.redirect('/');
        if(!req.user) return res.redirect('/polls/'+req.params.id);
        if(poll.author === req.user.username) return next();
        res.redirect('/polls/'+req.params.id);
    });
}

function vote(req, res){
    var answerId = 'answer.'+req.params.id;
    var newChoice = 'choices.'+req.body.myFreakingFormLOL+'.vote';
    if(req.user.answer[req.params.id]){
        var oldChoice = 'choices.'+req.user.answer[req.params.id]+'.vote';
        if(newChoice !== oldChoice){
            Poll.findOneAndUpdate({_id: req.params.id}, {$inc: {[newChoice]:1, [oldChoice]: -1}}, {upsert: true, new: true}, function(err, doc){
                if(err) console.log(err);
                res.redirect(req.url);
            });
            User.findOneAndUpdate({username: req.user.username}, {[answerId]: req.body.myFreakingFormLOL}, function(err){
                if(err) console.log(err);
            });
        }else{
            res.redirect(req.url);
        }
    }else{
        User.findOneAndUpdate({username: req.user.username}, {[answerId]: req.body.myFreakingFormLOL}, {upsert: true}, function(err){
            if(err) console.log(err);
        });
        Poll.findOneAndUpdate({_id: req.params.id}, {$inc: {[newChoice]: 1}}, {upsert: true, new: true}, function(err, doc){
            if(err) console.log(err);
            res.redirect(req.url);
        });
    }
}
