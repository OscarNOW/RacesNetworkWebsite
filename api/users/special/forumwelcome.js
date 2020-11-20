//users/special/forumwelcome
module.exports = {
    execute(error, end, req, extra, params) {

        let userId = extra.messages.list[extra.messages.special.forumWelcome].author
        let user = extra.users.list[userId]

        let obj = {
            username: user.username,
            role: user.role,
            email: user.email,
            id: userId,
            avatar: `data/usericons/${userId}.png`
        }

        return end(JSON.stringify(obj))

    }
}