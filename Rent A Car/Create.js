const mysqlconnection = require('./connection');
const express = require("express");
const bodyParser = require("body-parser");
const { request } = require('express');
const app = express();
const session = require('express-session');
const alert = require('alert');
const mysql = require('mysql');
const mysqlConnection = require('./connection');
const multer = require('multer');
const { countBy, now, result, subtract, identity } = require('lodash');
const http = require('http');
const formidable = require('formidable');
var Sequelize = require('sequelize');
const { Console } = require('console'); 
const fileUpload = require('express-fileupload');
const path = require('path');
const { EmptyResultError } = require('sequelize');
const date = require('date-and-time')

app.use(fileUpload());
app.use(express.static(__dirname + '/uploads'));

app.use(express.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/views'));
module.exports = app;



app.listen(3000,()=>{
    console.log("Server running");
});


// Customer - Starts
app.get("/logincust", (req, res) => {
    res.render("logincust");
});

app.get("/signupcust", (req, res) => {
    res.render("signupcust");
});

app.get("/HomePagec", (req, res) => {
    res.render("HomePagec");
});

app.get("/carbooking", (req, res) => {
    res.render("carbooking");
});
  
app.get("/seeMyRentedCars", (req, res) => {
    var sql = `SELECT NumberPlate,IDate,RDate,Amount FROM carspecifications,customercardetails where  carspecifications.Numberplate=customercardetails.plateNum`;
    mysqlconnection.query(sql,function(err,data,fields) {
        if(err)
            throw err;
        else if(data.length>0)
        {
            res.render('seeMyRentedCars', {result:data}); 
            alert('Car booked already.');
        }
        else{
            alert('No car selected');
            res.redirect('carbooking');
        }
        res.end();
    });
    
});
  
  
  
  let emailCust;
  app.post("/logincust", (req, res) => {
    console.log(req.body);
    let email = req.body.email;
    let password = req.body.password;
    let sql ="select * from customerpersonaldetails where email = ? and Password = ?";
    mysqlconnection.query(sql,
      [email, password],function (err, results, fields) {
        if (err) 
           throw err;
        if (results.length > 0) {

          emailCust=email;
          console.log(emailCust);
          res.render("HomePagec");
          console.log("LOGIN IN SUCCESSFUL");
        } else {
          alert("Wrong Email Or Password");
          res.render("logincust");
        }
  
        res.end();
      }
    );
});
  
app.post("/signupcust", (req, res) => {
    console.log(req.body);
    let data = {
        CustCNIC: req.body.CNIC,
        CustFullName: req.body.username,
        phoneNumber: req.body.phonenumber,
        Address: req.body.address,
        email: req.body.email,
        Password: req.body.password,
    };
  
    let sql = "INSERT INTO customerpersonaldetails SET ?";
    let query = mysqlconnection.query(sql, data, (err, rows) => {
        if (err) 
        {
          alert("You have inputted wrong values");
          console.log(err);    
        }
        else{
           res.redirect("HomePagec"); 
           console.log("DATA INSERTED SUCCESSFULLY.");  
        } 
        
        res.end();
    });
});
  
let ID,RD;
app.get("/getCarlist", (req, res) => {
    ID=req.query.toDate;
    RD=req.query.fromDate;
    var sql = `SELECT numPlate,IssuanceDate,ReturnDate,MakeName,ModelName,ManufacturingYear,BodyType,Seats,AC,WirelessTech,EngineCapacity,Fuel,Transmission,carData From car,carspecifications,newentrybyowner where car.NumberPlate=carspecifications.NumberPlate and car.NumberPlate=newentrybyowner.numPlate and "${ID}">IssuanceDate and  "${RD}"<ReturnDate AND "${ID}">CURRENT_DATE() and "${RD}">"${ID}"and car.NumberPlate NOT IN (SELECT plateNum FROM customercardetails);      `;
    mysqlconnection.query(sql,function(err,data,fields) {
      if(err)
         throw err;
      else if(ID>RD){
            alert("\n IssuanceDate Date cannot be higer than ReturnDate.");
            res.redirect("carbooking");
      }
      else 
      {
        console.log(data);
        res.render('carlist', {result:data}); 
        console.log("CUSTOMER CAR SEARCHED SUCCESSFULLY."); 
      }
      res.end();
  });
});
  
let customerCNIC, plateNum,amt,amt_cust;
app.get("/displayfinalCarBookCustDetails/:numPlate", (req,res) =>{
    console.log(req.params['numPlate']);
    var sql= `SELECT CustCNIC FROM customerpersonaldetails where email="${emailCust}"`; 
    mysqlconnection.query(sql,function(err,data){
      if(err) 
        throw err;
      else{
        
        console.log(ID);
        console.log(RD);
        
        customerCNIC= Object.values(JSON.parse(JSON.stringify(data)));
        console.log(customerCNIC);
        plateNum=req.params['numPlate'];
        var sqlamt =`SELECT bodytype.Amount amount from bodytype,carspecifications where carspecifications.BodyType=bodytype.Typee and carspecifications.NumberPlate="${plateNum}"`;
        mysqlconnection.query(sqlamt,function(err,resamt){
                if(err)
                 throw err;
                else 
                {
                    console.log("The amount to be paid:");
                    amt= Object.values(JSON.parse(JSON.stringify(resamt)));
                    console.log(amt);
        
                    var date1 = new Date(RD)
                    var date2 = new Date(ID)
                    var Diff = date1.getTime() - date2.getTime();
                    var differentDays = Math.ceil(Diff/ (1000 * 3600 * 24));
                    amt_cust =((amt[0]['amount']) * (2) * (differentDays)) ;
                    console.log("Amount to be paid");
                    console.log(amt_cust);
                    res.render('finalCarBookCust',{IssuanceDate:ID,ReturnDate:RD,Amount:amt_cust,numPlate:(req.params['numPlate']),CustCNIC:customerCNIC[0]['CustCNIC']});
                }
        })}
    })
    
});
  
let numberplate;
app.post("/savefinalCarBookCust", (req, res) => {
    numberplate=req.body.numPlate;
    var sql = "INSERT INTO `customercardetails`( `CustCNIC`,`plateNum`,`IDate`,`RDate`,`Amount`) VALUES ('" +customerCNIC[0]['CustCNIC'] + "','" +plateNum+ "','" +ID +"','"+RD +"','"+ amt_cust+"')";
    let query = mysqlconnection.query(sql,(err, rows) => {
        if (err) 
        {
            res.redirect('/displaymyRentedCars'); 
            alert(err);
            console.log(err); 
        }
        else
        {
            alert('Car booking confirmaton.');
            res.redirect('/HomePagec');
            
        }
        
        res.end();
    });
    
});
  
app.get("/displaymyRentedCars",(req, res) => {
    var sql = `SELECT NumberPlate,IDate,RDate,Amount FROM carspecifications,customercardetails where  carspecifications.Numberplate=customercardetails.plateNum`
    mysqlconnection.query(sql,function(err,data,fields) {
        if(err)
            throw err;
        else 
        {
            
            res.render('seeMyRentedCars', {result:data});
            alert('Car booked already.'); 
        }
        res.end();
    });
});


 




// Customer - Ends




















// Owner - Starts


var emailID;


app.get('/',(req,res)=>{
    res.render('firstPage');
});

app.get('/login',(req,res)=>{    

    res.render('login');
});

app.get('/signup',(req,res)=>{
    res.render('signup');
});


app.get('/carform',(req,res)=>{
    res.render('addCarForms');
});

app.post('/signup',(req,res)=>{
    emailID = [req.body.email];
    console.log(req.body);
    
                        
    let data = {OwnerCNIC: req.body.CNIC,
                OwnerFullname: req.body.username,
                phoneNumber : req.body.phonenumber,
                Address:  req.body.address,
                email: req.body.email,
                Status: 'Released',
                firstDate: new Date(),
                Password: req.body.password};

    let sql = "INSERT INTO carowner SET ?";
    let query = mysqlconnection.query(sql,data,(err,rows)=>{
        if(err)
        {
            console.log(err);
            alert("You have inputted wrong values");
            
            res.redirect('/signup');
        }
        else
            res.redirect('/HomePage');
            res.end();
    });
});

app.post('/login',(req, res) => {
    emailID = [req.body.email];
    let email = req.body.email;
    let password = req.body.password;
    let sql = "select * from carowner where email = ? and Password = ?";
    mysqlconnection.query(sql,[email,password],function (err, results, fields) {
    
        if(err)
            throw err;
        if(results.length > 0)
        {
            res.redirect('/HomePage');   
        }
        else
        {
            alert("Wrong Email Or Password");
            res.render('login');
        }
            
        res.end();
    });
});


  
app.get('/HomePage',(req,res)=>{
    mysqlConnection.query("Select Status from carowner where email = ?",[emailID],(err,r)=>{
        if(err) throw err;
        else{
            var D = Object.values(JSON.parse(JSON.stringify(r)));
            if(D[0]['status'] == 'Active')
            {
                let store = 'call checkNewEntryDate(?)';
                mysqlConnection.query(store,[emailID],(err,result)=>{
                    if(err) throw err;
                    
                });
                let storeowner = 'call checkOwnerStatus(?)';
                mysqlConnection.query(storeowner,[emailID],(err,result)=>{
                    if(err) throw err;
                    
                });
            }
            

        }
    });
    res.render('HomePage');
});

app.get('/seeMyCars',(req,res)=>{
    var sql = 'Select NumberPlate, ModelName, MakeName, ManufacturingYear, carData from car where OwnCNIC in (Select OwnerCNIC from carowner where email = ?)';
    var sqlCarSpecify = 'Select Seats, AC, WirelessTech, EngineCapacity, Transmission, Fuel, BodyType from carspecifications where NumberPlate in (Select NumberPlate from car where OwnCNIC in (Select OwnerCNIC from carowner where email = ?))';
    
    mysqlConnection.query(sql,[emailID],(err, results) => {
        console.log(results);
        if(err) throw err;
        else{

            var carD = Object.values(JSON.parse(JSON.stringify(results)));
            mysqlConnection.query(sqlCarSpecify,[emailID],(err,result)=>{
                if(err) throw err;
                else{
                    var carsp = Object.values(JSON.parse(JSON.stringify(result)));
                    res.render('seeMyCars',{results: carD,result: carsp});
                }
            });
            
        }
            
        });
          
});

app.get('/ownerhistory',(req,res)=>{

    var sql = 'Select * from ownerhistory where CNIC in (Select OwnerCNIC from carowner where email = ?)';
    mysqlConnection.query(sql,[emailID],(err, results) => {
        var carPath;
        if(err) throw err;
        else{
            var result= Object.values(JSON.parse(JSON.stringify(results)));            
            res.render('ownerHistory',{result});
        }        
    });
          
});

app.get('/newentry',(req,res)=>{

    var sql = 'Select * from car where Status = "Released" AND OwnCNIC in (Select OwnerCNIC from carowner where email = ?) ';

    mysqlConnection.query(sql,[emailID],(err, results) => {
        if(err) throw err;
        else{
            var carD = Object.values(JSON.parse(JSON.stringify(results)));
            res.render('newEntry',{result:carD});
        }
           
            
        });
          
});
app.get('/postedcars',(req,res)=>{

        var sql = 'Select NumberPlate, ModelName, MakeName, ManufacturingYear, carData from car where Status = "Active" and OwnCNIC in (Select OwnerCNIC from carowner where email = ?)';
        var sqlCarSpecify = 'Select BodyType from carspecifications where NumberPlate in (Select NumberPlate from car where Status = "Active" and OwnCNIC in (Select OwnerCNIC from carowner where email = ?))';
        var sqlEntry = 'Select * from newentrybyowner where numPlate in (Select NumberPlate from car where Status = "Active" and OwnCNIC in (Select OwnerCNIC from carowner where email = ?))';
        
        mysqlConnection.query(sql,[emailID],(err, results) => {
            console.log(results);
            if(err) throw err;
            else{
                var carD = Object.values(JSON.parse(JSON.stringify(results)));
                mysqlConnection.query(sqlCarSpecify,[emailID],(err,result)=>{
                    if(err) throw err;
                    else{
                        var carsp = Object.values(JSON.parse(JSON.stringify(result)));
                        mysqlConnection.query(sqlEntry,[emailID],(err,data)=>{
                            if(err) throw err;
                            else{
                                var caren = Object.values(JSON.parse(JSON.stringify(data)));
                                res.render('postedCars',{results: carD, result: carsp, carEntry: caren});
                            }
                            
                        });               
                    }
            });        
        }            
    });
});


app.post('/carform', (req,res)=>{
    let sql = "Select OwnerCNIC from carowner where email = ?";
    mysqlConnection.query(sql,[emailID],(err,results)=>{
        

        var resultArray = Object.values(JSON.parse(JSON.stringify(results)));
        console.log("Results of carform");
        console.log(resultArray);

        var np = req.body.NumberPlate;

        if(err)    throw err;
        else{    
            let dataCar = {NumberPlate: req.body.NumberPlate,
                            ModelName: req.body.Model,
                            MakeName: req.body.Make,
                            ManufacturingYear: req.body.Year,
                            Status: 'Released',
                            OwnCNIC: resultArray[0]['OwnerCNIC']
                        };
                        console.log(dataCar);  

            let dataCarSpecifications = {
                NumberPlate: req.body.NumberPlate,
                BodyType: req.body.BodyType,
                Seats: req.body.totalseats,
                AC: req.body.AC,
                WirelessTech: req.body.wirelessTech,
                EngineCapacity: req.body.enginecap,
                Fuel: req.body.fuel,
                Transmission: req.body.transmission,
            };
            console.log(dataCarSpecifications);
            if(err)
            {
                alert("This number plate is already in use!");
            }
            else
            {
                mysqlConnection.query("Insert into Car set ?",[dataCar],(err,rows)=>{
                   if(err) throw err;     

                   if (!req.files) 
                    {
                        res.send("No file upload");    	     
                    }
                    else 
                    {
                        var file = req.files.image; // here 'image' in Home.ejs form input name
                       
                        // var imgsrc = 'http://127.0.0.1:3000/uploads/' + Date.now() + file.name;
                        var daten = Date.now();
                        var newPath = 'uploads/' + daten + file.name;
                        if (file.mimetype == "image/jpeg" || file.mimetype == "image/png" || file.mimetype == "image/gif"||file.mimetype == "image/jfif")
                        {
                            var insertData = "Update car set carData = ? where NumberPlate = ?";
                            mysqlConnection.query(insertData, [newPath,np], (err, result) => {
                                if (err) throw err;
                                file.mv('views/uploads/' + daten + file.name);
                            });
                        }
                    }
                });
                mysqlConnection.query("Insert into carspecifications set ?", [dataCarSpecifications],(err,rows)=>{
                    if(err) throw err;   
                    
                });
            }
        }    
    });
    res.redirect('/homepage');
    res.end();
});


app.post('/newentry',(req,res)=>{


    var sql = 'Select OwnCNIC from car where OwnCNIC in (Select OwnerCNIC from carowner where email = ?)';
    mysqlConnection.query(sql,[emailID],(err, data) => {
        if(err) throw err;
        
        console.log(data);
        var resultArray = Object.values(JSON.parse(JSON.stringify(data)));
        console.log(resultArray);      

        var np = req.body.cars;
        var answer;
        mysqlConnection.query("Select BodyType from carspecifications where NumberPlate = ?",[np],(err, ans)=>{
            answer = Object.values(JSON.parse(JSON.stringify(ans)));
        });
        var IssuanceDate = req.body.dropcar;
         var ReturnDate =  req.body.returnCar;
        let datas ={
                        numPlate: req.body.cars,
                        IssuanceDate: req.body.dropcar,
                        ReturnDate: req.body.returnCar,
                        OCNIC: resultArray[0]['OwnCNIC']
                    };
        
        mysqlConnection.query("Insert into newentrybyowner set ?",[datas],(err, data)=>{
            if(err)
            {
                alert("Invalid Date Input! Please enter valid dates to proceed. Note that you can not choose today's date for renting the car. Also, you must rent your car atleast for 7 days.");
                    res.redirect('/newentry');
            }
            else
            {
                mysqlConnection.query('Update car set Status = "Active" where NumberPlate = ?',[np],(err)=>{
                    if (err) throw err;
                    else{
                        mysqlConnection.query("Update carowner set Status = 'Active' where OwnerCNIC = ?",[resultArray[0]['OwnCNIC']],(err,r)=>{
                            if(err) throw err;
                            else{
                                var store = 'call calculateOwnerAmount(?,?,?)';
                                var date1 = new Date(ReturnDate);
                                var date2 = new Date(IssuanceDate);
                                var diff = date1.getTime() - date2.getTime();
                                var di = Math.ceil(diff/ (1000 * 3600 * 24));
                                console.log(di);
                                mysqlConnection.query(store,[answer[0]['BodyType'],np, di],(err,resu)=>{
                                    if(err) throw err;
                                    else{

                                        var history = 'call insertInOwnerHistory(?,?,?,?)';
                                        mysqlconnection.query(history,[emailID,np,resultArray[0]['OwnCNIC'],IssuanceDate],(err,re)=>{
                                            if(err) throw err;
                                            else{
                                                mysqlConnection.query("Select AmountToBeGiven from newentrybyowner where numPlate = ?",[np],(err,a)=>{
                                                    if(err) throw err;
                                                    else{
                                                        var an = Object.values(JSON.parse(JSON.stringify(a)));
                                                        alert("Congratulations! You earn Rs. ",an[0]['AmountToBeGiven']," PKR!");
                                                        console.log("Your car has been posted for rent.");
                                                    }
                                                });
                                            }

                                        });
                                    }
                                });
                            }
                        });       
                    }    
                });

                res.render('HomePage');  
            }            
        });  
    }); 
});


app.get('/homepage',(req,res)=>{

    let sql = "SELECT *FROM carowner";
    mysqlconnection.query(sql,(err, results)=> {
        console.log("No");
        if(err)
            throw err;
        
            console.log(results.length);
            res.render('HomePage');
            

    res.end();
    });
});
5
app.get('/viewDetails',(req, res) => {
    var sql = 'Select * from carowner where email = ?';

    mysqlConnection.query(sql,[emailID],(err, data) => {
        if(err) throw err;
           
            console.log(data);
            res.render('viewDetails',{data:data});
        });
});

app.get('/edit',(req, res) => {
    var sql = 'Select * from carowner where email = ?';
    
    mysqlConnection.query(sql,[emailID],(err, result) => {
        if(err) throw err;
        else{
            var resultArray = Object.values(JSON.parse(JSON.stringify(result)));
            if(resultArray[0]['Status'] == "Released")
            {
                console.log(result);
                res.render('edit',{result: result});
            }
            else{
                alert("You can not edit any details until your car is in our garage.");
                res.render('HomePage');
            }
        }
           
    });
});

app.get('/delete',(req, res) => {
    var sql = 'Select * from carowner where email = ?';
    
    mysqlConnection.query(sql,[emailID],(err, result) => {
        if(err) throw err;
        else{
            var resultArray = Object.values(JSON.parse(JSON.stringify(result)));
            if(resultArray[0]['Status'] == "Released")
            {
                var deleteEntry = "Delete from newentrybyowner where OCNIC in (Select OwnerCNIC from carowner where email = ?)"; 
                mysqlConnection.query(deleteEntry,[emailID],(err)=>{
                    if(err) throw err;
                    else{
                        
                        var deleteCar = "Delete from car where OwnCNIC in (Select OwnerCNIC from carowner where email = ?)";
                        mysqlConnection.query(deleteCar, [emailID],(err)=>{

                        if(err) throw err; 
                        else{
                                var deleteOwner = "Delete from carowner where email = ?";
                                mysqlConnection.query(deleteOwner,[emailID],(err)=>{
                                    if(err) throw err;
                                    else{
                                        res.redirect('/');
                                    }
                                });
                           }
                        });
                    }
                });
            }
            else{
                alert("You can not delete your account until your car is in our garage.");
                res.redirect('/HomePage');
            }
        }    
    });
});

app.post('/edit',(req, res) => {
   
    var checkPass = "Select Password from carowner where email = ?";
    mysqlConnection.query(checkPass,[emailID],(err,results)=>{
        console.log(results);

        var ans = Object.values(JSON.parse(JSON.stringify(results)));
        console.log(ans);

        if(req.body.password == ans[0]['Password'])
        {
            var editDetail = "Update carowner set OwnerFullName = ?, phoneNumber = ?, Address = ?, Password = ? where email = ?";
            mysqlConnection.query(editDetail,[req.body.username,req.body.phonenumber,req.body.address,req.body.newpassword,emailID],(err,result)=>{
                if(err) throw err;
                else{
                    alert("Successfully updated your details");
                    res.render('HomePage');
                }
            });
        }
        else 
        {
            alert("You have entered incorrect password.");
            res.render('edit');
        }
    });
     
});

app.get('/deletecar/:NumberPlate',(req, res) => {
    
    var npl = req.params['NumberPlate'];
    console.log(npl);
    console.log(req.params['NumberPlate']);

    var carstatus = "Select * from car where NumberPlate = ?";
    mysqlConnection.query(carstatus,[req.params['NumberPlate']],(err, result) => {
        if(err) throw err;
        else{
            var jawab = Object.values(JSON.parse(JSON.stringify(result)));
            if(jawab[0]['Status'] == "Released")
            {
                var deleteCar = "Delete from carspecifications where NumberPlate = ?";
                mysqlConnection.query(deleteCar,[req.params['NumberPlate']],(err, result) => {
                    if(err) throw err;
                    else{
                        var carHistory = "Delete from ownerhistory where nPlate = ?";
                        mysqlConnection.query(carHistory,[req.params['NumberPlate']],(err, result) => {
                            if(err) throw err;
                            else{
                                var deleteCarspe = "Delete from car where NumberPlate = ?";
                                mysqlConnection.query(deleteCarspe,[req.params['NumberPlate']],(err, result) => {
                                    if(err) throw err;
                                    else{
                                        alert("Car deleted Successfully");
                                        console.log("Car deleted");
                                    }
                                });
                            }
                        });

                    }
                });
            }

            else{
                alert("You can not delete this car until its in our garage.");
               
            }
        }    
    });

    res.redirect('/homepage');

});

// Owner - Ends
