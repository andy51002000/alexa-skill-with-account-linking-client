
exports.index = function (req, res) {
    res.render('index', { user: req.user });
    console.log(req.user);
}

exports.logout = function (req, res) {
    req.logout();
    res.redirect('/');
}

exports.auth = function (req, res) {
    // The request will be redirected to Amazon for authentication, so this
    // function will not be called.
}

exports.auth_callback = function (req, res) {
    res.redirect('/');
}

exports.adddev = function (req, res) {
    res.render('adddev');
}


var AWS = require("aws-sdk");
AWS.config.loadFromPath('./config.json');
var docClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });

var dbHelper = require('dynamodb-helper');
var Users = new dbHelper(docClient, 'Users');

exports.adddev_post = function (req, res) {
	
	try{
        Users.find(req.user.id, function (err,data) {
        console.log(data);

        if(err){
            //failed to get data or upload data
            console.log("Error occured");            
            res.render('adddev_r', { err: err.message });
            return new Error(err);
        }

        if (typeof data.Item === "undefined") {
            Users.putItem({ id: req.user.id, devs: [{ sn: req.body.sn, name: req.body.name }] });
        } else {

            data.Item.devs.push({ sn: req.body.sn, name: req.body.name });
            Users.putItem(data.Item);
        }

        res.render('adddev_s', { sn: req.body.sn });    
    })
	    
	}catch(ex){
		res.render('adddev_r', { sn: req.body.sn });
	}


}