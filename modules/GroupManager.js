class GroupManager {
  constructor() {
    /** @type Group[] */
    this.groups = [];
    this.onAdd = [];
    this.onRemove = [];
  }
  
  init() {
    /** @type Storage */
    const storage = browser.storage;
    storage.sync.get("groupNames").then(result => {
      if (!result['groupNames']) {
        result['groupNames'] = [];
      }
      this.names = result['groupNames'];
    });
    storage.onChanged.addListener((/* StorageChange */ changes, /* string */areaName) => {
      if (areaName !== 'sync')
        return;
      if (changes['groupNames']) {
        this.names = changes['groupNames'].newValue;
      }
    });
  }

  add(group) {
    this.groups.push(group);
    this.onAdd.forEach(fn => fn(group));
  }

  remove(group) {
    const index = this.groups.indexOf(group);
    this.groups.splice(index, 1);
    this.onRemove.forEach(fn => fn(group));
  }

  has(group) {
    return this.groups.includes(group);
  }

  get(groupName) {
    let groups = this.groups.filter(group => group.name === groupName);
    if (groups.length > 0) {
      return groups[0];
    }
    return new Group(groupName);
  }

  /**
   * @param {string[]} groupNames
   */
  set names(groupNames) {
    for (const groupName of groupNames) {
      if (this.groups.filter(group => group.name === groupName).length < 1) {
        const group = new Group(groupName);
        this.add(group);
      }
    }
    for (const group in this.groups.filter(group => !groupNames.includes(group.name))) {
      this.remove(group);
    }
  }
}
