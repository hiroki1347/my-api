// mysql.js
const express = require('express');
const fs = require('fs');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const app = express();
const port = 3000;

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'nananaerg3715',
  database: 'sns',
  port: 3306,
});

app.use(bodyParser.json());

//mysqlに接続
db.connect(err => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to database.');
});

// データの追加

app.post('/save', (req, res) => {

  const data = req.body;

  fs.writeFileSync('data.json', JSON.stringify(data, null, 2), (err) => {
    if (err) {
        console.error('Error writing file', err);  // エラーメッセージをコンソールに出力
        res.status(500).send('Internal Server Error');  // クライアントに500ステータスコードを返す
    } else {
        res.send('Data saved successfully');  // クライアントに成功メッセージを返す
    }
  });

  const query = 'INSERT INTO post (createdAt, posterName, posterImageUrl, posterId, text, imageName) VALUES (?, ?, ?, ?, ?, ?)';

  db.query(query, [data.createdAt, data.posterName,data.posterImageUrl,data.posterId,data.text,data.imageName], (err, result) => {
    if (err) {
      console.error('Error inserting data into MySQL:', err);
      res.status(500).send('Error inserting data into MySQL');
    } else {
      console.log('Data inserted successfully:', result);
      res.status(200).send('Data inserted successfully');
    }
  });
});


// データの送信
app.get('/data', (req, res) => {
    const query = "SELECT * FROM post";
    db.query(query, (err, results) => {
        if (err) {
            console.log(err);
            res.status(500).send("Error retrieving data from database");
        } else {
            res.status(200).json(results)  
        }
    });
});

//user_post送信
app.get('/user_post', (req, res) => {
  const posterId = req.query.posterId;
  const query = "SELECT * FROM post WHERE posterId = ?";
  if (!posterId) {
    return res.status(400).json({ error: 'ユーザーIDが必要です' });
  }

  db.query(query, [posterId], (err, results) => {
    if (err) {
      console.error('クエリエラー:', err);
      return res.status(500).json({ error: '内部サーバーエラー' });
    }
    
    res.json(results);
  });
});


//画像の転送
app.get('/image', (req, res) => {
  const imagePath = path.join(__dirname, 'images', '22.png');
  res.sendFile(imagePath);
});

// 画像を保存するディレクトリ
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, "images/");
  },
  filename: (req, file, cb) => {
      // 'data.json' ファイルから jsonData を読み込む
      fs.readFile('data.json', (err, data) => {
          if (err) {
              console.error('Error reading file', err);
              cb(err);  // エラーがあればコールバックでエラーを渡す
              return;
          }
          const jsonData = JSON.parse(data);  // JSONデータをパース
          const createdAt = jsonData.createdAt;  // createdAt を取得
          const fileName = `${createdAt}_${file.originalname}`;  // createdAt を使用してファイル名を生成
          cb(null, fileName);  // コールバックでファイル名を渡す
      });
  },
});

const upload = multer({ storage });

// 画像アップロードエンドポイント
app.post('/upload', upload.single("picture"), (req, res) => {
  console.log(req.file);
  res.send('ファイルが受信されました');
});


// データの更新
app.post("/update", (req, res) => {

    console.log('receive',req.body)
    const postId = req.body.postId;
    const newText = req.body.newText;
  
    const query = "UPDATE post SET text = ? WHERE postId = ?";
    db.query(query, [newText, postId], (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send("Error updating data in database");
      } else {
        res.status(200).send("Value Updated");
      }
    });
  });

// データの削除
app.post("/delete", (req, res) => {

  console.log('receive',req.body)

  const postId = req.body.postId;
  const query = "DELETE FROM post WHERE postId = ?";
  db.query(query, [postId], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send("Error deleting data from database");
    } else {
      res.status(200).send("Value Deleted");
    }
  });
}); 


// 静的ファイルの提供
app.use('/images', express.static(path.join(__dirname, 'images')));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// like
app.post("/like", (req, res) => {

  console.log('receive',req.body)
  const postId = req.body.postId;
  const user_id = req.body.user_id;
  const likedAt = req.body.likedAt;

  const query = 'INSERT INTO like_list (user_id, postId, likedAt) VALUES (?, ?, ?)';
  db.query(query, [user_id, postId,likedAt], (err, result) => {
    if (err) {
      console.error('Error inserting data into MySQL:', err);
      res.status(500).send('Error inserting data into MySQL');
    } else {
      console.log('like successfully:', result);
      res.status(200).send('like successfully');
    }
  });
});

//unlike
app.post("/unlike", (req, res) => {

  console.log('receive',req.body)
  const postId = req.body.postId;
  const user_id = req.body.user_id;

  const query = 'DELETE FROM like_list WHERE user_id = ? AND postId = ?';
  db.query(query, [user_id, postId], (err, result) => {
    if (err) {
      console.error('Error unlike into MySQL:', err);
      res.status(500).send('Error unlike into MySQL');
    } else {
      console.log('unlike successfully:', result);
      res.status(200).send('unlike successfully');
    }
  });
});

//get_user_likes
// ユーザーの「いいね」した投稿IDを取得するエンドポイント
app.get('/user_likes', (req, res) => {
  const userId = req.query.user_id; // クエリパラメータからユーザーIDを取得

  if (!userId) {
    return res.status(400).json({ error: 'ユーザーIDが必要です' });
  }

  const query = 'SELECT * FROM like_list WHERE user_id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('クエリエラー:', err);
      return res.status(500).json({ error: '内部サーバーエラー' });
    }
    res.json(results);
  });
});

//get_like_num
app.get('/get_like_num', (req, res) => {
  const postId = req.query.postId; // クエリパラメータからpostIDを取得

  if (!postId) {
    return res.status(400).json({ error: 'ユーザーIDが必要です' });
  }

  const query = 'SELECT * FROM like_list WHERE postId = ?';
  db.query(query, [postId], (err, results) => {
    if (err) {
      console.error('クエリエラー:', err);
      return res.status(500).json({ error: '内部サーバーエラー' });
    }
    
    res.json(results);

  });
});


// follow
app.post("/follow", (req, res) => {

  console.log('receive',req.body)
  const followee_id = req.body.followee_id;
  const follower_id = req.body.follower_id;
  const followedAt = req.body.followedAt;

  const query = 'INSERT INTO follows (follower_id, followee_id, followedAt) VALUES (?, ?, ?)';
  db.query(query, [follower_id, followee_id,followedAt], (err, result) => {
    if (err) {
      console.error('Error inserting data into MySQL:', err);
      res.status(500).send('Error inserting data into MySQL');
    } else {
      console.log('followe successfully:', result);
      res.status(200).send('followe successfully');
    }
  });
});

//unfollow
app.post("/unfollow", (req, res) => {

  console.log('receive',req.body)
  const followee_id = req.body.followee_id;
  const follower_id = req.body.follower_id;

  const query = 'DELETE FROM follows WHERE follower_id = ? AND followee_id = ?';
  db.query(query, [follower_id, followee_id], (err, result) => {
    if (err) {
      console.error('Error unlike into MySQL:', err);
      res.status(500).send('Error unfollowe into MySQL');
    } else {
      console.log('unfollowe successfully:', result);
      res.status(200).send('unlfollowe successfully');
    }
  });
});

//get_follows
app.get('/user_follow', (req, res) => {
  const follower_id = req.query.user_id; // クエリパラメータからユーザーIDを取得

  if (!follower_id) {
    return res.status(400).json({ error: 'ユーザーIDが必要です' });
  }

  const query = 'SELECT * FROM follows WHERE follower_id = ?';
  db.query(query, [follower_id], (err, results) => {
    if (err) {
      console.error('クエリエラー:', err);
      return res.status(500).json({ error: '内部サーバーエラー' });
    }
    
    res.json(results);
  });
});

//get_followers
app.get('/get_follower', (req, res) => {
  const followee_id = req.query.followee_id; // クエリパラメータからユーザーIDを取得

  if (!followee_id) {
    return res.status(400).json({ error: 'ユーザーIDが必要です' });
  }

  const query = 'SELECT * FROM follows WHERE followee_id = ?';
  db.query(query, [followee_id], (err, results) => {
    if (err) {
      console.error('クエリエラー:', err);
      return res.status(500).json({ error: '内部サーバーエラー' });
    }
    
    res.json(results);
  });
});

//edit_user_inf
app.post("/user_inf", (req, res) => {

  console.log('receive',req.body)
  const user_id = req.body.user_id;
  const user_name = req.body.user_name;
  const userImageUrl = req.body.userImageUrl

  const query = 'UPDATE users SET user_name = ?,userImageUrl = ? WHERE user_id = ?';
  db.query(query, [user_name, userImageUrl, user_id], (err, result) => {
    if (err) {
      console.error('Error inserting data into MySQL:', err);
      res.status(500).send('Error inserting data into MySQL');
    } else {
      console.log('successfully:', result);
      res.status(200).send('successfully');
    }
  });
});

//登録確認
app.get("/check_user", (req, res) => {
  const user_id = req.query.uid;

  db.query('SELECT * FROM users WHERE user_id = ?', [user_id], (err, results) => {
    if (err) {
      res.status(500).send('Server error');
      return;
    }

    if (results.length > 0) {
      res.json({ exists: true });
    } else {
      res.json({ exists: false });
    }
  });
});

//初回登録
app.post("/first_inf", (req, res) => {

  console.log('receive',req.body)
  const user_id = req.body.user_id;
  const user_name = req.body.user_name;
  const userImageUrl = req.body.userImageUrl
  const createdAt = req.body.createdAt;

  const query = 'INSERT INTO users (user_id, user_name, userImageUrl, createdAt) VALUES (?, ?, ?, ?)';
  db.query(query, [user_id, user_name, userImageUrl, createdAt], (err, result) => {
    if (err) {
      console.error('Error inserting data into MySQL:', err);
      res.status(500).send('Error inserting data into MySQL');
    } else {
      console.log('successfully:', result);
      res.status(200).send('successfully');
    }
  });
});


//get_user_inf
app.get('/get_user_inf', (req, res) => {
  const user_id = req.query.user_id; // クエリパラメータからユーザーIDを取得

  if (!user_id) {
    return res.status(400).json({ error: 'ユーザーIDが必要です' });
  }

  const query = 'SELECT * FROM users WHERE user_id = ?';
  db.query(query, [user_id], (err, results) => {
    if (err) {
      console.error('クエリエラー:', err);
      return res.status(500).json({ error: '内部サーバーエラー' });
    }
    
    res.json(results[0]);

  });
});

