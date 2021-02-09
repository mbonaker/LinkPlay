/**
 * Represents the main button on the video overlay.
 */
class LinkPlayButton {

  /**
   * @param {VideoController} controller The controller of the video this button should overlay
   */
  constructor(controller) {
    this.controller = controller;
    /** @type {null|HTMLImageElement} */
    this.elButton = null;
  }

  /**
   * @returns {HTMLImageElement} A freshly made button that can be inserted into the DOM
   */
  make() {
    const document = this.controller.video.ownerDocument;
    this.elButton = document.createElement('img');
    this.elButton.src = browser.runtime.getURL("icon.svg");

    this.elButton.addEventListener('click', () => {
      const groupName = prompt('Group Key:', "" + Math.round(Math.random() * 10000));
      const group = this.controller.groupManager.get(groupName);
      this.controller.groupManager.add(group);
      this.controller.joinGroup(group);
    });

    return this.elButton;
  }
}