var mongoose = require("mongoose");

var pollSchema = new mongoose.Schema({
    question: String,
    choices: Object,
    author: String
});

pollSchema.methods.resNumber = function(){
    var result = 0;
    for(var key in this.choices){
        if(key !== 'iniVal') result += this.choices[key].vote;
    }
    return result;
};

pollSchema.methods.getChoices = function(){
    var choices = {};
    for(var key in this.choices){
        if(key !== 'iniVal') choices[key] = this.choices[key].content;
    }
    return choices;
};

pollSchema.methods.getPercentage = function(){
    var percentage = {};
    var total = this.resNumber();
    if(total === 0){
        return {0: {
            percent: 'No one',
            content: 'anything yet!'
            }
        };
    }
    var choices = this.getChoices();
    for(var ind in choices){
        percentage[ind] = {};
        percentage[ind].content = choices[ind];
        percentage[ind].percent = Math.floor(this.choices[ind].vote/total*100)+'%';
    }
    return percentage;
};

module.exports = mongoose.model('Poll', pollSchema);