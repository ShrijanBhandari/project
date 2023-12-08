import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "path";
import { userInfo } from "os";
const app=express();
const port=80;
// //Database connection
mongoose.connect('mongodb://127.0.0.1:27017',{dbName:'User_Login'}).then(()=>{
    console.log("Database Connected")
})
//add data structure of data obtained
const data_structure=new mongoose.Schema({
    username:String,
    email:String,
    password:String
})
//add data to database
const user=mongoose.model('students',data_structure);
//requirements
app.set('view engine','ejs')//to access render method and ejs file
app.use(express.static(path.join(path.resolve(),'public')));//to access public folder
app.use(express.urlencoded({extended:true}));//to access data from body
app.use(cookieParser());
//functions
const isAuthenticated=async (req,res,next)=>{
    const is_token=req.cookies.token;
        if(is_token){
            const decoded=jwt.verify(is_token,'helloworld')
            req.user_data=await user.findById(decoded._id);
            next();
        }
        else{
            res.redirect('/login');
        }
    }
//get methods
app.get('/login',(req,res)=>{
    res.render('login')
})
app.get("/register",(req,res)=>{
    res.render('register')
})
app.get('/',isAuthenticated,async(req,res)=>{
    res.render('logout',{name:req.user_data.username});
})
app.get('/logout',(req,res)=>{
    res.clearCookie('token');
    res.redirect('/login');
})
//post methods
app.post('/login',async(req,res)=>{
const {email,password}=req.body;
    const does_exist=await user.findOne({email});
    if(!email)
    {
      res.render('login',{msg2:'Email is blank'});
    }
    else if(!does_exist)
    {
        res.redirect('/register');
    }
    else{
        const is_match=await bcrypt.compareSync(password,does_exist.password);
        if(email){
            if(is_match){
                const token=jwt.sign({_id:does_exist._id},'helloworld')
                res.cookie('token',token,{httpOnly:true,expires:new Date(Date.now()+20000)})
                res.redirect('/');
            }
            else{
                res.render('login',{msg1:'Incorrect Password',email_id:email});
            }
        }
    }
})
app.post('/register',async(req,res)=>{
    const {username,email,password}=req.body;
    const does_exist=await user.findOne({email});
    if(does_exist)
    {
        res.redirect('/login');
    }
    else{
        if(email&&password&&username){
            const user_info=await user.create({
                username,email,password:bcrypt.hashSync(password,10)//safe password for users
            })
            const token=jwt.sign({_id:user_info._id},'helloworld')
            res.cookie('token',token,{httpOnly:true,expires:new Date(Date.now()+20000)})
            res.redirect('/');
        }
        else{
            res.render('register',{msg3:'Field cannot be empty',email_id:email,name:username,pass:password});
        }
    }
})

app.listen(port,()=>{
    console.log(`Server working at ${port}`);
})