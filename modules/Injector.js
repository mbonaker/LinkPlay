/**
 * The initiator for the document's manipulation.
 * 
 * Ony one instance should be created per document (but that means separate instances per frame).
 */
class Injector {
  /**
   * @param {Document} document The document that should be manipulated and observed for videos by the injector.
   */
  constructor(document) {
    this.document = document;
  }

  /**
   * Start observing the DOM for videos that are dynamically added.
   * For every video, a {@link VideoController} is created to attach the corresponding LinkPlay button.
   * 
   * @returns {Injector} The {@link Injector} itself for call chaining.
   */
  observe() {
    const mutationObserver = new MutationObserver((mutations, _) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          // Make the video controller for this node, if it is a video.
          if (node instanceof HTMLVideoElement) {
            VideoController.fromNode(node);
          }
          // The querySelectorAll does not cover the node itself.
          for (const childNode of node.querySelectorAll('video')) {
            VideoController.fromNode(childNode);
          }
        }
      }
    });

    // Start observing
    mutationObserver.observe(this.document, {
      subtree: true,
      childList: true,
    });

    // For call chaining
    return this;
  }

  /**
   * Crawl the current DOM for video instances.
   * For every video, a {@link VideoController} is created to attach the corresponding LinkPlay button.
   *
   * @returns {Injector} The {@link Injector} itself for call chaining.
   */
  inject() {
    for (const node of this.document.querySelectorAll('video')) {
      VideoController.fromNode(node);
    }

    // For call chaining
    return this;
  }
}
