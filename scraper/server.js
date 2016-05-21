var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var Firebase = require("firebase");
var nodemailer = require('nodemailer');
var deps = [];
var depts = [];

var myFirebaseRef = new Firebase("https://urcouresniper.firebaseio.com/");

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport('smtps://sigmachigp@gmail.com:OhTheLuster@smtp.gmail.com');




/*Get all departments*/
var burl = 'https://cdcs.ur.rochester.edu';

request(burl, function(error, response, html){
    if(!error){
        var $ = cheerio.load(html, {
            normalizeWhitespace: true
        });
        $('#ddlDept').children().each(function(i, elm){
            if(typeof($(this).next().attr('value')) != 'undefined')
                depts.push($(this).next().attr('value')); 
        });
//        populateClasses();
    }
});



function populateClasses(){
    var json = {};
    var count = 0;
    depts.forEach(function(dp){
        url = 'https://cdcs.ur.rochester.edu/Query.aspx?id=DARS&dept='+dp+'&term=20171';
        request(url, function(error, response, html){
        if(!error){
            var $ = cheerio.load(html, {
                normalizeWhitespace: true
            });

        $('td.repeaterCourse').each(function(i, element){
            if(i%5==0){
                console.log(i);
                var a = $(this).parent().children();
                var crn = a.eq(0).text().trim();
                var cname = a.eq(1).text().trim();
                var ctitle = a.eq(2).text().trim();
                var term = a.eq(3).text().trim();
                var credits = a.eq(4).text().trim();
                var status = a.eq(5).text().trim();
                var course = {};
                course.name = cname;
                course.title = ctitle;
                course.term = term;
                course.credits = credits;
                course.status = status;
                myFirebaseRef.child('classes/' + crn).update(course);
                json[crn] = course;
            }
        });   
        count++;
        if(count == deps.length){
            fs.writeFile('objects.json', JSON.stringify(json, null, 4), function(err){
                    console.log('Class information has been saved to objects.json');
            });
        }
    }
    }) ; 
    });
};


//
//app.get('/scrape', function(req, res){
    /*Load all the courses to be scanned*/
//    myFirebaseRef.child("tracked").on("value", function(snapshot) {
//        deps = [];
//        snapshot.forEach(function(child){
//            deps.push(child.key());
//            if(child.val()['status'] == "Open"){
//                console.log(child.key() + " is open");
//                console.log(child.val()['users']);
//            }
//        });
//        
//        performScrape();
//    });
    
console.log('Welcome to My Console,');
function beginScraper()
{
   performScrape();
   setTimeout(beginScraper, 10000);
}

beginScraper();
    

function performScrape(){
    deps = [];
    myFirebaseRef.child("tracked").once("value", function(snapshot) {
        snapshot.forEach(function(child){
            deps.push(child.key());
        });
        console.log('Starting scrape');
        console.log(deps);
        var json = {};
        var count = 0;

        deps.forEach(function(dp){
            console.log("Scraping " + dp);
            url = 'https://cdcs.ur.rochester.edu/Query.aspx?id=DARS&CRN='+dp+'&term=20171';
            request(url, function(error, response, html){
            if(!error){
                var $ = cheerio.load(html, {
                    normalizeWhitespace: true
                });

            $('td.repeaterCourse').each(function(i, element){
                if(i==0){
                    var a = $(this).parent().children();
                    var crn = a.eq(0).text().trim();
                    var cname = a.eq(1).text().trim();
                    var ctitle = a.eq(2).text().trim();
                    var term = a.eq(3).text().trim();
                    var credits = a.eq(4).text().trim();
                    var status = a.eq(5).text().trim();
                    var course = {};
                    course.name = cname;
                    course.title = ctitle;
                    course.term = term;
                    course.credits = credits;
                    course.status = status;
                    if(status == 'Open'){
                        console.log(crn + ' is open');
                        myFirebaseRef.child('tracked/'+crn + '/users').once("value", function(snap){
                            snap.forEach(function(user){
                                sendEmail(user.val(), crn, course);
                            });
                            myFirebaseRef.child('tracked/'+crn).remove();
                        });
                        //Send email
                    }else{
                        myFirebaseRef.child('tracked/'+crn + '/users').on
                        console.log('updating ' + crn);
                        myFirebaseRef.child('tracked/' + crn).update(course);
                        //Nprmal data check
                    }
                    json[crn] = course;
                }
            });   
//            count++;
//            if(count == deps.length){
//                fs.writeFile('objects.json', JSON.stringify(json, null, 4), function(err){
//                        console.log('Class information has been saved to objects.json');
//                });
//            }
        }
        }) ; 
        });
    });
}


function sendEmail(recipient, crn, course){
    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: '"UR Course Alert" <sigmachigp@gmail.com>', // sender address
        to: recipient, // list of receivers
        subject: 'Course ' + crn + ' has openned!', // Subject line
        text: 'Course ' + crn + ' has openned!', // plaintext body
        html: 'The class <b>' + course.name + '</b> is open <br>' + course.title +' for ' + course.term// html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);
    });
};

function sendConfirm(recipient, crn, course){
    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: '"UR Course Alert" <sigmachigp@gmail.com>', // sender address
        to: recipient, // list of receivers
        subject: 'Tracking ' + crn, // Subject line
        text: 'Course ' + crn + ' has openned!', // plaintext body
        html: 'The class <b>' + course.name + '</b> is now being tracked <br>' + course.title +' for ' + course.term + '<br>The current status is: '  + course.status// html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);
    });
};
// To write to the system we will use the built in 'fs' library.
// In this example we will pass 3 parameters to the writeFile function
// Parameter 1 :  output.json - this is what the created filename will be called
// Parameter 2 :  JSON.stringify(json, null, 4) - the data to write, here we do an extra step by calling JSON.stringify to make our JSON easier to read
// Parameter 3 :  callback function - a callback function to let us know the status of our function


// Finally, we'll just send out a message to the browser reminding you that this app does not have a UI.
//})
//
//app.listen('8081');
//console.log('Magic happens on port 8081');
//exports = module.exports = app;