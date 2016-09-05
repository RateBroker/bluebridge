

##&lt;bluebridge-app&gt;

The bluebridge-app element is used for initializing and configuring your
connection to a bluebridge instance.



##&lt;bluebridge-auth&gt;

`bluebridge-auth` authenticates the current session with the BlueBridge instance. It notifies
successful authentication, provides user information, and handles email / password authentication

Example Usage:

```html
<bluebridge-app endpoint="localhost:8082">
</bluebridge-app>
<bluebridge-auth id="auth" user="{{user}}">
</bluebridge-auth>
```

```javascript
this.$.auth.signInWithEmailAndPassword()
    .then(function(response) {// successful authentication response here})
    .catch(function(error) {// unsuccessful authentication response here});
```


##&lt;bluebridge-document&gt;

The bluebridge-document element is an easy way to interact with a document
as an object and expose it to the Polymer databinding system.

For example:

```html
<bluebridge-document
  collection="Note"
  id="{{noteId}}"
  data="{{noteData}}">
</bluebridge-document>
```

This fetches the `noteData` object from BlueBridge with the _id
`{noteId}` and exposes it to the Polymer
databinding system. Changes to `noteData` will likewise be, sent back up
and stored.

`<bluebridge-document>` needs some information about how to talk to BlueBridge.
Set this configuration by adding a `<bluebridge-app>` element anywhere in your
app.



##&lt;bluebridge-query&gt;

`bluebridge-query` combines the given properties into query options that generate
a query, a request for a filtered, ordered, immutable set of BlueBridge data. The
results of this query are then synchronized into the `data` parameter.

Example usage:

```html
<bluebridge-query
    collection="Note"
    filter="{{filter}}"
    data="{{data}}">
</bluebridge-query>

<template is="dom-repeat" items="{{data}}" as="note">
  <sticky-note note-data="{{note}}"></sticky-note>
</template>

<script>
Polymer({
  properties: {
    uid: String,
    data: {
      type: Object,
      observer: 'dataChanged'
    }
  },

  dataChanged: function (newData, oldData) {
    // do something when the query returns values
  }
});
</script>
```
