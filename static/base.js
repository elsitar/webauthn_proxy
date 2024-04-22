let errorMessage = message => {
    $('#errorMessages').text(message);
    $('#successMessages').text('');
};

let successMessage = message => {
    $('#errorMessages').text('');
    $('#successMessages').text(message);
};

let preformattedMessage = message => {
    $('#preformattedMessages').text(message);
};

let browserCheck = () => {
    if (!window.PublicKeyCredential) {
        errorMessage('This browser does not support WebAuthn :(');
        return false;
    }

    return true;
};

// base64url > base64 > Uint8Array > ArrayBuffer
let bufferDecode = value => Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0))
    .buffer;

// ArrayBuffer > Uint8Array > base64 > base64url
let bufferEncode = value => btoa(String.fromCharCode.apply(null, new Uint8Array(value)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
