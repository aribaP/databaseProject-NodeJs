mysqlConnection.query("Select AmountToBeGiven from newentrybyowner where numPlate = ?",[np],(err,a)=>{
                                                    if(err) throw err;
                                                    else{
                                                        var an = Object.values(JSON.parse(JSON.stringify(a)));
                                                        alert("Congratulations! You earn Rs. ",an[0]['AmountToBeGiven']," PKR!");
                                                        console.log("Your car has been posted for rent.");
                                                    }
                                                });