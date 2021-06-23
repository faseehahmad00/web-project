var express = require('express');
var router = express.Router();
var {User,Encrypt} = require('../models/users');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
const config  = require('config');
const userAuth = require('../middlewares/userAuth');
const adminAuth = require('../middlewares/adminAuth');
var {loginValidation , signupValidation} = require('../middlewares/userValidation');

/* GET users listing. */
router.get('/',userAuth , adminAuth, async function(req, res, next) {
  let users = await User.find();
  return res.send(users);
});

// get a certain user
router.get('/:id', userAuth ,adminAuth,async function(req, res, next) {
  let user = await User.findById(req.params.id);
  return res.send(user);
});

//delete a user 
router.delete('/:id',userAuth,adminAuth,async function(req, res, next) {
  let user = await User.findById(req.params.id);
  await user.delete();
  return res.send({});
});

//edit a user
router.put('/:id',signupValidation,userAuth,async function(req, res, next) {
  let user = await User.findById(req.params.id);
  if(`${req.user._id}` == `${user._id}` ) {
    user.name = req.body.name;
    user.email = req.body.email;
    user.password = await Encrypt(req.body.password);
    user.role = req.body.role;
    a = await user.save();
    return res.send(a);
  }
  return res.status(401).send("unauthorized access")
});

//SIGNUP (new user creation)
router.post('/signup',signupValidation,async function(req, res, next) {
  let user = await User.findOne({"email":req.body.email});
  if(!user){
    user = new User();
    user.name = req.body.name;
    user.email = req.body.email;
    user.password = await Encrypt(req.body.password);
    user.role = req.body.role;
    await user.save();
    let {name,email}  = user ;
    return res.status(200).send({name,email});
  }
  return res.status(400).send("user already exist");

});

//LOGIN 
router.post('/login',loginValidation,async function(req, res, next) {
  let user = await User.findOne({"email":req.body.email});
  if(!user)
    return res.status(400).send("invalid user or password"); 
  else
    if(await bcrypt.compare(req.body.password, user.password))
    {
    let token = jwt.sign({_id : user._id},config.get("privateKey"));
    return res.send(token)
    }
    return res.status(400).send("invalid password ");
});
 
module.exports = router;
