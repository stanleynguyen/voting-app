var mongoose = require("mongoose");

var pollSchema = new mongoose.Schema({
    question: String,
    choices: Object,
    author: String
});

pollSchema.methods.resNumber = function(){
    var result = 0;
    for(var key in this.choices){
        if(key !== 'iniVal') result += this.choices[key];
    }
    return result;
};

pollSchema.methods.getChoices = function(){
    var choices = [];
    for(var key in this.choices){
        if(key !== 'iniVal') choices.push(key);
    }
    return choices;
};

pollSchema.methods.getPercentage = function(){
    var percentage = {};
    var total = this.resNumber();
    if(total === 0){
        return {'anything yet!': 'No one'};
    }
    var choices = this.getChoices();
    for(var ind in choices){
        percentage[choices[ind]] = Math.floor(this.choices[choices[ind]]/total*100)+'%';
    }
    return percentage;
};

module.exports = mongoose.model('Poll', pollSchema);