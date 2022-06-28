var $form = $('#payment-form');
$form.find('.pay').prop('disabled', true);


// initalize the hosted iframes using the SDK setup function
paysafe.fields.setup(apiKey, options, function (instance, error) {

    if (error) {
        console.log(error);
    } else {

        var payButton = $form.find('.pay');

        console.log(payButton);

        instance.fields("cvv cardNumber expiryDate").valid(function (eventInstance, event) {
            $(event.target.containerElement).closest('.form-control').removeClass('error').addClass('success');

            if (paymentFormReady()) {
                $form.find('.pay').prop('disabled', false);
            }
        });

        instance.fields("cvv cardNumber expiryDate").invalid(function (eventInstance, event) {
            $(event.target.containerElement).closest('.form-control').removeClass('success').addClass('error');
            if (!paymentFormReady()) {
                $form.find('.pay').prop('disabled', true);
            }
        });

        instance.fields.cardNumber.on("FieldValueChange", function (instance, event) {
            //console.log(instance.fields.cardNumber);

            if (!instance.fields.cardNumber.isEmpty()) {
                var cardBrand = instance.getCardBrand().replace(/\s+/g, '');

                switch (cardBrand) {
                    case "AmericanExpress":
                        $form.find($(".fa")).removeClass('fa-credit-card').addClass('fa-cc-amex');
                        break;
                    case "MasterCard":
                        $form.find($(".fa")).removeClass('fa-credit-card').addClass('fa-cc-mastercard');
                        break;
                    case "Visa":
                        $form.find($(".fa")).removeClass('fa-credit-card').addClass('fa-cc-visa');
                        break;
                    case "Diners":
                        $form.find($(".fa")).removeClass('fa-credit-card').addClass('fa-cc-diners-club');
                        break;
                    case "JCB":
                        $form.find($(".fa")).removeClass('fa-credit-card').addClass('fa-cc-jcb');
                        break;
                    case "Maestro":
                        $form.find($(".fa")).removeClass('fa-credit-card').addClass('fa-cc-discover');
                        break;
                }
            }
            else {
                $form.find($(".fa")).removeClass().addClass('fa fa-credit-card');
            }
        });

        payButton.bind("click", function (event) {
            $form.find('.pay').prop('disabled', true);
            instance.tokenize({
                vault: {
                    holderName: $("#firstName").val() + " " + $("#lastName").val(),
                    billingAddress: {
                        country: "AU",
                        zip: $("#zip").val(),
                        //state: "AU-NSW",  // Australian states don't work in test
                        city: $("#city").val(),
                        street: $("#street").val(),
                        street2: ""
                    }
                }

            }, function (instance, error, result) {
                if (error) {
                    console.log(error);
                    $form.find('.pay').html('Try again').prop('disabled', false);
                    /* Show Paysafe errors on the form */
                    var errorMessage = error.detailedMessage;
                    if (errorMessage.indexOf("Invalid fields") !== -1) {
                        errorMessage = "Please check card credentials.";
                    }
                    $form.find('.payment-errors').text(errorMessage);
                    $form.find('.payment-errors').closest('.row').show();
                } else {
                    /* Visual feedback */
                    $form.find('.pay').html('Processing <i class="fa fa-spinner fa-pulse"></i>');
                    /* Hide Paysafe errors on the form */
                    $form.find('.payment-errors').closest('.row').hide();
                    $form.find('.payment-errors').text("");

                    // response contains token          
                    //console.log(result.token);

                    CreateProfile(apiKey, result.token);

                    // you would send the 'token' to your server here using AJAX. The delay function simulates this process.
                    delay(function () {
                        $form.find('.pay').html('Card saved <i class="fa fa-check"></i>');
                        $form.find('.pay').prop('disabled', true);
                        // do stuff like post to C# with my permanent token to save in the database

                    }, 2000);// end delay
                }
            });
        });
    }
});

paymentFormReady = function () {
    if ($form.find('#cardNumber').hasClass("success") &&
        $form.find('#cardExpiry').hasClass("success") &&
        $form.find('#cardCVC').hasClass("success")) {
        return true;
    } else {
        return false;
    }
}

var delay = (function () {
    var timer = 0;
    return function (callback, ms) {
        clearTimeout(timer);
        timer = setTimeout(callback, ms);
    };
})();

function SavePayment() {
    $.post('/Command/Merchants.AuthNet.GetNewPaymentProfile', { profileId: '@ViewBag.PayorId' }, function (r) {
        if (r.Status == 0) {
            window.parent.parent.parent.postMessage(data, "*");
        }
        else {
            alert(r.Message);
        }
    });
}

function GetCardTypeAud(initials) {
    // American Express
    if (initials == "AM") {
        return "AMEX";
    }
    // Discover
    if (initials == "DI") {
        return "Discover";
    }
    // Diners Club
    if (initials == "DC") {
        return "Diners";
    }
    // MasterCard
    if (initials == "MC") {
        return "Mastercard";
    }
    // Visa
    if (initials == "VI") {
        return "Visa";
    }
}

function SetApiKey(key) {
    apiKey = key;
}