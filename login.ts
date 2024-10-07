import cors from 'cors';
import express from 'express';
import * as functions from 'firebase-functions';

const app = express();
// jsonデータを扱う
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// corsの許可
app.use(cors());

// テスト用のエンドポイント
app.get('/hello', (req, res) => {
    functions.logger.info('hello!');
    res.status(200).send({ message: 'hello, api sever!' });
});

// サーバー接続
// const port = process.env.PORT || 3001;
// app.listen(port, () => {
//  console.log('listen on port:', port);
// });

// exportすることで、/apiとしてFirebase Functionsに登録される
export const api = functions.region('asia-northeast1').https.onRequest(app);
