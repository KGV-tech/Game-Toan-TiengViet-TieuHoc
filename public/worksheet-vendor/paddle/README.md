# Browser OCR assets

These files are served from the game's own origin. No image is uploaded to an OCR service.
The first use downloads roughly 43 MB; no API key or token billing is involved.

- @paddleocr/paddleocr-js 0.4.2 and official Paddle inference models: Apache-2.0, see PADDLE-LICENSE.
- OpenCV.js 4.10.0-release.1: Apache-2.0, see OPENCV-LICENSE.
- ONNX Runtime Web 1.30.0: MIT, see ONNX-LICENSE.
- js-yaml: MIT, see JS-YAML-LICENSE.
- Clipper 6.4.2.2, Angus Johnson 2010-2017 / JavaScript translation by Timo: Boost Software License 1.0, see CLIPPER-LICENSE. Its embedded JSBN by Tom Wu is covered by JSBN-LICENSE.

Official model downloads:
https://paddle-model-ecology.bj.bcebos.com/paddlex/official_inference_model/paddle3.0.0/PP-OCRv6_small_det.tar
https://paddle-model-ecology.bj.bcebos.com/paddlex/official_inference_model/paddle3.0.0/latin_PP-OCRv5_mobile_rec.tar

Checksums and sizes are in manifest.json. Model dictionaries lack full Vietnamese tone coverage; the app complements recognition with the existing local Tesseract Vietnamese reader. See docs/WORKSHEET_OCR_PIPELINE.md.

Rebuild worker/runtime assets with node scripts/build-worksheet-ocr.cjs after npm ci.
The model archives are committed; the build does not download models.