/*(c)2016-ProPay*/

/* *ProPay provides the following code “AS IS.”

*ProPay makes no warranties and ProPay disclaims all warranties and conditions, express, implied or statutory,

including without limitation the implied warranties of title, non-infringement, merchantability, and fitness for a

particular purpose.

*ProPay does not warrant that the code will be uninterrupted or error free,

nor does ProPay make any warranty as to the performance or any results that may be obtained by use of the code.

*/

/*================================================================================================================================

This JavaScript file includes methods to initiate a Hosted Payment Page transaction through SignalR on your checkout page.

Required Dependencies

-JQuery 1.6.4 or greater

-Microsoft SignalR 2.0.0 or greater

The following methods are defined that should be called by your checkout page:

- hpp_Load(iFrameId, baseUrl, hostedTransactionIdentifier, enableConsoleLogging)

*This method establishes the SignalR connection and loads the iFrame with the Hosted Payment Page

- signalR_SubmitForm()

*This function should be called by your "submit" button to submit the Hosted Payment Page to ProtectPay(r)

================================================================================================================================*/

/*================================================================================================================================

*This file will invoke several methods to assist you in creating an optimal user experience the following Methods should be

declared

on the checkout page that references this file:

//This method is invoked when messages are sent from the hpp.js for development and debugging

function echoMessage(message){

//This method should only be used for development and debugging

//Messages are sent as HTML, for production you may remove all references to this method in the hpp.js

}

//This method is invoked if true is passed to HPP_Load. This method recieves the redirected console output of the SignalR

connection for development and debugging

displaySignalRLog(message){

//This method should only be used for development and debugging

//For production you will want to pass 'false' to the HPP_Load method

}

//This method is invoked when errors are thrown by the hpp.js.

function throwError(Error){

//This method is invoked on JavaScript errors and/or SignalR connectivity errors

//For production you should call a custom error handler and replace all references to this method in the hpp.js

}

//This method is invoked when the TimeoutTimer elapses

function formCommunicationTimeout(){

//This indicates a failure with the Hosted Payment Page communicating with the SignalR server

}

//This method is invoked when the Hosted Payment Page and the Checkout Page are connected and the Hosted Payment Page is ready for

submission

function formIsReadyToSubmit(){

//Do not allow the user to submit the Hosted Payment Page until this Method has been invoked

}

//This Method is invoked when the Hosted Payment Page contains invalid input on submission

function formWasInvalid(){

//This method is usually invoked when the user inputs invalid data.

}

//This Method is invoked when the Hosted Payment Page has an error on submission, a new HostedTransactionIdentifier should be

created

function formEncounteredAnError(){

//This method is usually invoked when an already used HostedTransactionIdentifier is used to display a Hosted Payment Page and

it is submitted

}

//This method is invoked when the Hosted Payment Page has been successfully submitted

function formSubmitSucceeded(){

//Use ProtectPay(r) API Method 4.7.3 'Get Hosted Transaction Results'

}

================================================================================================================================*/

/*================================================================================================================================

The following variable value should be modified to suit your business needs:

- var TimeoutInterval = 10000;

The following methods should be modified to suit your business needs:

//Browser Support

- fixMissingBrowserFunctionality()

//Error Detection and Handling

- window_OnError(errorMsg, url, lineNumber, column, errorObj)

//SignalR Connection Event Methods

- signalR_OnStarting(e, data)

- signalR_OnStateChanged(e, data)

- signalR_OnConnected(e, data)

- signalR_OnConnectionFailed(e, data)

- signalR_OnConnectionSlow(e, data)

- signalR_OnReconnecting(e, data)

- signalR_OnReconnect(e, data)

- signalR_OnDisconnect(e, data)

//Hosted Payment Page Response Methods

- signalR_OnFormWasInvalid()

- signalR_OnFormSubmitErrored()

- signalR_OnFormSubmitSucceeded()

The following methods should NOT be modified to prevent undesirable functionality



- hpp_Load(iFrameId, baseUrl, hostedTransactionIdentifier, enableConsoleLogging)

- signalR_SetupConnection()

- signalR_Connect()

- signalR_OnReceived(e, data)

- signalR_OnError(e, data)

- signalR_OnEstablished()

- signalR_OnIFrameLoaded()

- signalR_OnTimeout()

- signalR_OnPing(e, data)

- signalR_SubmitForm()

- getStateName(state)

- signalR_OnUnload()

- signalR_Disconnect()

- valueIsNumeric(value)

- valueIsValid(value)

================================================================================================================================*/

// This value sets the timeout period expressed as ms to recieve a 'Ping' request from the Hosted Payment Page through the SignalR Connection

var TimeoutInterval = 10000;

function fixMissingBrowserFunctionality() {
  // If 'String.trim()' is not defined (like on IE8), define it here
  if (typeof String.prototype.trim !== 'function') {
    String.prototype.trim = function () {
      return this.replace(/^\s+|\s+$/g, '');
    }
  }
  //Add additional Checks for Browsers you intend to support
}

// Invoked after a JavaScript error occurs on the page.

function window_OnError(errorMsg, url, lineNumber, column, errorObj) {
  throwError('Type: ' + errorObj);
  throwError('Message: ' + errorMsg);
  throwError('File: ' + url);
  throwError('Line Number: ' + lineNumber);
  throwError('Column: ' + column );
  return true;
}

// Invoked before anything is sent over the connection.

function signalR_OnStarting(e, data) {
  echoMessage('<b style="color: gold">Event: </b><span style="color: blue">Establishing SignalR Connection Capability</span>');
}

// Invoked when the connection state changes.

function signalR_OnStateChanged(e, data) {
  var oldState = getStateName(e.oldState);
  var newState = getStateName(e.newState);
  echoMessage('<b style="color: gold">Event: </b><span style="color: blue">SignalR Connection State Change - </span>Changing state from <b>' + oldState + '</b> to <b>' + newState + '</b>');
}

// Invoked when the 'start' method is called and succeeds in connecting to the server.

function signalR_OnConnected(e, data) {
  echoMessage('<b style="color: gold">Event: </b><b style="color: Green ">SignalR Connection Established</b>');
  // General Connection Stats
  var connectionProtocol = e.protocol;
  var connectedHost = e.host;
  var connectedHostResourceURI = e.appRelativeUrl;

  // SignalR Connection Stats
  var signalRConnectionState = getStateName(e.state);
  var signalRConnectionToken = e.token;
  var signalRConnectionId = e.id;

  // SignalR Transport Connection Stats
  var transportConnectionName = e.transport.name;
  var transportConnectionReconnectDelay = e.transport.reconnectDelay;
  var clientDisconnectTimeout = e.disconnectTimeout; // Here is the keep alive timout
  var logginEnabled = e.logging;

  var msg = '<br><b>Connection Attributes</b>' + '<br> <b>&nbsp; &#149; Connection Protocol:</b> ' + connectionProtocol
  + '<br> <b>&nbsp; &#149; Connected Host:</b> ' + connectedHost
  + '<br> <b>&nbsp; &#149; Connected Host Resource URI:</b> ' + connectedHostResourceURI
  + '<br> <b>&nbsp; &#149; SignalR Connection State:</b> ' + signalRConnectionState
  + '<br> <b>&nbsp; &#149; SignalR Connection ID:</b> ' + signalRConnectionId
  + '<br> <b>&nbsp; &#149; SignalR Connection Token:</b> ' + signalRConnectionToken
  + '<br> <b>&nbsp; &#149; SignalR Connection Timout:</b> '
  + '<br> <b>&nbsp; &#149; SignalR Connection Timeout Threshold:</b> '
  + '<br> <b>&nbsp; &#149; Transport Connection Name:</b> ' + transportConnectionName
  + '<br> <b>&nbsp; &#149; Transport Connection Reconnect Timout:</b> '
  + '<br> <b>&nbsp; &#149; Transport Connection Reconnect Threshold:</b> '
  + '<br> <b>&nbsp; &#149; Transport Connection Reconnect Delay:</b> ' + transportConnectionReconnectDelay + 'ms'
  + '<br> <b>&nbsp; &#149; Transport Connection Reconnect Threshold:</b> '
  + '<br> <b>&nbsp; &#149; Logging SignalR Events to Console:</b> ' + logginEnabled;

  echoMessage('<b style="color: gold">Event: </b><b style="color: Green ">Connection Attributes</b>' + msg);
}

// Invoked when the Connection.Start() method is called but fails to connect to the SignalR server.
function signalR_OnConnectionFailed(e, data) {
  if (valueIsValid(e) == true) {
    throwError('Failed to connect to the server: ' + e.message)
    throwError('Stack: ' + e.stack);
  }
  else{
    throwError('Failed to connect to the server - Unknown');
  }
}

// Invoked when the client detects a slow connection.
function signalR_OnConnectionSlow(e, data) {
  echoMessage('<b style="color: gold">Event: </b><span style="color: blue">Slow Connection Detected - </b>Keep Alive Timout % Threshold Exceeded');
}

// Invoked when the underlying transport begins reconnecting.
function signalR_OnReconnecting(e, data) {
  echoMessage('<b style="color: gold">Event: </b><span style="color: red">Connection Loss Threshold - </span>Connection Lost OR Keep Alive Timout Exceeded');
}

// Invoked when the underlying transport reconnects.
function signalR_OnReconnect(e, data) {
  echoMessage('<b style="color: gold">Event: </b><span style="color: green">Connection Re-established</span>');
}

// Invoked when the client disconnects.
function signalR_OnDisconnect(e, data) {
  echoMessage('<b style="color: gold">Event: </b><span style="color: red">SignalR Connection Disconnected</span>');
}

// This function is called when the server signalR issues a 'FormSubmitWasInvalid' message (indicating there was a problem validating the form data).
function signalR_OnFormWasInvalid() {
  echoMessage('<b style="color: gold">Event: </b><span style="color: red">Form Submitted failed Validation - </span>Calling<b>FormWasInvalid()</b>');
  formWasInvalid();
}

// This function is called when the server signalR issues a 'FormSubmitErrored' message (indicating an error occurred when the user submitted the form).
function signalR_OnFormSubmitErrored() {
  echoMessage('<b style="color: gold">Event: </b><span style="color: red">Form Submission Error - </span>Calling<b>FormEncounteredAnError()</b>');
  formEncounteredAnError();
}

// This function is called when the server signalR issues a 'FormSubmitSucceeded' message (indicating the form was submitted successfully).
function signalR_OnFormSubmitSucceeded() {
  echoMessage('<b style="color: gold">Event: </b><span style="color: Green">Form Submission Succeeded - </span>Calling<b>FormSubmitSucceeded()</b>');

  //Unload the iFrame
  document.getElementById(IFrameId).src = '';
  formSubmitSucceeded();
}

//============================================================================================

// The following functions and variables should NOT be modified, except to remove EchoMessage

//============================================================================================

//Local Variables
var IFrameUrl = '';
var IFrameId = '';

//Object Reference Variables
var Connection;
var signalR;
var TimeoutTimerId;

// This function is called to set up and initiate and validate the SignalR Connection, Load the Hosted Payment Page and verify communication into the iFrame

/*
*enableConsoleLogging will take the signalR console logging and redirect it to the displaySignalRLog(message) method.
To use this this option the displaySignalR(message) function must be present on the merchant checkout page.
*/

function hpp_Load(iFrameId, baseUrl, hostedTransactionIdentifier, enableLogging) {
  // Wire up the scripting error handler
  window.onerror = window_OnError;

  // Wire up the window unload event
  window.onbeforeunload = signalR_OnUnload;

  // Set local variables
  IFrameUrl = baseUrl + 'Home/' + hostedTransactionIdentifier;
  IFrameId = iFrameId;

  // Add missing javascript functionality based on browser
  fixMissingBrowserFunctionality();
  // Setup the connection to the server
  signalR_SetupConnection(baseUrl, hostedTransactionIdentifier, enableLogging);
  // Connect to the server

  signalR_Connect();
}

// This sets up the connection with the signalR on the server.
function signalR_SetupConnection(baseUrl, HID, EnableLogging) {
  // Create a reference to the signalR
  Connection = $.hubConnection();
  Connection.url = baseUrl + 'signalr';
  Connection.qs = { 'hid': HID, 'c': '0' };

  if(EnableLogging){
    $.connection.fn.log = function (message) {
      displaySignalRLog(message);
    }
  }

  // Get a reference to the signalR Proxy Connection
  signalR = Connection.createHubProxy('hostedTransaction');

  // Wire up all the SignalR events to local callback methods.
  Connection.starting(signalR_OnStarting);
  Connection.received(signalR_OnReceived);
  Connection.connectionSlow(signalR_OnConnectionSlow);
  Connection.reconnecting(signalR_OnReconnecting);
  Connection.reconnected(signalR_OnReconnect);
  Connection.stateChanged(signalR_OnStateChanged);
  Connection.disconnected(signalR_OnDisconnect);

  //Wire up all the SignalR Error Handler
  Connection.error(signalR_OnError);

  // Wire up the client-side function to receive calls from the server
  signalR.on('ping', signalR_OnPing);
  signalR.on('formSubmitSucceeded', signalR_OnFormSubmitSucceeded);
  signalR.on('formSubmitWasInvalid', signalR_OnFormWasInvalid);
  signalR.on('formSubmitErrored', signalR_OnFormSubmitErrored);
}

// This function starts the signalR and initialize the connection to the server signalR.
function signalR_Connect() {
  echoMessage('<b style="color: Green">Start: </b><span style="color: blue">Create SignalR Connection</span>');
  Connection.start({withCredentials: false}, signalR_OnEstablished).done(signalR_OnConnected).fail(signalR_OnConnectionFailed);
}

// Invoked after an error occurs with the connection.
function signalR_OnError(e, data) {
  var msg = e.message;

  if (valueIsValid(e) == true) {
    if (String(e).indexOf('Access is denied') != -1 && navigator.userAgent.indexOf('MSIE 10.0') != -1) {
      msg = e + ' (If you are using IE 10, try pressing F12 and switch the "Browser Mode" or "Document Mode" to "IE9")';
    } else {
      msg = e;
    }
  }

  throwError('SignalR Connection Error Message: ' + msg);
  throwError('Stack: ' + e.stack);
}

// Invoked when any data is received on the connection from the signalR server.
function signalR_OnReceived(e, data) {
  echoMessage('<b style="color: gold">Event: </b><span style="color: blue">SignalR Data Received</span><br> <b>&nbsp; &#149;Hub:</b> ' + e.H + '<br> <b>&nbsp; &#149; Method:</b> ' + e.M + '<br> <b>&nbsp; &#149; Callback Id:</b> ' + e.I);

  //Unload the iFrame on successful submission
  if(e.M == 'formSubmitSucceeded'){
    signalR_Disconnect();
  }
}

// Callback funrtion that is invoked on establishing a SignalR server connection this Loads the Hosted Payment Page into the specified iFrame
function signalR_OnEstablished() {
  echoMessage('<b style="color: gold">Event: </b><span style="color: blue">Loading Hosted Payment Page</span><br> <b>&nbsp;&#149; Hosted Payment Page URL:</b> <u>' + IFrameUrl + '</u><br> <b>&nbsp; &#149; iFrame ID:</b> ' + IFrameId);

  var iFrame = document.getElementById(IFrameId);
  if (iFrame) {
    iFrame.onload = signalR_OnIFrameLoaded;
    iFrame.src = IFrameUrl;
  }
  else {
    throwError('Unable to locate an iFrame with element ID: ' + iFrameId);
  }
}

// Invoked when the Hosted Payment Page in the specified iFrame has loaded.
// The Hosted Payment Page onLoad() Event sends a Ping Request through the SignalR Connection to this Page
// A Timeout is set for connection errors from the Hosted Payment Page to the SignalR Server
function signalR_OnIFrameLoaded() {
  echoMessage('<b style="color: Gold">Event: </b><span style="color: blue">Hosted Payment Page Form Loaded - </span>Waiting for Ping Request From Hosted Payment Page Through SignalR Server<br> <b>&nbsp; &#149</b>Setting Ping Request Timout Timer to:<b> ' + TimeoutInterval + "ms</b>" );

  TimeoutTimerId = window.setTimeout(signalR_OnTimeout, TimeoutInterval);
}

// This function is invoked when the timer times out This indicates the Hosted Payment Page failed to send a Ping Request through the SignalR Server Connection.
// This indicates a problem with the connection of the Hosted Payment Page to the SignalR Server
function signalR_OnTimeout() {
  echoMessage('<b style="color: gold">Event: </b><b style="color: red ">Disconnecting Connection to SignalR Server</b>');
  throwError('Failed to Receive Ping Request after: ' + TimeoutInterval + 'ms');
  signalR_Disconnect();
}

// This function is called when the SignalR server sends the 'Ping' message indicated the Hosted Payment Page is Connected to it.
function signalR_OnPing(e, data) {
  echoMessage('<b style="color: gold">Event: </b><span style="color: Blue">SignalR Server Ping Recieved - </span>Hosted Payment Page Connected to SignalR Server<br> <b>&nbsp; &#149</b>Sending Pong Response <br> <b>&nbsp; &#149</b>Stopping Ping Request Timout Timer');

  if (TimeoutTimerId && valueIsNumeric(TimeoutTimerId) == true) {
    window.clearTimeout(TimeoutTimerId);
    TimeoutTimerId = undefined;
  }

  signalR.invoke('pong');
  formIsReadyToSubmit();
}

// This function sends a 'SubmitForm' message from the parent page to the server signalR... which relays a 'SubmitForm' message to the child page.
function signalR_SubmitForm() {
  echoMessage('<b style="color: gold">Event: </b><span style="color: blue">Submit Form Method Invoked - </span>Sending Message to SignalRServer');

  signalR.invoke('submitForm');
}

// Invoked when the page is unloaded to disconnect from the server.
function signalR_OnUnload() {
  echoMessage('<b style="color: gold">Event: </b><span style="color: blue">Page Unloading');
  signalR_Disconnect();
}

// This function stops the communication with the server signalR.
function signalR_Disconnect() {
  echoMessage('<b style="color: gold">Event: </b><span style="color: red">SignalR Connection Disconnecting</span>');

  var iFrame = document.getElementById(IFrameId);
  if (iFrame) {
    iFrame.onload = null;
  }

  // If the Hosted Payment Page Communication Timer is active disable it.
  if (TimeoutTimerId && valueIsNumeric(TimeoutTimerId) == true) {
    window.clearTimeout(TimeoutTimerId);
    TimeoutTimerId = undefined;
  }

  // The 1st parameter of the 'stop' method is whether or not to asynchronously abort the connection.
  // The 2nd parameter of the 'stop' method is whether we want to notify the server that we are aborting the connection.

  Connection.stop(false, true);

}

// Gets a human readable string for the specified connection state ID
function getStateName(state) {
  switch (state) {
    case 0 : return 'Connecting';
    case 1 : return 'Connected';
    case 2 : return 'Reconnecting';
    case 4 : return 'Disconnected';
    default: return 'Unkown(' + state + ')';
  }
}

//This function checks if the value is Numberic
function valueIsNumeric(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

//The function checks if the value passed is not empty
function valueIsValid(value) {
  return (value && value != '' && value.trim != '');
}

