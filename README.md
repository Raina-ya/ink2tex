# 手寫公式轉 LaTeX（最小版本）

這個工具只把 Canvas 圖片傳到本機的 FastAPI；不會把手寫圖片傳給外部服務。KaTeX 的檔案已置於 `static/vendor/katex`，執行時不使用 CDN。

## 一次安裝

1. 安裝 [Python 3.11（64-bit）](https://www.python.org/downloads/windows/)，安裝時勾選 **Add python.exe to PATH**。
2. 在專案根目錄執行：

```powershell
.\setup.ps1
```

此腳本會建立 `.venv`、安裝 CPU 版 PyTorch、FastAPI 與 pix2tex。pix2tex 的模型權重會在第一次辨識時下載；之後可離線辨識。

## 啟動

```powershell
.\.venv\Scripts\python.exe -m uvicorn app:app --reload
```

瀏覽器開啟 http://127.0.0.1:8000 。首次按下「辨識」時，模型載入和權重下載可能需要較久。

## 範圍

目前功能包括：手寫、清除、撤回上一筆（Ctrl+Z）、單一符號／完整公式模式、LaTeX 顯示、KaTeX 預覽、複製、首次個人化筆跡訓練、插入符號面板、常用公式庫，以及本機候選偏好排序。

個人筆畫資料、偏好紀錄與公式庫都存放於瀏覽器 localStorage；不會上傳手寫圖片。單一符號保留所有模型候選，筆畫數只顯示為參考提示；完整公式則依個人偏好與公式庫筆跡特徵排序。模型候選採漸進式取得：單一符號預設跑三次採樣、完整公式預設一次，需要時可按「取得更多候選」。每次辨識完成會顯示實際採樣耗時。
