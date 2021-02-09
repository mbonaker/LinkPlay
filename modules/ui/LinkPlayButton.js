class LinkPlayButton {

  /**
   * @param {VideoController} controller
   */
  constructor(controller) {
    this.controller = controller;
    /** @type {null|HTMLImageElement} */
    this.elButton = null;
  }

  /**
   * 
   * @param {HTMLVideoElement} video
   * @returns {HTMLImageElement}
   */
  make(video) {
    const document = video.ownerDocument;
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