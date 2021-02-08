# LinkPlay
Firefox addon to synchronize any video playback between friends. Also supports Netflix!

## Installation

**If you want one of the final releases** just simply take the xpi file and drag'n'drop it into a Firefox window.

**If you want to use another version from source code** you will have *no chance* to install it permanently into a normal Firefox. None whatsoever. But you can temporarily install it by typing `about:debugging` into the address bar, pressing enter, going to "This Firefox", clicking on "Load temporary add-on..." and then selecting the "manifest.json" that you got from cloning this repository.

### Configuration

Since this addon currently gets blocked by some adblockers (at least uBlock), you may want to add the rule `@@||linkplay.softwar3.com:52795^$websocket` to prevent that from happening.

By default the addon connects to the `linkplay.softwar3.com` server but you can change that in the extension settings. Remember to whitelist whatever server you use in your adblocker.
