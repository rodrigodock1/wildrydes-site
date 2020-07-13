/*global WildRydes _config*/

var WildRydes = window.WildRydes || {};
WildRydes.map = WildRydes.map || {};

(function rideScopeWrapper($) {
    var authToken;
    WildRydes.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
        } else {
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        alert(error);
        window.location.href = '/signin.html';
    });
    function requestUnicorn(pickupLocation) {
        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/ride',
            headers: {
                Authorization: authToken
            },
            data: JSON.stringify({
                PickupLocation: {
                    Latitude: pickupLocation.latitude,
                    Longitude: pickupLocation.longitude
                }
            }),
            contentType: 'application/json',
            success: completeRequest,
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occured when requesting your unicorn:\n' + jqXHR.responseText);
            }
        });
    }
    function again(pickupLocation) {
        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/ride',
            headers: {
                Authorization: authToken
            },
            data: JSON.stringify({
                PickupLocation: {
                    Latitude: pickupLocation.latitude,
                    Longitude: pickupLocation.longitude
                }
            }),
            contentType: 'application/json',
            success: secondRequest,
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occured when requesting your unicorn:\n' + jqXHR.responseText);
            }
        });
    }
    
    function secondRequest(result) {
        var unicorn;
        var pronoun;
        console.log('Response received from API: ', result);
        unicorn = result.Unicorn;
        features = result.Conditions;
        pronoun = unicorn.Gender === 'Male' ? 'his' : 'her';
        animateArrival(function animateCallback() {
            $('#request').prop('disabled', 'disabled');
            $('#request').text('Set Pickup');
        });
    }

    function completeRequest(result) {
        var unicorn;
        var pronoun;
        console.log('Response received from API: ', result);
        unicorn = result.Unicorn;
        features = result.Conditions;
        pronoun = unicorn.Gender === 'Male' ? 'his' : 'her';
        if (features.BannedCountry === 'forbid') {
            displayUpdateAlerts('Banned Country:' + features.Country);
           displayUpdate('You had been to ' + features.Country + ', and this is a forbiden place, so we wont be able to reach you this time!');
        } else {
            if (features.Overload === 'true') {
                displayUpdateAlerts('You have been to places too warm for the Unicorns in the past');
            } else {
                displayUpdate(unicorn.Name + ', your ' + unicorn.Color + ' unicorn, is ' + pronoun + ' on its way.');
                displayUpdateAlerts('We know you had been in : ' + features.Country + ' that is a great country!');
                displayUpdateAlerts('Your price will be: ' + features.Price);
                displayUpdateAlerts('You had already spent on average with us: ' + features.AveragePrice);
                sessionStorage.clear();
                
                animateArrival(function animateCallback() {
                    displayUpdate(unicorn.Name + ' has arrived!!');
                    WildRydes.map.unsetLocation();
                    $('#request').prop('disabled', 'disabled');
                    $('#request').text('Set Pickup');
                });
            }
        }
        
    }

    // Register click handler for #request button
    // Inicia la función al presionar el boton
    $(function onDocReady() {
        $('#request').click(handleRequestClick);
        $('#signOut').click(function() {
            WildRydes.signOut();
            alert("You have been signed out.");
            window.location = "signin.html";
        });
        $(WildRydes.map).on('pickupChange', handlePickupChanged);

        WildRydes.authToken.then(function updateAuthMessage(token) {
            if (token) {
                displayUpdate('You are authenticated. Click to see your <a href="#authTokenModal" data-toggle="modal">auth token</a>.');
                $('.authToken').text(token);
            }
        });

        if (!_config.api.invokeUrl) {
            $('#noApiMessage').show();
        }
    });

    function handlePickupChanged() {
        var requestButton = $('#request');
        requestButton.text('Request Unicorn');
        requestButton.prop('disabled', false);
    }
//Selecciona el punto en el mapa
    function handleRequestClick(event) {
        var pickupLocation = WildRydes.map.selectedPoint;
        event.preventDefault();
        requestUnicorn(pickupLocation);
    }

    function animateArrival(callback) {
        var dest = WildRydes.map.selectedPoint;
        var origin = {};

        if (dest.latitude > WildRydes.map.center.latitude) {
            origin.latitude = WildRydes.map.extent.minLat;
        } else {
            origin.latitude = WildRydes.map.extent.maxLat;
        }

        if (dest.longitude > WildRydes.map.center.longitude) {
            origin.longitude = WildRydes.map.extent.minLng;
        } else {
            origin.longitude = WildRydes.map.extent.maxLng;
        }

        WildRydes.map.animate(origin, dest, callback);
    }

    function displayUpdate(text) {
        $('#updates').append($('<li>' + text + '</li>'));
    }
    function displayUpdateAlerts(text) {
        $('#updates-alerts').append($('<li>' + text + '</li>'));
    }
    function displayUpdateWarning(text) {
        $('#updates-alerts').append($('<li>' + text + '</li>'));
    }
}(jQuery));
