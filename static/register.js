let formatFinishRegParams = cred => JSON.stringify({
    id: cred.id,
    rawId: bufferEncode(cred.rawId),
    type: cred.type,
    response: {
        attestationObject: bufferEncode(cred.response.attestationObject),
        clientDataJSON: bufferEncode(cred.response.clientDataJSON),
    },
});

let registerUser = () => {
    let username = $('#username').val();

    if (username === '') {
        errorMessage('Please enter a valid username');
	    return;
    }

	$.get(
        '/webauthn/register/get_credential_creation_options?username=' + encodeURIComponent(username),
        null,
        data => data,
        'json')
        .then(credCreateOptions => {
            credCreateOptions.publicKey.challenge = bufferDecode(credCreateOptions.publicKey.challenge);
            credCreateOptions.publicKey.user.id = bufferDecode(credCreateOptions.publicKey.user.id);
            if (credCreateOptions.publicKey.excludeCredentials) {
                for (cred of credCreateOptions.publicKey.excludeCredentials) {
                    cred.id = bufferDecode(cred.id);
                }
            }

            return navigator.credentials.create({
                publicKey: credCreateOptions.publicKey
            });
        })
        .then(cred => $.post(
            '/webauthn/register/process_registration_attestation?username=' + encodeURIComponent(username),
            formatFinishRegParams(cred),
            data => data,
            'json'))
        .then(success => {
            successMessage(success.Message);
            preformattedMessage(success.Data);
        })
        .catch(error => {
            if(error.hasOwnProperty("responseJSON")){
                errorMessage(error.responseJSON.Message);
            } else {
                errorMessage(error);
            }
        });
};

$(document).ready(() => {
    if (browserCheck()) {
        $('#username').keyup(function(e) {
            if ($("#username").is(":focus") && event.key == "Enter") {
                registerUser();
            }
        });
        $('#registerButton').click(registerUser);

        // Prepopulate the username field if specified
        let queryString = window.location.search;
        let urlParams = new URLSearchParams(queryString);
        if (urlParams.has('default_username')) {
            let username = urlParams.get('default_username');
            $('#username').val(username);
        }

        // Set up copy-to-clipboard button
        $('#copyButton').click(() => {
            var preformattedMessagesArea = $('#preformattedMessages');
            preformattedMessagesArea.select();
            navigator.clipboard.writeText(preformattedMessagesArea.val());

            // "Flash" it to indicate that the text was copied
            preformattedMessagesArea.fadeOut(200).fadeIn(200);
        });

        // Set focus to the username field
        $('#username').focus();
    }
});