class Tag {
    constructor(
        id = null,
        name,
        category = 'general',
        createdAt = new Date()
    ) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.createdAt = createdAt;
    }
}

module.exports = Tag; 