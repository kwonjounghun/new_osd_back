const connection = require("../../configs/connection");
const { createThumbnails } = require("../../middlewares/createThumbnails");
const bcrypt = require("bcrypt");
const { isOnlyNicName } = require("../../middlewares/verifications");

// 유저 detail 등록
exports.insertDetail = (req, res) => {
  console.log("insert", req.file);
  req.body["user_id"] = req.decoded.uid;
  if (req.body.category_level1 === 0) {
    req.body.category_level1 = null;
  }
  if (req.body.category_level2 === 0) {
    req.body.category_level2 = null;
  }
  if (req.body.is_designer) {
    req.body.is_designer = 1;
  } else {
    req.body.is_designer = 0;
  }
  const userUpdata = id => {
    return new Promise((resolve, reject) => {
      connection.query(
        `UPDATE user SET ? WHERE uid = ${req.decoded.uid} `,
        { thumbnail: id },
        (err, rows) => {
          if (!err) {
            console.log("detail: ", rows);
            resolve(rows);
          } else {
            reject(err);
          }
        }
      );
    });
  };

  const insertDetailDB = data => {
    console.log("22", data);
    return new Promise((resolve, reject) => {
      connection.query("INSERT INTO user_detail SET ?", data, (err, rows) => {
        if (!err) {
          console.log("detail: ", rows);
          resolve(rows);
        } else {
          reject(err);
        }
      });
    });
  };

  const insertUserCount = () => {
    return new Promise((resolve, reject) => {
      const newCount = {
        user_id: req.decoded.uid,
        total_like: 0,
        total_design: 0,
        total_group: 0,
        total_view: 0
      };
      connection.query(
        "INSERT INTO user_counter SET ? ",
        newCount,
        (err, row) => {
          if (!err) {
            resolve(row);
          } else {
            console.log(err);
            reject(err);
          }
        }
      );
    });
  };

  const respond = data => {
    res.status(200).json({
      message: "성공적으로 등록되었습니다."
    });
  };

  const error = err => {
    res.status(500).json({
      error: err
    });
  };

  createThumbnails({ uid: req.decoded.uid, image: req.file })
    .then(userUpdata)
    .then(() => insertDetailDB(req.body))
    .then(insertUserCount)
    .then(respond)
    .catch(error);
};

// 유저 정보 수정
exports.modifyDetail = (req, res) => {
  const userId = req.decoded.uid;
  const userInfo = {
    password: req.body.password,
    nick_name: req.body.nick_name,
    update_time: new Date()
  }; // user 테이블에 들어가야 할 정보
  const detailInfo = {
    about_me: req.body.about_me,
    category_level1: req.body.category_level1,
    category_level2: req.body.category_level2,
    is_designer: req.body.is_designer
  }; // user detail 테이블에 들어가야 할 정보

  const updateDetailDB = data => {
    console.log(data);
    return new Promise((resolve, reject) => {
      connection.query(
        `UPDATE user_detail SET ? WHERE user_id=${userId}`,
        data,
        (err, rows) => {
          if (!err) {
            if (rows.affectedRows) {
              resolve(rows);
            } else {
              console.log(err);
              reject(err);
            }
          } else {
            console.log(err);
            reject(err);
          }
        }
      );
    });
  };

  function createHashPw (userInfo) {
    const p = new Promise((resolve, reject) => {
      bcrypt.hash(userInfo.password, 10, function (err, hash) {
        if (!err) {
          userInfo.password = hash;
          console.log("createHashPW", userInfo);
          resolve(userInfo);
        } else {
          console.log(err);
          reject(err);
        }
      });
    });
    return p;
  }

  const userUpdata = id => {
    let info = userInfo;
    if (id !== null) {
      info.thumbnail = id;
    }
    return new Promise((resolve, reject) => {
      connection.query(
        `UPDATE user SET ? WHERE uid = ${req.decoded.uid}`, info, (err, rows) => {
          if (!err) {
            console.log("detail: ", rows);
            resolve(rows);
          } else {
            console.log(err);
            reject(err);
          }
        }
      );
    });
  };

  const respond = data => {
    res.status(200).json({
      success: true,
      message: "성공적으로 업데이트되었습니다."
    });
  };

  const error = err => {
    res.status(500).json({
      success: false,
      error: err
    });
  };

  isOnlyNicName(userInfo.nick_name)
    .then(() => createHashPw(userInfo))
    .then(() => updateDetailDB(detailInfo))
    .then(() => {
      if (req.file == null) {
        return Promise.resolve(null);
      } else {
        return createThumbnails({ uid: req.decoded.uid, image: req.file });
      }
    })
    .then(userUpdata)
    .then(respond)
    .catch(error);
};
