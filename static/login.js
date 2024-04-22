let formatFinishLoginParams = assertion => JSON.stringify({
    id: assertion.id,
    rawId: bufferEncode(assertion.rawId),
    type: assertion.type,
    response: {
        authenticatorData: bufferEncode(assertion.response.authenticatorData),
        clientDataJSON: bufferEncode(assertion.response.clientDataJSON),
        signature: bufferEncode(assertion.response.signature),
        userHandle: bufferEncode(assertion.response.userHandle),
    }
});

let authenticateUser = () => {
    let username = $('#username').val();
    if (username === '') {
        errorMessage('Please enter a valid username');
        return;
    }

    $.get(
        '/webauthn/login/get_credential_request_options?username=' + encodeURIComponent(username),
        null,
        data => data,
        'json')
        .then(credRequestOptions => {
            credRequestOptions.publicKey.challenge = bufferDecode(credRequestOptions.publicKey.challenge);
            credRequestOptions.publicKey.allowCredentials.forEach(listItem => {
              listItem.id = bufferDecode(listItem.id)
            });

            return navigator.credentials.get({
              publicKey: credRequestOptions.publicKey
            });
        })
        .then(assertion => $.post(
            '/webauthn/login/process_login_assertion?username=' + encodeURIComponent(username),
            formatFinishLoginParams(assertion),
            data => data,
            'json'))
        .then(success => {
            successMessage(success.Message);
            window.location.reload();
        })
        .catch(error => {
            if(error.hasOwnProperty("responseJSON")){
                errorMessage(error.responseJSON.Message);
            } else {
                errorMessage(error);
            }
        });
};

const registerLinkClick = (defaultUsername) => {
    let uri = "/webauthn/register";
    if (defaultUsername) {
        uri = uri + `?default_username=${defaultUsername}`;
    }
    window.location.href = uri;
};

$(document).ready(() => {
    if (browserCheck()) {
        $('#username').keyup(function(e) {
            if ($("#username").is(":focus") && event.key == "Enter") {
                authenticateUser();
            }
        });
        $('#loginButton').click(authenticateUser);

        // Prepopulate the username field if specified
        let queryString = window.location.search;
        let urlParams = new URLSearchParams(queryString);
        let username = null;
        if (urlParams.has('default_username')) {
            username = urlParams.get('default_username');
        } else {
            let cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                let parts = cookies[i].split('=');
                if (parts[0].trim() === "webauthn-proxy-username") {
                    username = decodeURIComponent(parts[1]);
                    break;
                }
            }
            // From the future: the below code works only in Chrome.
            // let cookie = cookieStore.get("webauthn-proxy-username");
            // const cookieValue = () => {
            //     cookie.then((a) => {
            //         $('#username').val(a.value);
            //         $('#registerLink').click(registerLinkClick.bind(registerLinkClick, a.value));
            //     })
            //     .catch(error => {})
            // };
            // cookieValue();
        }

        // Set focus and value to the username field
        $('#username').focus();
        $('#username').val(username);
        if(username !== null){
            authenticateUser()
        }

        // Click handler for the "register" link
        // $('#registerLink').click(registerLinkClick.bind(registerLinkClick, username));
    }
});