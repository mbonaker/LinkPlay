document.addEventListener("DOMContentLoaded", () => {
  browser.storage.sync.get([
    "serverAddress",
    "groupNames",
  ]).then(
    result => {
      document.querySelector("#server-address").value = result['serverAddress'] || "linkplay.softwar3.com";
      document.querySelector("#group-list").value = (result['groupNames'] || []).join("\n");
    },
    () => {
      console.log(`Error: ${error}`);
    }
  );
});
document.querySelector("form").addEventListener("submit", e => {
  e.preventDefault();
  /** @type {string} */
  const groupNameString = document.querySelector("#group-list").value;
  browser.storage.sync.set({
    'serverAddress': document.querySelector("#server-address").value,
    'groupNames': groupNameString.split("\n").filter(name => name !== '')
  });
});
