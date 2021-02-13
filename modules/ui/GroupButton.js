/**
 * Represents a single button on a video overlay that can be used to join a specific group.
 */
class GroupButton {
  /**
   * @param {VideoController} controller The controller for the video this button interfaces for.
   * @param {Group} group
   */
  constructor(controller, group) {
    this.controller = controller;
    this.group = group;
    /** @type {?HTMLLIElement} */
    this.elButton = null;
    /** @type {?Node} */
    this.preSpace = null;
  }

  /**
   * @callback appendCallback
   * @param {...Node} elements Elements to be appended
   * @return {void}
   */

  /**
   * Appends a freshly made button to the dom, representing the group.
   *
   * @param {appendCallback} append Function to be called to append new elements to the dom
   */
  make(append) {
    const document = this.controller.video.ownerDocument;

    // Make HTML structure
    this.elButton = document.createElement('li');
    this.elButton.append(document.createTextNode(this.group.name));
    this.preSpace = document.createTextNode(' ');

    // Add events
    this.elButton.addEventListener('click', () => {
      if (this.group.whenJoined === null)
        this.controller.joinGroup(this.group);
      else
        this.group.disjoin();
      this.controller.video.focus();
    });
    this.group.onJoin.push(() => this.elButton.classList.add('joined'));
    this.group.onDisjoin.push(() => this.elButton.classList.remove('joined'));

    // Append to DOM
    append(this.preSpace, this.elButton);
  }

  remove() {
    this.preSpace.remove();
    this.elButton.remove();
  }

}
