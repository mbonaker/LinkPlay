class Injector {
  /**
   * @param {Document} document
   */
  constructor(document) {
    this.document = document;
  }

  observe() {
    const mutationObserver = new MutationObserver((mutations, _) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLVideoElement) {
            VideoController.fromNode(node);
          }
          for (const childNode of node.querySelectorAll('video')) {
            VideoController.fromNode(childNode);
          }
        }
      }
    });

    mutationObserver.observe(this.document, {
      subtree: true,
      childList: true,
    });

    return this;
  }

  inject() {
    for (const node of this.document.querySelectorAll('video')) {
      VideoController.fromNode(node);
    }
    return this;
  }
}
