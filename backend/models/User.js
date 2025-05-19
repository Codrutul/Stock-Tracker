class User {
    constructor(
        id = null,
        username,
        email,
        password = null,
        role = 'regular', // Default role is 'regular', can be 'admin' as well
        createdAt = new Date(),
        updatedAt = new Date()
    ) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password; // Stored hashed, never plaintext
        this.role = role;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

module.exports = User; 