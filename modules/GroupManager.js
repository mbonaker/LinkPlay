/**
 * Manages the groups of a particular video.
 *
 * Keeping track of the local storage to remember previous groups is part of the {@link GroupManager}s task.
 */
class GroupManager {
  constructor() {
    /** @type Group[] */
    this.groups = [];

    // Provide some events
    this.onAdd = [];
    this.onRemove = [];

    this.storeChanges = true;
    this.storageChangeListener = null;
  }

  /**
   * Load groups from local storage
   */
  init() {
    browser.storage.sync.get("groupNames").then(result => {
      if (!result['groupNames']) {
        result['groupNames'] = [];
      }
      this.storeChanges = false;
      this.names = result['groupNames'];
      this.storeChanges = true;
    });
    this.storageChangeListener = (/* StorageChange */ changes, /* string */areaName) => {
      if (areaName !== 'sync')
        return;
      if (changes['groupNames']) {
        this.storeChanges = false;
        this.names = changes['groupNames'].newValue;
        this.storeChanges = true;
      }
    };
    browser.storage.onChanged.addListener(this.storageChangeListener);
  }

  store() {
    browser.storage.onChanged.removeListener(this.storageChangeListener);
    browser.storage.sync.set({
      'groupNames': this.names,
    });
    browser.storage.onChanged.addListener(this.storageChangeListener);
  }

  /**
   * @param {Group} group The group to be added
   */
  add(group) {
    this.groups.push(group);
    if (this.storeChanges)
      this.store();
    this.onAdd.forEach(fn => fn(group));
  }

  /**
   * @param {Group} group The group to be removed
   */
  remove(group) {
    const index = this.groups.indexOf(group);
    this.groups.splice(index, 1);
    this.onRemove.forEach(fn => fn(group));
    if (group.isJoined)
      group.disjoin();
    if (this.storeChanges)
      this.store();
  }

  /**
   * @param {Group} group The group to check for
   * @returns {boolean} Whether {@link group} is managed by this manager
   */
  has(group) {
    return this.groups.includes(group);
  }

  /**
   * Returns the group with the name given by `groupName`. If the group didn't exist yet, a new one is created but not added!
   *
   * @param {string} groupName The name of the group to be returned
   * @returns {Group} The new or pre-existing group
   */
  get(groupName) {
    let groups = this.groups.filter(group => group.name === groupName);
    if (groups.length > 0) {
      return groups[0];
    }
    return new Group(groupName);
  }

  /**
   * Set this manager to contain exactly the groups that are given
   *
   * @param {string[]} groupNames
   */
  set names(groupNames) {
    // Add new groups
    for (const groupName of groupNames) {
      if (this.groups.filter(group => group.name === groupName).length < 1) {
        const group = new Group(groupName);
        this.add(group);
      }
    }

    // Remove old groups
    for (const group of this.groups.filter(g => !groupNames.includes(g.name))) {
      this.remove(group);
    }
  }

  /**
   * @return {string[]}
   */
  get names() {
    return this.groups.map(group => group.name);
  }
}
