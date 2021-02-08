// import and export syntax is not usable here because this is a content script which cannot be marked as being a module.
// Also Firefox 85.0 has a bug where dynamic import is not supported from inside content scripts. So we have to rely on the manifest.json to call all files one after another.

// This file is injected once per document
const injector = new Injector(document);
injector.inject();
injector.observe();
