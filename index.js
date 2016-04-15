
var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var app = express()

var nickName = ""


app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

app.post('/webhook/', function (req, res) {
    messaging_events = req.body.entry[0].messaging
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i]
        sender = event.sender.id
        if (event.message && event.message.text) {
            text = event.message.text
            if (text === 'Generic') {
                sendGenericMessage(sender)
                continue
            }
            var greetings = ["hi", "hello", "Hi", "Hello", "hey", "Hey", "sup", "Sup"]
            if (greetings.indexOf(text) > -1) {
                //sendTextMessage(sender, 'Hello')
                if (nickName !== "") {
                    sendTextMessage(sender, "Hi " + nickName)
                } else {
                    getName(sender, false)
                }
                continue
            }
            if (text === "change nickname") {
                nickName = ""
                getName(sender, true)
                continue
            }
            sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200))
        }
        if (event.postback) {
            text = JSON.stringify(event.postback)
            textJSON = JSON.parse(text)

            sendTextMessage(sender, "OK, I will call you " + textJSON.payload)
            nickName = textJSON.payload
            //sendTextMessage(sender, "Postback received: " + text.substring(0, 200), token)
            continue
        }
    }
    res.sendStatus(200)
})

var token = "CAAQerijGFZCABAO7K5dKeeN9ty24jXnviQ5tYnvVNQaBE2giXqkDajk65ECzRBTZAW0wTEDrbejFwlHNw8cTYG0P2Yh8O21FeUycYCSZAG4KHpMKFplbG6y9FYrQzHzz0SEpZABZCRwouQulaar3rjdzxIul8U8OYMnof7kdyn44aRMDlkT589wgdz3dCqgcZD"

function getName(sender, change) {
    messageData = {}
    request({
        url: 'https://graph.facebook.com/v2.6/' + sender + '?fields=first_name,last_name,profile_pic&access_token=' + token,
        qs: {access_token:token},
        method: 'GET',
        json: {}
    }, function(error, response, body) {
        if (error) {
            console.log('Error getting profile: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        } else {
            if (change) {
                sendTextMessage(sender, "Ok, what would you like to change it to?")
                chooseName(sender, body.first_name, body.last_name)
            } else {
                sendTextMessage(sender, "Hello, " + body.first_name + ". Or should I call you Mr. or Mrs. " + body.last_name + "?")
                chooseName(sender, body.first_name, body.last_name)
            }
        }
    })

}

function sendTextMessage(sender, text) {
    messageData = {
        text:text
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

function chooseName(sender, first, last) {
    messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": " ",
                "buttons": [
                    {
                        "type": "postback",
                        "title": first,
                        "payload": "Campion"
                    }, {
                        "type": "postback",
                        "title": "Mr. " + last,
                        "payload": "Mr. Fellin"
                    }, {
                        "type": "postback",
                        "title": "Mrs. " + last,
                        "payload": "Mrs. Fellin"
                    }
                ]
            }

        }
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })


}

function sendGenericMessage(sender) {
    messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "First card",
                    "subtitle": "Element #1 of an hscroll",
                    "image_url": "http://messengerdemo.parseapp.com/img/rift.png",
                    "buttons": [{
                        "type": "web_url",
                        "url": "https://www.messenger.com",
                        "title": "web url"
                    }, {
                        "type": "postback",
                        "title": "Postback",
                        "payload": "Payload for first element in a generic bubble",
                    }],
                }, {
                    "title": "Second card",
                    "subtitle": "Element #2 of an hscroll",
                    "image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
                    "buttons": [{
                        "type": "postback",
                        "title": "Postback",
                        "payload": "Payload for second element in a generic bubble",
                    }],
                }]
            }
        }
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})


