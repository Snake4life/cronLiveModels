var cron = require('cron'),
	Firebase = require('firebase'),
	_ = require('lodash'),
	modelsUrlTpl = _.template('https://freelivechat.firebaseio.com/models/<%=source%>'),
	modelUrlTpl = _.template('https://freelivechat.firebaseio.com/models/<%=username%>'),
	oboe = require('oboe'),
	async = require('async');
	//later = require('later');

const bongaCashApiUrl = 'http://tools.bongacams.com/promo.php?c=301528&type=api&api_type=json';
const chaturbateApiUrl = 'http://chaturbate.com/affiliates/api/onlinerooms/?format=json&wm=eqdcq';

function Model(username, displayName, age, gender, imageProfile, num_users, roomSubject, iframeUrl, source) {
	this.username = username;
	this.displayName = displayName;
	this.age = age;
	this.gender = gender;
	this.imageProfile = imageProfile;
	this.num_users = num_users;
	this.roomSubject = roomSubject;
	this.iframeUrl = iframeUrl;
	this.source = source;
}

function requestModels() {
	async.race([
		function (cb1) {
			oboe({url: chaturbateApiUrl})
				.node('{username num_users}', function (obj) {
					var src = obj.iframe_embed_revshare.match(/src\=\'(.*)\' height/);
					src = (src) ? src[1] : obj.chat_room_url_revshare;
					var model = new Model(obj.username, obj.display_name, obj.age, obj.gender, obj.image_url_360x270, obj.num_users, obj.room_subject, src, 'CHATURBATE');
					/*var modelRef = new Firebase(modelUrlTpl({username : model.username}));
					modelRef.set(model);*/
					return model;
				})
				.done(function (things) {
					var modelsRef = new Firebase(modelsUrlTpl({source : 'CHATURBATE'}))
					modelsRef.push(things);
					cb1(null, things.length);
				})
		},
		function (cb2) {
			oboe({url : bongaCashApiUrl})
				.node('{username members_count}', function (obj) {
					var _gender = 't';
					if (obj.gender === 'Female') _gender = 'f';
					if (obj.gender === 'Male') _gender = 'm';
					if (obj.gender.indexOf('Couple') > -1) _gender = 'c';
					var model = new Model(obj.username, obj.display_name,obj.display_age, _gender, obj.profile_images.thumbnail_image_big_live, obj.members_count,   obj.turns_on, obj.embed_chat_url, 'BONGACASH');
					/*var modelRef = new Firebase(modelUrlTpl({username : model.username}));
					modelRef.set(model);*/
					return model;
				})
				.done(function (things) {
					var modelsRef = new Firebase(modelsUrlTpl({source : 'BONGACASH'}))
					modelsRef.push(things);
					cb2(null, things.length);
				})
		}
	], function (err, result) {
		console.log(new Date().toString(), result);
	})
}

console.log('Cron start import live model...');
var _2minutes = 1000*60*2;

setInterval(function(){
	requestModels();
},_2minutes);