const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const multer = require('multer');

const app = express();
const port = 3000;

// body-parserミドルウェアをセットアップして、JSONデータをパースできるようにする
app.use(bodyParser.json());

// POSTリクエストを受け取るエンドポイントを定義
app.post('/save', (req, res) => {
    const jsonData = req.body;  // リクエストボディからJSONデータを取得

    // JSONデータを'data.json'ファイルに保存
    fs.writeFileSync('data.json', JSON.stringify(jsonData, null, 2), (err) => {
        if (err) {
            console.error('Error writing file', err);  // エラーメッセージをコンソールに出力
            res.status(500).send('Internal Server Error');  // クライアントに500ステータスコードを返す
        } else {
            res.send('Data saved successfully');  // クライアントに成功メッセージを返す
        }
    });
});

// 画像を保存するディレクトリ
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
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

// サーバーを指定したポートで起動し、リッスン開始
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
