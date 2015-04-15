Router.configure({
  layoutTemplate: 'appLayout'
});

Router.route('/', function() {
  this.render('Home');
});
