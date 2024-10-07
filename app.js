const express = require('express');
const multer = require('multer');
const app = express();
const port = 3000;

app.get('/data',function(req,res){
  res.json({
      message:"Hello,world"
  });
});

// 画像を保存するディレクトリ
//const upload = multer({ dest: "uploads/" }); 

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const unixTime = new Date().getTime()
    const fileName = `${unixTime}_${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage });

// 画像アップロードエンドポイント
app.post('/upload', upload.single("picture"), (req, res) => {
  console.log(req.file);
  res.send('ファイルが受信されました');
});


// サーバー起動
app.listen(port, () => {
  console.log('Server is up on port 3000');
});
