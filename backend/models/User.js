toJSON() {
    return {
        id: this._id,
        username: this.username,
        email: this.email,
        // Add other fields that should be returned here
    };
}