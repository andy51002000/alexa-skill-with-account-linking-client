
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

var dbHelper = require('../dynamodbHelper');
var Users = new dbHelper('Users');

exports.adddev_post = function (req, res) {
    Users.find(req.user.id, function (data) {
        console.log(data);
        if (typeof data.Item === "undefined") {
            Users.putItem({ id: req.user.id, devs: [{ sn: req.body.sn, name: req.body.name }] });
        } else {
            let devs = data.Item.devs;
            data.Item.devs.push({ sn: req.body.sn, name: req.body.name });
            Users.putItem(data.Item);
        }

    })
    //Users.putItem({id:req.user.id, sn:req.body.sn, name:req.body.name});
    res.render('adddev_s', { sn: req.body.sn });


}