class User {
    constructor(
        id = null,
        username,
        email,
        createdAt = new Date(),
        updatedAt = new Date()
    ) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

module.exports = User; 