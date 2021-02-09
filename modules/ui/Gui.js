class Gui {
  /**
   * @param {VideoController} controller
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

  makeLinkPlayButton(append) {
    append(this.linkPlayButton.make(this.controller.video));
  }

  makeGroupButtons(append) {
    const document = this.controller.video.ownerDocument;

    this.elButtonList = document.createElement('ul');

    this.controller.groupManager.onAdd.push(/** @type Group */ group => {
      const button = new GroupButton(this.controller, group);
      this.groupButtons.push(button);
      button.make(el => this.elButtonList.append(el));
    });
    this.controller.groupManager.onRemove.push(group => {
      for (const groupButton of this.groupButtons) {
        if (groupButton.group === group) {
          this.groupButtons = this.groupButtons.filter(gb => gb.group !== group);
          groupButton.remove();
        }
      }
    });
    append(this.elButtonList);
  }

  make() {
    const document = this.controller.video.ownerDocument;

    this.elContainer = document.createElement('div');
    this.elContainer.classList.add('linkplay', 'linkplay-container');

    this.elControlContainer = document.createElement('div');
    this.elControlContainer.classList.add('linkplay-controls');
    this.elContainer.append(this.elControlContainer);

    // Make the HTML structure
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

    // Position the buttonContainer nicely
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