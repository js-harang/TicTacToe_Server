var express = require('express');
var router = express.Router();

router.get('/', async function(req, res, next) {
    try {
        if (!req.session.isAuthenticated) {
            return res.status(400).send("로그인이 필요합니다.");
        }

        var database = req.app.get('database');
        var users = database.collection('users');

        const allUsers = await users.find({}, {
            projection: {
                username: 1,
                nickname: 1,
                score: 1
            }
        }).sort({score: -1}).toArray();

        const scoreList = allUsers.map(user => ({
            username: user.username,
            nickname: user.nickname,
            score: user.score || 0
        }));

        const result = {
            scores: scoreList
        };

        res.status(200).json(result);

    } catch (err) {
        console.error("리더보드 조회 중 오류 발생: ", err);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
});

module.exports = router;