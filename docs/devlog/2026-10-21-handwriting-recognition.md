# 2026-10-21：手寫公式辨識，先承認模型看不懂再說

我原本想做的是一個能直接在 Canvas 上寫公式、在本機轉成 LaTeX 的工具。起初以為接上 pix2tex，再加一點候選排序就夠了；做到後面才發現我卡的不是 UI，而是「手寫」本身。pix2tex 主攻印刷公式，手寫希臘字母常常根本不在 top-k，偶爾還會湊出無法渲染的 LaTeX，例如 `\leqT`。正確答案不在候選裡，後面再漂亮的排序都救不了。

我先沒有換模型，而是做補強：筆畫數、起終點、轉角、曲率、封閉區域、尾巴，再加上 IndexedDB 的個人樣本庫。想法是讓 pix2tex 看整張圖，樣本庫記得我平常怎麼寫 `\beta`、`\xi`、`\Sigma`。這裡我卡了兩天，診斷後才發現樣本庫找到的符號只顯示推薦提示，沒有真的加入可點選候選。使用者寫 `\xi`、pix2tex 只回 `\oplus` 時，系統明明看見相似 xi 樣本，卻不讓人選 xi。現在回頭看，這個決定是錯的。另一個錯是 10–19 筆樣本的幾何權重太自信；它應再乘 0.5，少於 4 筆時乾脆不參與重排。

所以補強機制應該很直白：前五個樣本中某符號至少出現兩次，就真的補進候選；使用者設了優先類別而 pix2tex 沒給時，也用樣本庫召回。這不是說規則比模型聰明，而是承認模型的候選空間有洞。

後來我找到 Detexify。它不是公式辨識器，而是單符號形狀匹配工具。我原先注意到的是它常被提到的約 6.4 萬筆眾包資料，以及 27 維特徵加 k-NN 的做法；這正好對到目前最痛的單符號問題。實際下載又踩坑：README 指向的 Google Drive 可以瀏覽，原始 `detexify.sql.gz` 下載卻導向登入頁。我沒有把 HTML 當資料檔，而改用 Zenodo 的 HWRT 2015 鏡像，它明示約 90% 來自 Detexify。

目前盤點到 168,233 筆、369 個標籤（1,000 筆抽樣，非全量）。特徵是筆畫數、六條水平與六條垂直 ink density、八方向直方圖、長寬比、總長度、首筆起點和末筆終點；k=5、Euclidean distance。在分層 80/20 held-out 中隨機抽 1,000 筆，Top-1 是 74.6%，Top-5 是 90.4%（1,000 筆抽樣，非全量）。這不是全量成績：完整 33,645 筆 exact brute-force k-NN 對純 CPU 太慢，不能把這個數字寫成全資料集評估。最常見混淆也很像人會犯的：`\Sigma → \sum`、`\cdot → \dotsc`、`\prod → \Pi`。

Underleaf 這類商業服務走 VLM 整頁辨識，效果看起來很高，但閉源又非本地，反而讓我確認方向還是 local-first。BTTR（約 6.5M、13 MB）和 HMER（約 6.8M、7 MB）夠小，但我目前看的版本都缺 `\xi` 與 `\partial`；Qwen2-VL-2B 量化後約 1 GB，公式 BLEU 也未必贏 pix2tex。小、CPU 可跑、符號完整，三件事很難同時拿到。

我不想把每次手寫都上傳給外部服務，也不想讓辨識功能被帳號、連線或用量成本綁住。離線能用、資料留在自己的瀏覽器和電腦裡，對我不是口號，而是實際會影響我願不願意天天用它的條件。

更根本的是 online handwriting。Rosetta 和 CROHME 讓我看到，直接保留 `(x, y, pen_state)` 序列，模型才知道哪裡停筆、哪一筆先寫；但這代表前端、後端和訓練管線都要重寫。

現在有四條路：A，繼續打磨 pix2tex 加補強，接受極限；B，換 BTTR/HMER，小而更專精但覆蓋變窄；C，改 online handwriting，最根本也最花工；D，等 GPU 上 VLM 或微調。80% 也要拆開看：純 CPU 本地時，CROHME 的完整 expression recognition 就算頂尖方法也常在 60% 上下；95% 以上的服務多半有大 VLM 與雲端算力。單符號可以靠樣本庫與 Detexify 類資料拉高，完整公式在本地 CPU 上 50–60% 才是合理期待。

下一步先跑一次 BTTR 或 HMER 的 GGUF，用我自己寫的公式測，不只看 CROHME 的 52.8%；再確認 Detexify k-NN 的全量評估是否值得。ViT 論文也查到了公開程式碼，但它的 BLEU/Levenshtein 是在訓練集子集上算，不能直接當泛化成績。之後再選 A、B、C 或 D，不要同時追四條路。接下來兩週先跑 BTTR 和 HMER 的 GGUF，用自己寫的公式測一輪，再決定要不要換引擎；Detexify 的 k-NN 全量評估排在後面。

## 回頭看

補強機制最有價值的地方，不只是把某一次 `\xi` 漏掉的辨識修回來，而是逼我看清 pix2tex 的候選空間到底少了什麼。知道錯誤是「排序差」還是「根本沒被召回」，比再堆一個單一功能重要得多，因為它決定下一步該補樣本、換引擎，還是重做輸入表示。

## 參考資料

- [pix2tex / LaTeX-OCR](https://github.com/lukas-blecher/LaTeX-OCR)
- [Detexify data](https://github.com/kirel/detexify-data)
- [Underleaf](https://underleaf.ai/)
- [BTTR](https://github.com/Green-Wood/BTTR)
- [HMER lightweight GGUF](https://huggingface.co/cstr/hmer-handwritten-math-gguf)
- [Qwen2-VL](https://github.com/QwenLM/Qwen2-VL)
- [Rosetta](https://github.com/ovinicius71/Rosetta)
- [CROHME](https://tc11.cvc.uab.es/datasets/CROHME-2014_2)
- [ViT 論文](https://arxiv.org/abs/2412.03853)
- [HiE-VL](https://github.com/guohy17/HiE-VL)
