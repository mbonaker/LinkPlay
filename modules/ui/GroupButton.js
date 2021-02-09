class GroupButton {
  /**
   * @param {VideoController} controller
   * @param {Group} group
   */
  constructor(controller, group) {
    this.controller = controller;
    this.group = group;
    /** @type {?HTMLLIElement} */
    this.elButton = null;
  }

  make(append) {
    const document = this.controller.video.ownerDocument;
    this.elButton = document.createElement('li');

    this.elButton.append(document.createTextNode(this.group.name));
    this.elButton.addEventListener('click', () => {
      console.log(this.group.whenJoined);
      if (this.group.whenJoined === null)
        this.controller.joinGroup(this.group);
      else
        this.group.disjoin();
    });

    this.group.onJoin.push(() => this.elButton.classList.add('joined'));
    this.group.onDisjoin.push(() => this.elButton.classList.remove('joined'));

    append(this.elButton);
  }

}
