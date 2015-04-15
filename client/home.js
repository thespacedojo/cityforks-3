Template.home.onCreated(function() {
  this.mapRendered = false;
  this.bottomLeft = new ReactiveVar;
  this.topRight = new ReactiveVar;
  this.markers = {};

  this.setBounds = function(bounds) {
    if (!bounds) {
      var bounds = this.map.getBounds();
    }
    if (bounds) {
      this.bottomLeft.set([bounds._southWest.lng, bounds._southWest.lat]);
      this.topRight.set([bounds._northEast.lng, bounds._northEast.lat]);
    }    
  };
  var template = this;
  template.autorun(function() {
    template.subscribe('nearbyPlaces', template.bottomLeft.get(), template.topRight.get());
  });
});

Template.home.onRendered(function() {
  var template = this;
  template.autorun(function() {
    if (Session.get('location')) {
      latitude = Session.get('location').coords.latitude;
      longitude = Session.get('location').coords.longitude;
      if (!template.mapRendered) {
        template.map = L.map('map').setView([latitude, longitude], 15);
        template.mapRendered = true;
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(template.map);
        template.setBounds();
        template.map.on('moveend', function(event) {
          bounds = event.target.getBounds();
          template.setBounds(bounds);
          coords = {latitude: event.target.getCenter().lat, longitude: event.target.getCenter().lng};
          Meteor.call('fetchNearbyLocations', coords);
        });
      }
    }
  });
});

Template.home.onRendered(function() {
  var template = this;
  Places.find().observeChanges({
    'added': function(id, place) {
      if (!template.markers[id]) {
        template.markers[id] = L.marker([place.geometry.location.lat, place.geometry.location.lng])
        template.map.addLayer(template.markers[id]);
        template.markers[id].bindPopup(Blaze.toHTMLWithData(Template.marker, place));
      }
    },
    'removed': function(id) {
      template.map.removeLayer(template.markers[id]);
      template.markers[id] = undefined;
    }
  });
});

Template.marker.helpers({
  priceLevel: function() {
    if (this.price_level)
      return Array(this.price_level + 1).join('$');
  },
  rating: function() {
    if (this.rating)
      return Spacebars.SafeString(this.rating + " out of 5 <br />");
  }
});
