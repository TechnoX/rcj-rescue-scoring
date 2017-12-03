# ロボカップジュニア
### レスキュー　スコアリングシステム（日本国内大会向け）

これは，日本国内大会向けのロボカップジュニアレスキュー競技スコアリングシステムです．  
[国際向け](https://github.com/TechnoX/rcj-rescue-scoring)からの主な変更点は以下の通りです． 
 
* Line競技において，ワールドリーグと日本リーグを追加
* Line結果画面において，ワールドリーグと日本リーグの結果を横並びで表示

多言語対応（日本語対応化作業）は，国際向けで行なっています．

## 使用実績
**把握している限り**の，本システムを用いて運用を行った主な大会の一覧です．国際向けや，派生バージョンの使用も含みます．
### 2016年ルール対応版
* スウェーデン国内大会
* ロボカップジュニア2017 関東ブロック大会
* ロボカップジュニア ジャパンオープン2017 ぎふ・中津川

### 2017年ルール対応版
* RoboCup 2017 Nagoya Japan
* NESTロボコン2017
* ロボカップジュニア2018 北埼玉ノード大会
* ロボカップジュニア2018 南埼玉ノード大会
* ロボカップジュニア2018 千葉ノード大会
* ロボカップジュニア2018 広島ノード大会

## Usage
#### 必要なソフト
* [Node.js](https://nodejs.org/en/)
* [mongodb](https://www.mongodb.com)

### bowerのインストール
`sudo npm install -g bower`

### 各種依存ファイルの導入
ディレクトリ内で...
`npm install`
`bower install`

### 起動
`node server`

## 初期アカウント
初期アカウントは次の通りです．  

ユーザー名        | パスワード         |
----------------|-------------------|
admin | adminpass   |
judge | judgepass  |

## 主な画面
トップ画面  
<img src="https://raw.githubusercontent.com/rrrobo/rcj-rescue-scoring-japan/日本国内向け/rcjj-scoring/1.png">
<hr>
ログイン画面  
<img src="https://raw.githubusercontent.com/rrrobo/rcj-rescue-scoring-japan/日本国内向け/rcjj-scoring/6.png">
<hr>
Line 競技一覧  
<img src="https://raw.githubusercontent.com/rrrobo/rcj-rescue-scoring-japan/日本国内向け/rcjj-scoring/2.png">
<hr>
Line 審判1  
<img src="https://raw.githubusercontent.com/rrrobo/rcj-rescue-scoring-japan/日本国内向け/rcjj-scoring/3.png">
<hr>
Line 審判2  
<img src="https://raw.githubusercontent.com/rrrobo/rcj-rescue-scoring-japan/日本国内向け/rcjj-scoring/4.png">
<hr>
Line 確認  
<img src="https://raw.githubusercontent.com/rrrobo/rcj-rescue-scoring-japan/日本国内向け/rcjj-scoring/5.png">
<hr>
Maze 審判  
<img src="https://raw.githubusercontent.com/rrrobo/rcj-rescue-scoring-japan/日本国内向け/rcjj-scoring/7.png">
<hr>

### 効果音
以下の効果音を使用しています． 
 
* [MusMus](http://musmus.main.jp)
* [魔王魂](https://maoudamashii.jokersounds.com)
