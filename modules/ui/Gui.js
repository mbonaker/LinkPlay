/**
 * Represents the GUI of a single video, including the main button and all the group buttons as constituents.
 */
class Gui {
  /**
   * @param {VideoController} controller The controller of the {@link HTMLVideoElement} this GUI should interface for. 
   */
  constructor(controller) {
    this.controller = controller;
    this.linkPlayButton = new LinkPlayButton(controller);
    this.groupButtons = [];
    /** @type ?HTMLDivElement */
    this.elContainer = null;
    /** @type ?HTMLDivElement */
    this.elControlContainer = null;
    /** @type ?HTMLUListElement */
    this.elButtonList = null;
  }

  /**
   * @callback appendCallback
   * @param {...HTMLElement} elements Elements to be appended
   * @return {void}
   */

  /**
   * @param {appendCallback} append Function to be called to append new elements to the dom
   */
  makeLinkPlayButton(append) {
    append(this.linkPlayButton.make());
  }

  /**
   * This method makes the group buttons and appends them using the {@link append} parameter. This will also append more buttons in the future if more groups are created (that's why {@link append} has to be a callback.
   * 
   * @param {appendCallback} append Function to be called to append new elements to the dom
   */
  makeGroupButtons(append) {
    const document = this.controller.video.ownerDocument;

    this.elButtonList = document.createElement('ul');

    // Append a new button if a group is added
    this.controller.groupManager.onAdd.push(/** @type Group */ group => {
      const button = new GroupButton(this.controller, group);
      this.groupButtons.push(button);
      button.make(el => this.elButtonList.append(el));
    });

    // Remove the old button if a group is removed
    this.controller.groupManager.onRemove.push(group => {
      for (const groupButton of this.groupButtons) {
        if (groupButton.group === group) {
          this.groupButtons = this.groupButtons.filter(gb => gb.group !== group);
          groupButton.remove();
        }
      }
    });

    // Using the append parameter only outside the add/remove events actually defeats the whole purpose of it.
    // I still think that it is not really a bad idea because it keeps said fact back-boxed.
    append(this.elButtonList);
  }

  /**
   * Makes HTML elements, necessary to render the overlay.
   * 
   * @returns {HTMLElement[]} Elements to be added to the dom for the gui to work
   */
  make() {
    const document = this.controller.video.ownerDocument;

    // Make the HTML structure
    this.elContainer = document.createElement('div');
    this.elContainer.classList.add('linkplay', 'linkplay-container');

    this.elControlContainer = document.createElement('div');
    this.elControlContainer.classList.add('linkplay-controls');
    this.elContainer.append(this.elControlContainer);

    this.makeLinkPlayButton(el => this.elControlContainer.append(el));
    this.makeGroupButtons(el => this.elControlContainer.append(el));

    // Make it, so the CSS can hide the LinkPlay button, based on mouse movement.
    let timeout = null;
    document.addEventListener('mousemove', event => {
      const clientRect = this.controller.video.getBoundingClientRect();
      if (clientRect.top < event.clientY && clientRect.left < event.clientX && clientRect.bottom > event.clientY && clientRect.right > event.clientX) {
        this.elContainer.classList.add('video-hover');
        if (timeout !== null)
          clearTimeout(timeout);
        timeout = setTimeout(() => this.elContainer.classList.remove('video-hover'), 2000);
      } else {
        if (timeout !== null)
          clearTimeout(timeout);
        this.elContainer.classList.remove('video-hover');
      }
    });

    // Position the elContainer nicely
    setInterval(() => {
      const clientRect = this.controller.video.getBoundingClientRect();
      this.elContainer.style.top = `${clientRect.top + document.documentElement.scrollTop}px`;
      this.elContainer.style.left = `${clientRect.left + document.documentElement.scrollLeft}px`;
      this.elContainer.style.width = `${clientRect.width}px`;
      this.elContainer.style.height = `${clientRect.height}px`;
    }, 100);

    return [
      this.elContainer,
    ];
  }
}