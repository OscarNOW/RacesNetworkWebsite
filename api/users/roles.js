//users/roles
module.exports = {
    execute(error, end, req, extra, params) {
        return end(JSON.stringify(extra.roles))
    }
}