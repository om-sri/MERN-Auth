const User = require("../model/Usermodel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_SECRET_KEY = "mykey";

//check if user already exists with the same email
//password hashing using bycryptjs
//save user to database and return user details in response
const signup = async (req, res, next) => { 
    const {name, email, password} = req.body;
    let existingUser;
    try{
        existingUser = await User.findOne({email:email})
    }catch(err){console.log(err)}

    if(existingUser){
        return res.status(400).json({message:"User already exists, please login"})
    }

    const hashedPassword = bcrypt.hashSync(password)
    const user = new User({
      name,
      email,
      password: hashedPassword,
      
    });
  
    try {
      await user.save();
    } catch (error) {
      console.log(error);
    }
    return res.status(201).json({message:user})
};

//check if user exists with the same email
//check if password is correct using compareSync, compareSync can be used to compare plain text password with hashed password
//create token using jwt.sign with secret key and return token in response
const login = async (req, res, next) => { 
    const{email,password} = req.body;
    let existingUser;
    try{
        existingUser = await User.findOne({email:email})
    }catch(err){console.log(err)}
    if(!existingUser){
        return res.status(400).json({message:"User does not exist, please signup"})
    }
    const ispasswordcorrect = bcrypt.compareSync(password,existingUser.password)
    if (!ispasswordcorrect){
        return res.status(400).json({message:"Password is incorrect"})
    }
    const token = jwt.sign({id:existingUser._id},JWT_SECRET_KEY,
        {expiresIn:"30s"})
    res.cookie(String(existingUser._id),token,{
        path:"/",expires:new Date(Date.now()+60000),
        httpOnly:true,sameSite:"lax",
    });
    return res.status(200).json({message:'Successfully logged in',user:existingUser,token:token})
};

//get token from headers
//jwt.verify can verify token with secret key and return user id
//if token is valid, get user id from token and return it in response
//cookie is used to store token in browser,format is id=token
const verifyToken = (req, res, next) => {
    const cookies = req.headers.cookie;
    const token = cookies.split("=")[1];
    console.log("Cookies:", cookies);
    console.log("Token:", token);
  
    if (!token) {
      console.log("No token found");
      return res.status(401).json({ message: "No token found" });
    }
  
    jwt.verify(String(token), JWT_SECRET_KEY, (err, user) => {
      console.log(user)
      if (err) {
        console.log("Invalid token:", err);
        return res.status(403).json({ message: "Invalid token" });
      }
      console.log("User ID:", user.id);
      req.id = user.id;
    });
  
    next();
  };
  
  
//to get user details from database using user id
//to return user details in response
//included in /user same as verifyToken because we need to verify token before getting user details
const getUser = async (req, res, next) => {
    const userId = req.id;
    let user;
    try{
        user = await User.findById(userId,"-password");
    }
    catch(err){return new Error(err)}
    if(!user){
        return res.status(404).json({message:"User not found"})
    }
    return res.status(200).json({message:user})
}


exports.signup = signup;
exports.login = login;
exports.verifyToken = verifyToken;
exports.getUser = getUser;