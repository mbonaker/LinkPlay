document.addEventListener("DOMContentLoaded", () => {
  browser.storage.sync.get("serverAddress").then(
    result => {
      document.querySelector("#server-address").value = result.serverAddress || "localhost";
    },
    () => {
      console.log(`Error: ${error}`);
    }
  );
});
document.querySelector("form").addEventListener("submit", e => {
  e.preventDefault();
  browser.storage.sync.set({
    serverAddress: document.querySelector("#server-address").value
  });
});
