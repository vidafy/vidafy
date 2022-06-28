
var gpgErrorMapper = {

    GetUserFriendlyMsg: function (originalMsg) {
        var msg = originalMsg;

        try {
            if (msg == 'Could not tokenize invalid card number.') {
                msg = 'Invalid Card Number'
            }
            else if (msg == 'Error during script load.') {
                msg = 'Card processor error';
            }
            else if (msg.startsWith('Tokenization Error: ')) {
                msg = msg.replace('Tokenization Error: ', '');
            }
            else if (msg.startsWith('Init Error: ')) {
                msg = msg.replace('Init Error: ', 'Card processor error: ');
            }
            else if (msg.startsWith('Key Pair Error: ')) {
                msg = msg.replace('Key Pair Error: ', 'Card processor error: ');
            }
        }
        catch (err) {
            msg = "Error: please try again";
        }

        return msg;
    }

};